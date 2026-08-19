import { CloudflareAILLMProvider } from '../llm';
import { aggregateDailySignals } from '../discovery';
import { clusterSignals, analyzeCluster } from '../analysis';
import { generateContent, determineFormatPreference } from '../content';
import { ThreadsClient } from '../threads';

export async function runAutonomousCycle(db: D1Database, agentId: string, ai: any, env?: any) {
  const cycleId = crypto.randomUUID();
  const startTime = Date.now();
  const nowStr = new Date().toISOString();
  
  // Track metrics
  let signalsDiscovered = 0;
  let signalsNew = 0;
  let clustersFormed = 0;
  let outcome = 'ERROR';
  let errorMsg = '';
  
  // Setup runtime log
  const dayOfWeek = new Date().getDay();
  const preferredFormat = determineFormatPreference(dayOfWeek);
  
  await db.prepare(
    "INSERT INTO runtime_cycles (id, agent_id, started_at, day_of_week, format_preference) VALUES (?, ?, ?, ?, ?)"
  ).bind(cycleId, agentId, nowStr, dayOfWeek.toString(), preferredFormat).run();

  try {
    const llm = new CloudflareAILLMProvider(db, ai, agentId, cycleId);

    // 1. GATHER (Curiosity + Search)
    const rawSignals = await aggregateDailySignals(db, llm, env);
    signalsDiscovered = rawSignals.length;
    signalsNew = rawSignals.length;
    
    if (signalsNew > 0) {
      // Save signals to DB
      const stmt = db.prepare("INSERT INTO signals (id, source, title, summary, url, published_at, discovered_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      const batch = rawSignals.map(s => stmt.bind(s.id, s.source, s.title, s.summary, s.url, s.publishedAt, nowStr, JSON.stringify(s.metadata)));
      await db.batch(batch);
    }

    if (signalsNew < 3) {
      outcome = 'SKIPPED';
      errorMsg = 'Insufficient new signals.';
      await logSkip(db, cycleId, errorMsg);
      await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
      return;
    }

    // 2. CLUSTER
    const cluster = await clusterSignals(rawSignals, llm);
    if (!cluster) {
      outcome = 'SKIPPED';
      errorMsg = 'Could not form significant clusters.';
      await logSkip(db, cycleId, errorMsg);
      await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
      return;
    }
    clustersFormed = 1;

    // Save cluster to DB
    await db.prepare(
      "INSERT INTO signal_clusters (id, cycle_id, theme, signal_count, significance_score, selected, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)"
    ).bind(cluster.id, cycleId, cluster.theme, cluster.signals.length, cluster.significance_score, nowStr).run();

    // Link signals to cluster
    const updateSigStmt = db.prepare("UPDATE signals SET cluster_id = ? WHERE id = ?");
    await db.batch(cluster.signals.map(s => updateSigStmt.bind(cluster.id, s.id)));

    if (cluster.significance_score < 0.6) {
      outcome = 'SKIPPED';
      errorMsg = 'Winning cluster significance score too low.';
      await logSkip(db, cycleId, errorMsg, cluster.theme, cluster.significance_score);
      await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
      return;
    }

    // 3. ANALYZE
    const analysis = await analyzeCluster(cluster, llm);
    if (!analysis) {
      outcome = 'SKIPPED';
      errorMsg = 'Analysis failed.';
      await logSkip(db, cycleId, errorMsg);
      await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
      return;
    }

    if (analysis.qualityScore < 0.7) {
      outcome = 'SKIPPED';
      errorMsg = 'Analysis quality score too low. Rejected by self-critique.';
      await logSkip(db, cycleId, errorMsg, analysis.synthesis, analysis.qualityScore);
      await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
      return;
    }

    // 4. CRAFT
    const { results: recentPosts } = await db.prepare("SELECT content FROM posts ORDER BY created_at DESC LIMIT 3").all();
    const generated = await generateContent(analysis, preferredFormat, llm, recentPosts);
    if (!generated) {
      outcome = 'SKIPPED';
      errorMsg = 'Content generation failed.';
      await logSkip(db, cycleId, errorMsg);
      await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
      return;
    }

    // 5. PUBLISH
    const postId = crypto.randomUUID();
    let xTweetId = null;
    let xThreadIds = null;
    let postedAt = null;

    if (env && env.THREADS_ACCESS_TOKEN && env.THREADS_USER_ID) {
      const threadsClient = new ThreadsClient({
        accessToken: env.THREADS_ACCESS_TOKEN,
        userId: env.THREADS_USER_ID
      });

      try {
        let textToPost = '';
        if (generated.format === 'thread' && Array.isArray(generated.content)) {
          textToPost = generated.content.join('\n\n---\n\n');
        } else if (typeof generated.content === 'string') {
          textToPost = generated.content;
        } else if (Array.isArray(generated.content)) {
          textToPost = generated.content[0];
        }

        if (textToPost) {
          const id = await threadsClient.postThread(textToPost);
          if (id) {
            xTweetId = id; // Re-using DB column x_tweet_id for Threads ID
            postedAt = new Date().toISOString();
          }
        }
      } catch (err) {
        console.error('Failed to post to Threads:', err);
      }
    }

    // Save Post to DB
    await db.prepare(
      `INSERT INTO posts (id, agent_id, cycle_id, format, content, contrarian_angle, incentive_insight, system_loop, sources_used, quality_score, x_tweet_id, x_thread_ids, created_at, posted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      postId, agentId, cycleId, generated.format, 
      JSON.stringify(generated.content), 
      analysis.contrarianAngle, analysis.incentiveInsight, analysis.systemLoop, 
      JSON.stringify(cluster.signals.map(s => s.id)),
      analysis.qualityScore,
      xTweetId, xThreadIds, nowStr, postedAt
    ).run();

    // Link signals to post
    const linkSigStmt = db.prepare("UPDATE signals SET used_in_post = ? WHERE id = ?");
    await db.batch(cluster.signals.map(s => linkSigStmt.bind(postId, s.id)));

    // 6. REMEMBER
    // Update total posts and last wake
    await db.prepare("UPDATE agent SET total_posts = total_posts + 1, last_wake_at = ? WHERE id = ?").bind(nowStr, agentId).run();

    outcome = 'PUBLISHED';
    await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, '', generated.format);
    
  } catch (err: any) {
    console.error('Cycle Error:', err);
    outcome = 'ERROR';
    errorMsg = err.message || String(err);
    await finishCycle(db, cycleId, startTime, signalsDiscovered, signalsNew, clustersFormed, outcome, errorMsg);
  }
}

async function logSkip(db: D1Database, cycleId: string, reason: string, bestContent?: string, bestScore?: number) {
  const id = crypto.randomUUID();
  await db.prepare(
    "INSERT INTO skipped_cycles (id, cycle_id, reason, best_candidate_content, best_candidate_score, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, cycleId, reason, bestContent || null, bestScore || null, new Date().toISOString()).run();
}

async function finishCycle(
  db: D1Database, cycleId: string, startTime: number,
  disc: number, newSig: number, clus: number, outcome: string, errMsg: string, fmtUsed?: string
) {
  const duration = Date.now() - startTime;
  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE runtime_cycles 
     SET completed_at = ?, duration_ms = ?, signals_discovered = ?, signals_new = ?, clusters_formed = ?, outcome = ?, error_message = ?, format_used = ?
     WHERE id = ?`
  ).bind(now, duration, disc, newSig, clus, outcome, errMsg || null, fmtUsed || null, cycleId).run();

  if (outcome === 'SKIPPED') {
    await db.prepare(`UPDATE agent SET total_skips = total_skips + 1 WHERE id = (SELECT agent_id FROM runtime_cycles WHERE id = ?)`).bind(cycleId).run();
  }
}

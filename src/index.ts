import { Hono } from 'hono'
import { runAutonomousCycle } from './runtime/scheduler'
import { renderDashboard } from './ui/dashboard'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  try {
    const db = c.env.DB;
    
    // 1. Get Agent
    const agent = await db.prepare("SELECT * FROM agents LIMIT 1").first<any>();
    if (!agent) {
       return c.html(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Agent Not Initialized</h1>
          <p>Please initialize the agent via POST /api/agent/init first.</p>
        </div>
       `);
    }

    // 2. Get Posts (all)
    const { results: posts } = await db.prepare(`
      SELECT text, rationale, created_at
      FROM posts
      WHERE agent_id = ? AND status = 'PUBLISHED'
      ORDER BY created_at DESC
    `).bind(agent.id).all();

    // 3. Get Graveyard (Rejections - all)
    const { results: rejections } = await db.prepare(`
      SELECT c.title, e.rationale, e.decided_at
      FROM editorial_decisions e
      JOIN candidates c ON e.candidate_id = c.id
      WHERE e.decision = 'REJECT'
      ORDER BY e.decided_at DESC
    `).all();

    // 4. Get Memories
    const { results: memories } = await db.prepare(`
      SELECT memory_type, content as memory_text, created_at
      FROM memories
      ORDER BY created_at DESC LIMIT 10
    `).all();

    // 5. Get Runtime Cycles (heartbeats - all)
    const { results: cycles } = await db.prepare(`
      SELECT started_at, completed_at, status, candidates_discovered, candidates_approved, candidates_rejected, posts_published, error_message, metadata
      FROM runtime_cycles
      WHERE agent_id = ?
      ORDER BY started_at DESC
    `).bind(agent.id).all();

    // 6. Get Current State
    const state = await db.prepare(`
      SELECT state, locked_until, last_successful_cycle_at
      FROM runtime_state
      WHERE agent_id = ?
    `).bind(agent.id).first();

    // 7. Get Total Spent
    const costQuery = await db.prepare(`
      SELECT SUM(estimated_cost) as total
      FROM llm_usage
      WHERE agent_id = ?
    `).bind(agent.id).first<any>();
    const totalSpent = costQuery?.total || 0;

    const html = renderDashboard({ agent, posts, rejections, memories, cycles, state, totalSpent });
    return c.html(html);
  } catch (error) {
    console.error(error);
    return c.text('Internal Server Error', 500);
  }
});

app.post('/internal/runtime/wake', async (c) => {
  // Internal endpoint to simulate cron trigger
  try {
    const { results: agents } = await c.env.DB.prepare("SELECT id FROM agents WHERE status = 'ACTIVE'").all<{ id: string }>();

    for (const agent of agents) {
      // In a real CF worker we might use ctx.waitUntil, but here we can just await for the test endpoint
      await runAutonomousCycle(c.env.DB, agent.id, c.env.AI);
    }
    return c.json({ status: 'ok', agentsWoken: agents.length });
  } catch (error) {
    console.error('Wake Error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})


app.post('/api/agent/init', async (c) => {
  try {
    let body;
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    
    const persona = body?.persona

    if (!persona || !persona.name || !persona.domain) {
      return c.json({ error: 'Invalid persona configuration' }, 400)
    }

    // Check if an active agent already exists
    const existingAgent = await c.env.DB.prepare(
      "SELECT id FROM agents WHERE status = 'ACTIVE' LIMIT 1"
    ).first<{ id: string }>();

    if (existingAgent) {
      return c.json({ agentId: existingAgent.id })
    }

    const agentId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    await c.env.DB.batch([
      c.env.DB.prepare(
        "INSERT INTO agents (id, name, domain, status, created_at, updated_at) VALUES (?, ?, ?, 'ACTIVE', ?, ?)"
      ).bind(agentId, persona.name, persona.domain, now, now),
      c.env.DB.prepare(
        "INSERT INTO runtime_state (agent_id, state, updated_at) VALUES (?, 'IDLE', ?)"
      ).bind(agentId, now)
    ]);

    return c.json({ agentId })
  } catch (error) {
    console.error('Init Error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

app.get('/api/agent/feed', async (c) => {
  const agentId = c.req.query('agentId')
  if (!agentId) {
    return c.json({ error: 'agentId is required' }, 400)
  }

  try {
    // Check if agent exists
    const agent = await c.env.DB.prepare(
      "SELECT id FROM agents WHERE id = ?"
    ).bind(agentId).first();

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404)
    }

    // Fetch posts
    const { results } = await c.env.DB.prepare(
      `SELECT 
         id, 
         created_at as createdAt, 
         text, 
         rationale, 
         COALESCE(
           (SELECT json_group_array(s.url) 
            FROM post_sources ps 
            JOIN sources s ON ps.source_id = s.id 
            WHERE ps.post_id = posts.id), 
           '[]'
         ) as sources
       FROM posts
       WHERE agent_id = ? AND status = 'PUBLISHED'
       ORDER BY created_at DESC`
    ).bind(agentId).all();

    const posts = results.map(row => {
      let createdAt = row.createdAt as string;
      if (createdAt && !createdAt.endsWith('Z')) {
        // Attempt to convert SQLite CURRENT_TIMESTAMP "YYYY-MM-DD HH:MM:SS" to ISO8601 UTC
        createdAt = createdAt.replace(' ', 'T') + 'Z';
      }
      
      let parsedSources: string[] = [];
      try {
        parsedSources = JSON.parse(row.sources as string);
        // Handle case where SQLite json_group_array might return [null]
        if (parsedSources.length === 1 && parsedSources[0] === null) {
            parsedSources = [];
        }
      } catch (e) {
        parsedSources = [];
      }

      return {
        id: row.id,
        createdAt,
        text: row.text,
        rationale: row.rationale,
        sources: parsedSources
      };
    });

    return c.json({ posts })
  } catch (error) {
    console.error('Feed Error:', error);
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default {
  fetch: app.fetch,
  
  // Scheduled trigger for autonomous agent execution
  async scheduled(event: any, env: Bindings, ctx: any) {
    console.log(`Cron triggered at ${new Date(event?.scheduledTime || Date.now()).toISOString()}`)
    const { results: agents } = await env.DB.prepare("SELECT id FROM agents WHERE status = 'ACTIVE'").all<{ id: string }>();

    for (const agent of agents) {
      ctx.waitUntil(runAutonomousCycle(env.DB, agent.id, env.AI));
    }
  }
}

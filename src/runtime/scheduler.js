// src/runtime/scheduler.ts
import { discoverCandidates } from '../discovery';
import { evaluateCandidates } from '../editorial';
import { generateContent } from '../content';
import { CloudflareAILLMProvider, MockLLMProvider } from '../llm';
export async function runAutonomousCycle(db, agentId, ai) {
    // Fetch agent details for persona injection
    const agent = await db.prepare("SELECT * FROM agents WHERE id = ?").bind(agentId).first();
    if (!agent)
        return;
    // 1. Check lock
    const state = await db.prepare("SELECT state, locked_until FROM runtime_state WHERE agent_id = ?").bind(agentId).first();
    if (!state)
        return;
    const now = new Date();
    if (state.locked_until && new Date(state.locked_until) > now) {
        console.log(`Agent ${agentId} is currently locked until ${state.locked_until}`);
        return;
    }
    // Set lock for 5 minutes
    const lockedUntil = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    await db.prepare("UPDATE runtime_state SET state = 'RUNNING', locked_until = ?, updated_at = ? WHERE agent_id = ?")
        .bind(lockedUntil, now.toISOString(), agentId).run();
    const cycleId = crypto.randomUUID();
    await db.prepare("INSERT INTO runtime_cycles (id, agent_id, status, started_at) VALUES (?, ?, 'RUNNING', ?)").bind(cycleId, agentId, now.toISOString()).run();
    const llm = ai ? new CloudflareAILLMProvider(db, ai, agentId, cycleId) : new MockLLMProvider();
    try {
        // 2. Discover Candidates (now returns stats)
        console.log(`Starting discovery for agent ${agentId}`);
        const discoveryStats = await discoverCandidates(db, agentId);
        // Store discovery stats in the cycle
        await db.prepare("UPDATE runtime_cycles SET candidates_discovered = ?, metadata = ? WHERE id = ?")
            .bind(discoveryStats.newInserted, JSON.stringify({
            totalScanned: discoveryStats.totalScanned,
            newCandidates: discoveryStats.newInserted,
            sources: discoveryStats.sourceBreakdown
        }), cycleId).run();
        // 3. Editorial Evaluation
        console.log(`Evaluating candidates for agent ${agentId}`);
        const approvedCandidates = await evaluateCandidates(db, agent, llm, cycleId);
        // 4. Content Generation and Publication
        console.log(`Generating content for ${approvedCandidates.length} approved candidates`);
        let publishedCount = 0;
        for (const candidate of approvedCandidates) {
            const published = await generateContent(db, agent, candidate, llm, cycleId);
            if (published)
                publishedCount++;
        }
        // 5. Update State
        const finishedAt = new Date().toISOString();
        await db.prepare("UPDATE runtime_cycles SET status = 'COMPLETED', completed_at = ?, posts_published = ? WHERE id = ?")
            .bind(finishedAt, publishedCount, cycleId).run();
        await db.prepare("UPDATE runtime_state SET state = 'IDLE', locked_until = NULL, last_successful_cycle_at = ?, updated_at = ? WHERE agent_id = ?")
            .bind(finishedAt, finishedAt, agentId).run();
    }
    catch (error) {
        console.error('Cycle Error:', error);
        const failedAt = new Date().toISOString();
        await db.prepare("UPDATE runtime_cycles SET status = 'FAILED', error_message = ?, completed_at = ? WHERE id = ?")
            .bind(String(error), failedAt, cycleId).run();
        await db.prepare("UPDATE runtime_state SET state = 'ERROR', locked_until = NULL, last_failed_cycle_at = ?, updated_at = ? WHERE agent_id = ?")
            .bind(failedAt, failedAt, agentId).run();
    }
}

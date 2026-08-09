export async function evaluateCandidates(db, agent, llm, cycleId) {
    // Fetch pending candidates
    const { results: candidates } = await db.prepare("SELECT id, title FROM candidates WHERE agent_id = ? AND status = 'PENDING' LIMIT 5").bind(agent.id).all();
    const approved = [];
    const now = new Date().toISOString();
    for (const candidate of candidates) {
        try {
            // Persona Injection
            const prompt = `EDITORIAL_JUDGMENT:
You are ${agent.name}, an expert evaluating news for the domain of "${agent.domain}".
Evaluate if this topic is worth publishing based on its second-order effects.
Is it highly significant and novel? Will it matter in 5 years?
Topic: ${candidate.title}

CRITICAL: Your 'rationale' MUST explicitly answer these 3 points (whether PUBLISH or REJECT):
1) What the topic fundamentally is
2) Why you chose to PUBLISH or REJECT it
3) Its expected long-term paradigm impact (or lack thereof)`;
            const decision = await llm.generateStructured(prompt, { decision: "PUBLISH|REJECT", rationale: "string", score: "number" }, 'triage');
            if (!decision) {
                // Fail closed on LLM format or timeout errors
                console.warn(`LLM failed to evaluate candidate ${candidate.id}. Defaulting to REJECT.`);
                await db.prepare("UPDATE candidates SET status = 'REJECTED' WHERE id = ?").bind(candidate.id).run();
                await db.prepare("UPDATE runtime_cycles SET candidates_rejected = candidates_rejected + 1 WHERE id = ?").bind(cycleId).run();
                const decisionId = crypto.randomUUID();
                await db.prepare("INSERT INTO editorial_decisions (id, agent_id, candidate_id, decision, rationale, score, decided_at) VALUES (?, ?, ?, 'REJECT', '1) Topic: Unknown. 2) Decision: REJECT. 3) Impact: Fail-closed due to LLM timeout or unrecoverable error.', 0.0, ?)").bind(decisionId, agent.id, candidate.id, now).run();
                continue;
            }
            const decisionId = crypto.randomUUID();
            await db.prepare("INSERT INTO editorial_decisions (id, agent_id, candidate_id, decision, rationale, score, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(decisionId, agent.id, candidate.id, decision.decision, decision.rationale, decision.score, now).run();
            if (decision.decision === 'PUBLISH' && decision.score > 0.7) {
                approved.push({
                    id: candidate.id,
                    title: candidate.title,
                    score: decision.score
                });
            }
            else {
                await db.prepare("UPDATE candidates SET status = 'REJECTED' WHERE id = ?").bind(candidate.id).run();
                await db.prepare("UPDATE runtime_cycles SET candidates_rejected = candidates_rejected + 1 WHERE id = ?").bind(cycleId).run();
            }
        }
        catch (e) {
            console.error(`Error evaluating candidate ${candidate.id}:`, e);
        }
    }
    // Find the absolute best candidate
    if (approved.length === 0)
        return [];
    // Sort by score descending
    approved.sort((a, b) => b.score - a.score);
    const bestCandidate = approved[0];
    const skippedCandidates = approved.slice(1);
    // Update DB for best candidate
    await db.prepare("UPDATE candidates SET status = 'APPROVED' WHERE id = ?").bind(bestCandidate.id).run();
    await db.prepare("UPDATE runtime_cycles SET candidates_approved = candidates_approved + 1 WHERE id = ?").bind(cycleId).run();
    // Mark the others as SKIPPED
    for (const skipped of skippedCandidates) {
        await db.prepare("UPDATE candidates SET status = 'SKIPPED' WHERE id = ?").bind(skipped.id).run();
        await db.prepare("UPDATE runtime_cycles SET candidates_rejected = candidates_rejected + 1 WHERE id = ?").bind(cycleId).run();
        await db.prepare("UPDATE editorial_decisions SET decision = 'REJECT', rationale = rationale || ' [Ultimately REJECTED: Outscored by a higher priority topic in this cycle]' WHERE candidate_id = ?").bind(skipped.id).run();
    }
    return [bestCandidate];
}

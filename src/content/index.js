export async function generateContent(db, agent, candidate, llm, cycleId) {
    try {
        // 1. Get Sources
        const { results: sources } = await db.prepare("SELECT s.id, s.url, s.title FROM sources s JOIN candidate_sources cs ON s.id = cs.source_id WHERE cs.candidate_id = ?").bind(candidate.id).all();
        // 1.5. Get Memories for Continuity
        const { results: recentMemories } = await db.prepare("SELECT content FROM memories WHERE agent_id = ? ORDER BY created_at DESC LIMIT 5").bind(agent.id).all();
        const memoryContext = recentMemories.length > 0
            ? `\nPREVIOUSLY PUBLISHED THESES (Do not repeat these concepts):\n${recentMemories.map(m => `- ${m.content}`).join('\n')}`
            : '';
        // 2. Generate Content with Persona Injection
        const prompt = `CONTENT_GENERATION:
You are ${agent.name}, an expert writing about "${agent.domain}".
Write an insightful, thesis-driven post about the following topic. Do not just summarize.
Focus on second-order consequences. Your tone should reflect your expertise.${memoryContext}

Topic: ${candidate.title}

CRITICAL: Your 'rationale' MUST explicitly answer:
1) Why this topic was selected
2) Why it is relevant right now
3) The source(s) of information`;
        const postData = await llm.generateStructured(prompt, { text: "string", rationale: "string" }, 'reasoning');
        // Content Validation
        if (!postData || !postData.text || postData.text.length < 10) {
            console.warn(`LLM failed validation for candidate ${candidate.id}. Aborting generation.`);
            return false;
        }
        const now = new Date().toISOString();
        const postId = crypto.randomUUID();
        // 3. Persist Post
        await db.prepare("INSERT INTO posts (id, agent_id, candidate_id, text, rationale, status, created_at, published_at) VALUES (?, ?, ?, ?, ?, 'PUBLISHED', ?, ?)").bind(postId, agent.id, candidate.id, postData.text, postData.rationale, now, now).run();
        // 4. Link Sources
        for (const source of sources) {
            await db.prepare("INSERT INTO post_sources (post_id, source_id, relevance_score) VALUES (?, ?, 1.0)").bind(postId, source.id).run();
        }
        // 3. Update candidate status
        await db.prepare("UPDATE candidates SET status = 'PUBLISHED' WHERE id = ?").bind(candidate.id).run();
        // 4. Memory Extraction (Durable Knowledge)
        console.log(`Extracting memory for candidate ${candidate.id}`);
        const memoryData = await llm.generateStructured(`MEMORY_EXTRACTION: Based on the post you just wrote, extract the core durable knowledge or thesis. Post: ${postData.text}`, { title: "string", statement: "string", confidence: "number (0.0-1.0)", is_new_thesis: "boolean" }, 'reasoning');
        if (memoryData) {
            const memoryId = crypto.randomUUID();
            let thesisId = null;
            if (memoryData.is_new_thesis) {
                thesisId = crypto.randomUUID();
                await db.prepare("INSERT INTO theses (id, agent_id, title, statement, confidence, first_observed_at, last_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(thesisId, agent.id, memoryData.title, memoryData.statement, memoryData.confidence, now, now).run();
                // Link post to the new thesis
                await db.prepare("UPDATE posts SET thesis_id = ? WHERE id = ?").bind(thesisId, postId).run();
            }
            await db.prepare("INSERT INTO memories (id, agent_id, memory_type, title, content, importance, source_post_id, source_candidate_id, source_thesis_id, created_at, updated_at) VALUES (?, ?, 'OBSERVATION', ?, ?, ?, ?, ?, ?, ?, ?)").bind(memoryId, agent.id, memoryData.title, memoryData.statement, memoryData.confidence, postId, candidate.id, thesisId, now, now).run();
        }
        // 6. Record Publication Event
        const eventId = crypto.randomUUID();
        await db.prepare("INSERT INTO publication_events (id, agent_id, post_id, event_type, status, created_at) VALUES (?, ?, ?, 'PUBLISHED', 'SUCCESS', ?)").bind(eventId, agent.id, postId, now).run();
        return true;
    }
    catch (error) {
        console.error(`Error generating content for candidate ${candidate.id}:`, error);
        return false;
    }
}

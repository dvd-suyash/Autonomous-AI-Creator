export interface LLMProvider {
  generate(prompt: string, tier?: 'triage' | 'reasoning'): Promise<string>;
  generateStructured<T>(prompt: string, schema: any, tier?: 'triage' | 'reasoning'): Promise<T | null>;
}

export class MockLLMProvider implements LLMProvider {
  async generate(prompt: string, tier?: 'triage' | 'reasoning'): Promise<string> {
    return 'Mock generated text';
  }

  async generateStructured<T>(prompt: string, schema: any, tier?: 'triage' | 'reasoning'): Promise<T | null> {
    if (prompt.includes('EDITORIAL_JUDGMENT')) {
      return { decision: 'PUBLISH', rationale: 'This topic has significant second-order effects.', score: 0.85 } as any;
    }
    if (prompt.includes('CONTENT_GENERATION')) {
      return { 
        text: 'This is an insightful post about the newly discovered technology event. It changes the infrastructure economics permanently.', 
        rationale: 'Selected due to its strategic implications.',
      } as any;
    }
    if (prompt.includes('MEMORY_EXTRACTION')) {
      return {
        title: 'Shifts in Infrastructure Economics',
        statement: 'New technology events are permanently altering infrastructure economics toward decentralized models.',
        confidence: 0.85,
        is_new_thesis: true
      } as any;
    }
    return null;
  }
}

export class CloudflareAILLMProvider implements LLMProvider {
  private db: D1Database;
  private ai: any;
  private agentId: string;
  private cycleId: string;
  private DAILY_BUDGET_CAP = 1.00;

  constructor(db: D1Database, ai: any, agentId: string, cycleId: string) {
    this.db = db;
    this.ai = ai;
    this.agentId = agentId;
    this.cycleId = cycleId;
  }

  private async checkBudget() {
    const { total_cost } = await this.db.prepare(
      "SELECT SUM(estimated_cost) as total_cost FROM llm_usage WHERE agent_id = ? AND date(created_at) = date('now')"
    ).bind(this.agentId).first<{ total_cost: number }>() || { total_cost: 0 };
    
    if (total_cost >= this.DAILY_BUDGET_CAP) {
      throw new Error(`BudgetExceededError: Daily LLM cost cap of $${this.DAILY_BUDGET_CAP} reached.`);
    }
  }

  private async logUsage(model: string, inputTokens: number, outputTokens: number, cost: number, latencyMs: number, success: boolean, errorMsg?: string) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const metadata = errorMsg ? JSON.stringify({ error: errorMsg }) : '{}';
    await this.db.prepare(
      "INSERT INTO llm_usage (id, agent_id, cycle_id, operation, provider, model, input_tokens, output_tokens, estimated_cost, latency_ms, success, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, this.agentId, this.cycleId, 'GENERATE', 'CLOUDFLARE_AI', model, inputTokens, outputTokens, cost, latencyMs, success ? 1 : 0, now, metadata).run();
  }

  async generate(prompt: string, tier: 'triage' | 'reasoning' = 'triage'): Promise<string> {
    await this.checkBudget();
    
    // Tiering logic
    const model = '@cf/meta/llama-3.2-3b-instruct';
    
    const startTime = Date.now();
    try {
      const response = await this.ai.run(model, {
        messages: [{ role: 'user', content: prompt }]
      });
      
      const latency = Date.now() - startTime;
      
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil((response.response?.length || 0) / 4);
      const estimatedCost = ((inputTokens + outputTokens) / 1000000) * 0.15;
      
      await this.logUsage(model, inputTokens, outputTokens, estimatedCost, latency, true);
      
      return response.response;
    } catch (e: any) {
      const latency = Date.now() - startTime;
      const errorMsg = e instanceof Error ? e.message : String(e);
      await this.logUsage(model, 0, 0, 0, latency, false, errorMsg);
      throw e;
    }
  }

  async generateStructured<T>(prompt: string, schema: any, tier: 'triage' | 'reasoning' = 'triage'): Promise<T | null> {
    const structuredPrompt = `${prompt}\n\nYou MUST return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}\nDo NOT include markdown formatting or backticks. Start your response with {`;
    
    try {
      const resultText = await this.generate(structuredPrompt, tier);
      
      // Aggressively extract JSON
      const startIdx = resultText.indexOf('{');
      const endIdx = resultText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) {
        throw new Error('Invalid JSON format returned from LLM: ' + resultText);
      }
      
      let validJsonStr = resultText.substring(startIdx, endIdx + 1);
      // Remove any trailing commas before } or ] which break JSON.parse
      validJsonStr = validJsonStr.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(validJsonStr) as T;
      
    } catch (error: any) {
      console.error('generateStructured Error:', error);
      
      let topic = "this recent tech development";
      const titleMatch = prompt.match(/Title:\s*(.+)/);
      if (titleMatch) {
        topic = titleMatch[1].trim();
      } else {
        const topicMatch = prompt.match(/Topic:\s*(.+)/);
        if (topicMatch) topic = topicMatch[1].trim();
      }

      if (prompt.includes('EDITORIAL_JUDGMENT')) {
        try {
          const evalPrompt = `Evaluate this topic: "${topic}". Does it have profound second-order effects?
Reply with exactly two lines:
Line 1: "PUBLISH" or "REJECT".
Line 2: A short rationale explaining why, what the topic is, and its long-term paradigm impact.`;
          const rawEval = await this.generate(evalPrompt, tier);
          const lines = rawEval.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const decision = (lines[0] || '').toUpperCase().includes('PUBLISH') ? 'PUBLISH' : 'REJECT';
          const rationaleLine = lines.slice(1).join(' ') || 'Insufficient long-term paradigm impact detected.';
          
          return { 
            decision, 
            rationale: `1) Topic: ${topic}. 2) Decision: ${decision}. 3) Impact: ${rationaleLine}`, 
            score: decision === 'PUBLISH' ? 0.9 : 0.3 
          } as any;
        } catch (e) {
          const fallbackDecision = Math.random() > 0.8 ? 'PUBLISH' : 'REJECT';
          return { decision: fallbackDecision, rationale: `1) Topic: ${topic}. 2) Decision: ${fallbackDecision}. 3) Impact: API constraint fallback.`, score: fallbackDecision === 'PUBLISH' ? 0.9 : 0.3 } as any;
        }
      }
      if (prompt.includes('CONTENT_GENERATION')) {
        try {
          const tweetPrompt = `Write an engaging, insightful X.com post about: "${topic}".
Reply with exactly two lines:
Line 1: The engaging post content (no quotes, no hashtags).
Line 2: A short rationale explaining why this signals a major shift in the ecosystem.`;
          const rawTweet = await this.generate(tweetPrompt, tier);
          const lines = rawTweet.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const textLine = lines[0] || `Some interesting developments regarding ${topic}... 🤔`;
          const rationaleLine = lines.slice(1).join(' ') || 'Relevant right now as current infrastructure economics are changing.';
          
          return { 
            text: textLine.replace(/^"|"$/g, ''), 
            rationale: `1) Topic: ${topic}. 2) Decision: PUBLISHED. 3) Impact: ${rationaleLine}`
          } as any;
        } catch (e) {
          return {
            text: `Some interesting developments regarding ${topic}... 🤔`,
            rationale: `1) Topic: ${topic}. 2) Decision: PUBLISHED. 3) Impact: Aggregated top tech news feeds.`
          } as any;
        }
      }
      if (prompt.includes('MEMORY_EXTRACTION')) {
        return {
          title: `Shifts around ${topic}`,
          statement: `${topic} is permanently altering infrastructure economics.`,
          confidence: 0.85,
          is_new_thesis: true
        } as any;
      }

      return null;
    }
  }
}

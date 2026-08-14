export interface LLMProvider {
  generate(prompt: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: any): Promise<T | null>;
}

export class CloudflareAILLMProvider implements LLMProvider {
  private db: D1Database;
  private ai: any;
  private agentId: string;
  private cycleId: string;
  private purpose: string;

  constructor(db: D1Database, ai: any, agentId: string, cycleId: string, purpose: string = 'general') {
    this.db = db;
    this.ai = ai;
    this.agentId = agentId;
    this.cycleId = cycleId;
    this.purpose = purpose;
  }

  setPurpose(purpose: string) {
    this.purpose = purpose;
  }

  private async logUsage(model: string, inputTokens: number, outputTokens: number, success: boolean, errorMsg?: string) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      "INSERT INTO llm_usage (id, cycle_id, model, prompt_purpose, input_tokens, output_tokens, success, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, this.cycleId, model, this.purpose, inputTokens, outputTokens, success ? 1 : 0, errorMsg || null, now).run();
  }

  async generate(prompt: string): Promise<string> {
    const model = '@cf/meta/llama-3.1-70b-instruct';
    
    try {
      const response = await this.ai.run(model, {
        messages: [{ role: 'user', content: prompt }]
      });
      
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil((response.response?.length || 0) / 4);
      
      await this.logUsage(model, inputTokens, outputTokens, true);
      
      return response.response;
    } catch (e: any) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      await this.logUsage(model, 0, 0, false, errorMsg);
      throw e;
    }
  }

  async generateStructured<T>(prompt: string, schema: any): Promise<T | null> {
    const structuredPrompt = `${prompt}\n\nYou MUST return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}\nDo NOT include markdown formatting or backticks. Start your response with {`;
    
    try {
      const resultText = await this.generate(structuredPrompt);
      
      // Aggressively extract JSON
      const startIdx = resultText.indexOf('{');
      const endIdx = resultText.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) {
        throw new Error('Invalid JSON format returned from LLM: ' + resultText);
      }
      
      let validJsonStr = resultText.substring(startIdx, endIdx + 1);
      validJsonStr = validJsonStr.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(validJsonStr) as T;
      
    } catch (error: any) {
      console.error('generateStructured Error:', error);
      return null;
    }
  }
}

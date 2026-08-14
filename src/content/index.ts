import { AnalysisResult } from '../analysis';
import { CloudflareAILLMProvider } from '../llm';

export type PostFormat = 'punchy' | 'thread' | 'data_drop' | 'question' | 'recap';

export interface GeneratedPost {
  format: PostFormat;
  content: string | string[]; // string for single tweet, string[] for thread
}

export function determineFormatPreference(dayOfWeek: number): PostFormat {
  const preferences: Record<number, PostFormat> = {
    1: 'punchy',     // Mon
    2: 'thread',     // Tue
    3: 'data_drop',  // Wed
    4: 'thread',     // Thu
    5: 'question',   // Fri
    0: 'recap',      // Sun
  };
  return preferences[dayOfWeek] || 'punchy';
}

export async function generateContent(analysis: AnalysisResult, preferredFormat: PostFormat, llm: CloudflareAILLMProvider): Promise<GeneratedPost | null> {
  llm.setPurpose('craft');
  
  const personaContext = `You are "Suyash Dwivedi", an intellectual provocateur exposing hidden systems and incentives.
Your Voice: Confident, precise, never preachy. State facts and let the reader draw conclusions.
Rules:
- NO corporate language ("excited to share", "game-changer", "paradigm shift").
- NO "I think" or "In my opinion".
- NO excessive emojis (max 1 per tweet).
- NO hashtags.
- NO starting with "Thread 🧵".
`;

  const inputContext = `
Thesis: ${analysis.synthesis}
Contrarian Data: ${analysis.contrarianAngle}
Incentive: ${analysis.incentiveInsight}
System Loop: ${analysis.systemLoop}
`;

  let prompt = '';
  let schema: any = null;

  // We ask the LLM to choose the format, but strongly suggest the preferred one.
  const formatPrompt = `
${personaContext}
${inputContext}

Based on this material, what is the most powerful way to present it on X (Twitter)?
Options:
- "punchy": A single tweet reframing a belief in one sharp sentence (<280 chars).
- "thread": A multi-tweet breakdown (5-8 tweets) taking the reader through the full Contrarian -> Incentive -> Systems chain.
- "data_drop": A single tweet built around a surprising statistic with one sentence of context (<280 chars).
- "question": A single provocative question with no answer (<280 chars).

Today's preferred format is "${preferredFormat}". You should probably use this unless the material absolutely demands otherwise.

Return JSON with:
- "chosen_format": string (one of the options above)
- "content": string OR array of strings (if thread). Each string MUST be under 270 characters.
`;

  schema = {
    chosen_format: "string",
    content: ["string"]
  };

  const result = await llm.generateStructured<{ chosen_format: string, content: string[] }>(formatPrompt, schema);
  
  if (!result || !result.content || result.content.length === 0) return null;

  let format = (result.chosen_format as PostFormat) || preferredFormat;
  if (!['punchy', 'thread', 'data_drop', 'question', 'recap'].includes(format)) {
    format = 'punchy';
  }

  // Validate lengths
  const validatedContent = result.content.map(tweet => {
    if (tweet.length > 280) {
      return tweet.substring(0, 275) + '...';
    }
    return tweet;
  });

  return {
    format,
    content: format === 'thread' ? validatedContent : validatedContent[0]
  };
}

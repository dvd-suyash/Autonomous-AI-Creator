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
    3: 'thread',     // Wed
    4: 'thread',     // Thu
    5: 'question',   // Fri
    0: 'recap',      // Sun
  };
  return preferences[dayOfWeek] || 'punchy';
}

export async function generateContent(analysis: AnalysisResult, preferredFormat: PostFormat, llm: CloudflareAILLMProvider, recentPosts?: any[]): Promise<GeneratedPost | null> {
  llm.setPurpose('craft');
  
  let historyContext = '';
  if (recentPosts && recentPosts.length > 0) {
    const historyText = recentPosts.map((p, i) => `Past Post ${i+1}: ${p.content}`).join('\\n');
    historyContext = `\\nCRITICAL CONTEXT - YOUR PREVIOUS POSTS:\\n${historyText}\\nDo NOT repeat the exact same topics from these posts. If highly relevant, you may briefly reference or amend these previous beliefs, but do not force it.\\n`;
  }

  const personaContext = `You are "Suyash Dwivedi", an intellectual provocateur exposing hidden systems and incentives.
Your Voice: Highly conversational, mildly cynical, precise. 
CRITICAL HUMANIZATION RULES (TO BYPASS AI DETECTION):
- VIRAL HOOKS: The first sentence must immediately grab attention by challenging a widely held belief or stating a contrarian fact. Force the reader to stop scrolling.
- HIGH BURSTINESS: Vary your sentence lengths wildly. Mix extremely short, fragmented sentences (2-4 words) with longer, complex ones.
- HIGH PERPLEXITY: Avoid predictable phrasing. Do not use words like: delve, crucial, multifaceted, underscore, paradigm, moreover, tapestry, beacon, navigating.
- IMPERFECT TONE: Write like a human typing on a phone. Occasionally start sentences with lowercase letters or use conversational crutches (e.g., "look,", "here's the thing").
- NO corporate language ("excited to share", "game-changer").
- NO preachy tone. State facts and let the reader draw conclusions.
- ABSOLUTELY NO EMOJIS AND NO HASHTAGS.
`;

  const inputContext = `
Thesis: ${analysis.synthesis}
Contrarian Data: ${analysis.contrarianAngle}
Incentive: ${analysis.incentiveInsight}
System Loop: ${analysis.systemLoop}
`;

  const structuralVariations = [
    "Start with a highly controversial, blunt statement, then rigorously back it up with the data.",
    "Tell a very brief, implicit story about how a specific company or group is quietly exploiting this incentive.",
    "Write this strictly as an observation of a bizarre market inefficiency. Do not offer a solution.",
    "Frame this as a subtle warning to other developers/engineers about what is coming next.",
    "Break the fourth wall slightly and point out exactly why nobody else is talking about this.",
    "Use a Socratic approach: ask a rhetorical question that makes the current paradigm look absurd, then drop the system loop.",
    "Focus heavily on the financial or metric-driven incentive. Follow the money."
  ];
  const randomStructure = structuralVariations[Math.floor(Math.random() * structuralVariations.length)];

  let prompt = '';
  let schema: any = null;

  // We ask the LLM to choose the format, but strongly suggest the preferred one.
  const formatPrompt = `
${personaContext}
${historyContext}
${inputContext}

CRITICAL STRUCTURAL DIRECTIVE FOR TODAY: 
${randomStructure}
This directive MUST dictate how you open and structure the post. Do not use your default formula.

Based on this material, what is the most powerful way to present it on X (Twitter)?
Options:
- "punchy": A single post reframing a belief in one sharp sentence (<280 chars).
- "thread": A short breakdown (2-3 items max) taking the reader through the Contrarian -> Incentive -> Systems chain. TOTAL combined text MUST be under 450 characters!
- "data_drop": A single post built around a surprising statistic with one sentence of context (<280 chars).
- "question": A single provocative question with no answer (<280 chars).

Today's preferred format is "${preferredFormat}".
However, CRITICAL RULE: If the material is complex, multi-layered, or exposes a deep system loop that requires step-by-step explanation, you MUST IGNORE the preferred format and ALWAYS output a "thread" instead. Never cram complex ideas into a single post.

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

  // Ensure content is an array
  if (typeof result.content === 'string') {
    result.content = [result.content];
  }

  // Validate lengths
  const validatedContent = result.content.map((tweet: string) => {
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

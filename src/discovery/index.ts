import { CloudflareAILLMProvider } from '../llm';

export interface Signal {
  id: string;
  source: string;       // 'tavily'
  title: string;
  summary: string;      // This will now hold the full raw text from Tavily
  url: string;
  publishedAt: string;  
  metadata: Record<string, any>;
}

export async function generateSearchQuery(db: D1Database, llm: CloudflareAILLMProvider): Promise<string> {
  // Look at the last 5 things we talked about
  const { results: recentEntities } = await db.prepare(
    "SELECT entity FROM knowledge_graph ORDER BY last_mentioned_at DESC LIMIT 5"
  ).all<{ entity: string }>();

  const recentTopics = recentEntities.map(r => r.entity).join(', ') || 'None (System just initialized)';

  llm.setPurpose('curiosity');
  
  const prompt = `You are an autonomous AI agent whose goal is to find non-obvious, deeply intellectual insights about the world (tech, economics, incentives, systems).
Your memory shows you recently discussed: [${recentTopics}].

Formulate exactly ONE highly specific search query to investigate today.
Rules for the query:
1. It must be specific, not broad. (e.g., "Second-order effects of EU AI Act on open source" NOT "AI news").
2. It should investigate an incentive structure, a system loop, or a contrarian data point.
3. If your memory is empty, search for a deep-dive analysis on a major global tech/economic shift from the last 48 hours.
4. Output ONLY the search query string. No quotes, no preamble.`;

  let query = await llm.generate(prompt);
  query = query.replace(/^"|"$/g, '').trim(); // Clean up if it returned quotes
  
  console.log(`[Curiosity] Generated query: "${query}"`);
  return query;
}

export async function fetchTavily(query: string, apiKey: string): Promise<Signal[]> {
  const url = 'https://api.tavily.com/search';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced",
        include_raw_content: true,
        max_results: 5
      })
    });

    if (!response.ok) {
      console.error('Tavily API error:', await response.text());
      return [];
    }

    const data: any = await response.json();
    
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      id: `tavily-${crypto.randomUUID()}`,
      source: 'tavily',
      title: item.title,
      // We take the full raw content. If it's too huge, we truncate to 8000 chars to save LLM context
      summary: (item.raw_content || item.content || '').substring(0, 8000), 
      url: item.url,
      publishedAt: new Date().toISOString(),
      metadata: { score: item.score }
    }));
  } catch (e) {
    console.error('Tavily fetch error:', e);
    return [];
  }
}

export async function deduplicateSignals(db: D1Database, newSignals: Signal[]): Promise<Signal[]> {
    if (newSignals.length === 0) return [];
    
    const urls = newSignals.map(s => s.url);
    const placeholders = urls.map(() => '?').join(',');
    
    const { results } = await db.prepare(
        `SELECT url FROM signals WHERE url IN (${placeholders}) AND discovered_at > datetime('now', '-7 days')`
    ).bind(...urls).all();
    
    const seenUrls = new Set(results.map((r: any) => r.url));
    return newSignals.filter(s => !seenUrls.has(s.url));
}

export async function aggregateDailySignals(db: D1Database, llm: CloudflareAILLMProvider, env: any): Promise<Signal[]> {
    const today = new Date().getDay();
    // if (today === 6) return []; // Skip Saturday (Temporarily disabled for demo)
    
    if (!env || !env.TAVILY_API_KEY) {
      console.error('TAVILY_API_KEY is missing from environment.');
      return [];
    }

    // 1. Reflect and Formulate Query
    const query = await generateSearchQuery(db, llm);
    
    // 2. Search Tavily
    let allSignals = await fetchTavily(query, env.TAVILY_API_KEY);
    
    // 3. Deduplicate against memory
    return deduplicateSignals(db, allSignals);
}

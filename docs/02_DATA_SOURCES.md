# Data Sources & Intelligence Pipeline

## Philosophy

The quality of insight is directly proportional to the diversity of information inputs. A system that only reads HackerNews will produce HackerNews-quality takes. To produce genuinely original analysis, the agent must cross-reference sources that most humans don't read simultaneously.

## Primary Sources

### 1. HackerNews (Top & Best Stories)
- **URL**: `https://hacker-news.firebaseio.com/v0/topstories.json`
- **What it provides**: Tech industry pulse, developer sentiment, startup news
- **Fetch strategy**: Top 5 stories per cycle
- **Strength**: High signal-to-noise ratio due to community curation
- **Weakness**: Silicon Valley bias, overrepresents YC-funded companies

### 2. Reddit (Multiple Subreddits)
- **Subreddits**: r/technology, r/economics, r/worldnews, r/science, r/futurology
- **URL**: `https://www.reddit.com/r/{subreddit}/hot.json?limit=5`
- **What it provides**: Broader cultural and policy perspectives, public sentiment
- **Fetch strategy**: Top 3 from each subreddit
- **Strength**: Diverse viewpoints, comment sections reveal public reaction
- **Weakness**: Populist bias, sensationalist headlines

### 3. ArXiv (CS.AI, CS.LG, CS.CL)
- **URL**: `http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&max_results=5`
- **What it provides**: Cutting-edge research papers, what's actually being built vs. announced
- **Fetch strategy**: Latest 5 papers from AI-related categories
- **Strength**: Primary source, not secondhand reporting
- **Weakness**: Dense academic language, needs LLM to extract key findings

### 4. Dev.to (Latest & Trending)
- **URL**: `https://dev.to/api/articles?top=1&per_page=5`
- **What it provides**: Developer community trends, tools gaining traction
- **Fetch strategy**: Top 5 trending articles
- **Strength**: Practitioner perspective (what people actually use vs. what's hyped)
- **Weakness**: Tutorial-heavy, lower signal for systemic analysis

### 5. Tech Company Blogs (RSS)
- **Sources**:
  - Google AI Blog: `https://blog.google/technology/ai/rss/`
  - OpenAI Blog: `https://openai.com/blog/rss.xml`
  - MIT Tech Review: `https://www.technologyreview.com/feed/`
- **What it provides**: Primary announcements, strategic direction
- **Fetch strategy**: Latest 3 from each
- **Strength**: Horse's mouth — not secondhand
- **Weakness**: PR-filtered, self-serving framing

## Future Sources (V2.1 — Post-Launch)

These sources would add incredible depth but require more engineering:

| Source | Value | Complexity |
|---|---|---|
| Semantic Scholar API | Citation velocity — what research is actually influential | Low (free API) |
| Google Patents (public search) | What companies are building vs. announcing | Medium |
| Wikipedia Recent Changes (AI articles) | What concepts are being actively debated | Low |
| Government regulatory feeds (EU, India, US) | Policy shifts that will reshape industries | Medium |
| Earnings call transcripts (SEC EDGAR) | What CEOs actually say to investors vs. the public | High |

## Signal Processing Pipeline

### Step 1: Raw Fetch
Each source adapter returns a normalised `Signal` object:
```typescript
interface Signal {
  id: string;
  source: string;       // 'hackernews' | 'reddit' | 'arxiv' | etc.
  title: string;
  summary: string;      // First 500 chars or abstract
  url: string;
  publishedAt: string;  // ISO 8601
  metadata: Record<string, any>;  // Source-specific (score, subreddit, etc.)
}
```

### Step 2: Deduplication
Compare against the `signals` table using title similarity and URL matching. Discard anything already seen in the last 7 days.

### Step 3: Clustering
Pass the batch of new signals to the LLM with the prompt:
> "Group these signals by underlying theme or trend. Identify which cluster represents the most significant convergence of information."

### Step 4: Enrichment
For the winning cluster, fetch any available full-text content (article body, paper abstract) to provide deeper context for the analysis phase.

## Source Rotation

To stay within the 50 subrequest limit, not all sources are fetched every cycle. The system rotates:

| Day | Primary Sources | Secondary Sources |
|---|---|---|
| Mon | HN, Reddit | ArXiv |
| Tue | HN, Reddit, ArXiv | Tech Blogs |
| Wed | HN, Reddit | Dev.to, Tech Blogs |
| Thu | HN, Reddit, ArXiv | Tech Blogs |
| Fri | HN, Reddit | Dev.to |
| Sun | HN, Reddit, ArXiv | Tech Blogs |

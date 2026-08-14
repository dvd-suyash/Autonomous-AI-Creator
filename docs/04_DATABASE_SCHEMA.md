# Database Schema (Cloudflare D1)

## Overview

The database serves as the agent's long-term memory, editorial history, and operational log. It is the single source of truth for what the agent knows, what it has published, and what it has rejected.

## Tables

### `agent`
Stores the agent's identity and configuration. Exactly one row after initialization.

```sql
CREATE TABLE agent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                    -- 'Suyash Dwivedi'
  persona_description TEXT NOT NULL,     -- The three-pillar description
  created_at TEXT NOT NULL,              -- ISO 8601
  total_posts INTEGER DEFAULT 0,
  total_skips INTEGER DEFAULT 0,
  last_wake_at TEXT
);
```

### `signals`
Raw information discovered from data sources. Every article, post, or paper fetched.

```sql
CREATE TABLE signals (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,                  -- 'hackernews', 'reddit', 'arxiv', etc.
  title TEXT NOT NULL,
  summary TEXT,                          -- First 500 chars or abstract
  url TEXT NOT NULL,
  published_at TEXT,                     -- Original publish time
  discovered_at TEXT NOT NULL,           -- When our agent found it
  cluster_id TEXT,                       -- Links to signal_clusters if grouped
  used_in_post TEXT,                     -- Links to posts.id if used
  metadata TEXT                          -- JSON: score, subreddit, upvotes, etc.
);
```

### `signal_clusters`
Groups of related signals identified by the LLM as part of the same underlying trend.

```sql
CREATE TABLE signal_clusters (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,                -- Which wake cycle produced this
  theme TEXT NOT NULL,                   -- LLM-generated theme description
  signal_count INTEGER NOT NULL,
  significance_score REAL,               -- 0.0 - 1.0, how important this cluster is
  selected INTEGER DEFAULT 0,           -- 1 if this cluster was chosen for analysis
  created_at TEXT NOT NULL
);
```

### `posts`
Published content. The agent's public output.

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  format TEXT NOT NULL,                  -- 'punchy', 'thread', 'data_drop', 'question', 'recap'
  content TEXT NOT NULL,                 -- The full tweet text (or JSON array for threads)
  contrarian_angle TEXT,                 -- What narrative was challenged
  incentive_insight TEXT,                -- What incentive was exposed
  system_loop TEXT,                      -- What feedback loop was revealed
  sources_used TEXT NOT NULL,            -- JSON array of signal IDs
  quality_score REAL,                    -- Self-critique score (0.0 - 1.0)
  x_tweet_id TEXT,                       -- X API tweet ID after posting
  x_thread_ids TEXT,                     -- JSON array of tweet IDs if thread
  created_at TEXT NOT NULL,
  posted_at TEXT,                        -- When it was actually sent to X
  FOREIGN KEY (agent_id) REFERENCES agent(id)
);
```

### `skipped_cycles`
Cycles where the agent decided not to publish. Transparency log.

```sql
CREATE TABLE skipped_cycles (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  reason TEXT NOT NULL,                  -- LLM-generated explanation for why nothing was published
  best_candidate_content TEXT,           -- What the best option was
  best_candidate_score REAL,             -- Why it didn't meet the bar
  created_at TEXT NOT NULL
);
```

### `runtime_cycles`
Operational log of every wake cycle.

```sql
CREATE TABLE runtime_cycles (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  signals_discovered INTEGER DEFAULT 0,
  signals_new INTEGER DEFAULT 0,
  clusters_formed INTEGER DEFAULT 0,
  llm_calls_made INTEGER DEFAULT 0,
  outcome TEXT,                          -- 'PUBLISHED', 'SKIPPED', 'ERROR'
  error_message TEXT,
  day_of_week TEXT,                      -- 'monday', 'tuesday', etc.
  format_preference TEXT,                -- What format the day suggested
  format_used TEXT                       -- What format was actually used
);
```

### `llm_usage`
Tracks every LLM call for debugging and budget monitoring.

```sql
CREATE TABLE llm_usage (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_purpose TEXT NOT NULL,          -- 'clustering', 'contrarian', 'incentive', 'systems', 'synthesis', 'craft', 'critique'
  input_tokens INTEGER,
  output_tokens INTEGER,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TEXT NOT NULL
);
```

### `knowledge_graph`
Long-term memory of topics, entities, and themes the agent has covered.

```sql
CREATE TABLE knowledge_graph (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,                  -- Company, technology, concept, person
  entity_type TEXT NOT NULL,             -- 'company', 'technology', 'concept', 'person', 'policy'
  last_mentioned_at TEXT,
  mention_count INTEGER DEFAULT 1,
  sentiment TEXT,                        -- Agent's evolving stance: 'positive', 'negative', 'neutral', 'complex'
  notes TEXT                             -- LLM-generated notes about this entity
);
```

## Indexes

```sql
CREATE INDEX idx_signals_source ON signals(source);
CREATE INDEX idx_signals_discovered ON signals(discovered_at);
CREATE INDEX idx_signals_url ON signals(url);
CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_posts_agent ON posts(agent_id);
CREATE INDEX idx_cycles_agent ON runtime_cycles(agent_id);
CREATE INDEX idx_knowledge_entity ON knowledge_graph(entity);
```

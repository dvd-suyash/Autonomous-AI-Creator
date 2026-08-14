DROP TABLE IF EXISTS knowledge_graph;
DROP TABLE IF EXISTS llm_usage;
DROP TABLE IF EXISTS runtime_cycles;
DROP TABLE IF EXISTS skipped_cycles;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS signal_clusters;
DROP TABLE IF EXISTS signals;
DROP TABLE IF EXISTS agent;

CREATE TABLE agent (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  persona_description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  total_posts INTEGER DEFAULT 0,
  total_skips INTEGER DEFAULT 0,
  last_wake_at TEXT
);

CREATE TABLE signals (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT NOT NULL,
  published_at TEXT,
  discovered_at TEXT NOT NULL,
  cluster_id TEXT,
  used_in_post TEXT,
  metadata TEXT
);

CREATE TABLE signal_clusters (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  theme TEXT NOT NULL,
  signal_count INTEGER NOT NULL,
  significance_score REAL,
  selected INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  format TEXT NOT NULL,
  content TEXT NOT NULL,
  contrarian_angle TEXT,
  incentive_insight TEXT,
  system_loop TEXT,
  sources_used TEXT NOT NULL,
  quality_score REAL,
  x_tweet_id TEXT,
  x_thread_ids TEXT,
  created_at TEXT NOT NULL,
  posted_at TEXT,
  FOREIGN KEY (agent_id) REFERENCES agent(id)
);

CREATE TABLE skipped_cycles (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  best_candidate_content TEXT,
  best_candidate_score REAL,
  created_at TEXT NOT NULL
);

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
  outcome TEXT,
  error_message TEXT,
  day_of_week TEXT,
  format_preference TEXT,
  format_used TEXT
);

CREATE TABLE llm_usage (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_purpose TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE knowledge_graph (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  last_mentioned_at TEXT,
  mention_count INTEGER DEFAULT 1,
  sentiment TEXT,
  notes TEXT
);

CREATE INDEX idx_signals_source ON signals(source);
CREATE INDEX idx_signals_discovered ON signals(discovered_at);
CREATE INDEX idx_signals_url ON signals(url);
CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_posts_agent ON posts(agent_id);
CREATE INDEX idx_cycles_agent ON runtime_cycles(agent_id);
CREATE INDEX idx_knowledge_entity ON knowledge_graph(entity);

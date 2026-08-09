CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    url TEXT NOT NULL,
    canonical_url TEXT,
    source_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DISCOVERED',
    discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    author TEXT,
    published_date TEXT,
    content_hash TEXT,
    raw_content TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    UNIQUE(agent_id, url)
);

CREATE TABLE candidates (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    title TEXT NOT NULL,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE candidate_sources (
    candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    PRIMARY KEY (candidate_id, source_id)
);

CREATE TABLE editorial_decisions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    candidate_id TEXT NOT NULL REFERENCES candidates(id),
    decision TEXT NOT NULL,
    rationale TEXT NOT NULL,
    score REAL,
    confidence REAL,
    model TEXT,
    prompt_version TEXT,
    decided_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE theses (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    confidence REAL,
    first_observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE thesis_evidence (
    thesis_id TEXT NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    strength REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thesis_id, source_id)
);

CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    candidate_id TEXT REFERENCES candidates(id),
    thesis_id TEXT REFERENCES theses(id),
    text TEXT NOT NULL,
    rationale TEXT NOT NULL,
    format TEXT,
    confidence REAL,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    memory_type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    importance REAL DEFAULT 0.5,
    confidence REAL DEFAULT 0.5,
    source_post_id TEXT REFERENCES posts(id),
    source_candidate_id TEXT REFERENCES candidates(id),
    source_thesis_id TEXT REFERENCES theses(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE post_sources (
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    relevance_score REAL,
    PRIMARY KEY (post_id, source_id)
);

CREATE TABLE publication_events (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    post_id TEXT REFERENCES posts(id),
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE distribution_events (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    external_id TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    published_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE runtime_state (
    agent_id TEXT PRIMARY KEY REFERENCES agents(id),
    state TEXT NOT NULL DEFAULT 'IDLE',
    last_started_at TEXT,
    last_completed_at TEXT,
    last_successful_cycle_at TEXT,
    last_failed_cycle_at TEXT,
    locked_until TEXT,
    current_candidate_id TEXT REFERENCES candidates(id),
    failure_count INTEGER NOT NULL DEFAULT 0,
    metadata TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE runtime_cycles (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'RUNNING',
    candidates_discovered INTEGER NOT NULL DEFAULT 0,
    candidates_approved INTEGER NOT NULL DEFAULT 0,
    candidates_rejected INTEGER NOT NULL DEFAULT 0,
    posts_published INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE llm_usage (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    cycle_id TEXT REFERENCES runtime_cycles(id),
    operation TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    estimated_cost REAL,
    latency_ms INTEGER,
    success INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_posts_feed ON posts(agent_id, status, created_at DESC);
CREATE INDEX idx_candidates_runtime ON candidates(agent_id, status, expires_at);
CREATE INDEX idx_posts_agent_created ON posts(agent_id, created_at DESC);
CREATE INDEX idx_posts_thesis ON posts(thesis_id);
CREATE INDEX idx_posts_candidate ON posts(candidate_id);
CREATE INDEX idx_memories_agent_type ON memories(agent_id, memory_type);
CREATE INDEX idx_memories_importance ON memories(agent_id, importance DESC);
CREATE INDEX idx_memories_updated_at ON memories(agent_id, updated_at DESC);

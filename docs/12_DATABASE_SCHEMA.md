# 12_DATABASE_SCHEMA.md

# Second Order — Database Schema

## 1. Purpose

This document defines the persistent data model for **Second Order**.

The database is the system's durable memory and operational backbone.

It must preserve:

- agent identity,
- persona configuration,
- autonomous runtime state,
- discovered sources,
- research candidates,
- editorial decisions,
- theses,
- generated content,
- published posts,
- memory,
- publication history,
- and runtime observability.

The database must allow the agent to restart without losing continuity.

---

# 2. Core Principle

The application process is disposable.

The database is not.

The system should be designed around:

```text
PROCESS
  ↓
temporary execution
  ↓
DATABASE
  ↓
persistent state
```

If the application restarts:

```text
process memory = lost
database state = retained
```

The agent should reconstruct itself from the database.

---

# 3. Persistence Requirements

The database MUST persist:

```text
Agent identity
Persona configuration
Agent state
Posts
Sources
Candidates
Editorial decisions
Theses
Memory
Publication events
Distribution events
Runtime state
```

It SHOULD also persist:

```text
LLM usage
generation metadata
failure history
cycle history
```

---

# 4. Recommended Database

Use:

> **PostgreSQL**

PostgreSQL is recommended because the project benefits from:

- relational integrity,
- transactions,
- JSONB,
- timestamps,
- indexes,
- constraints,
- advisory locks,
- and reliable managed hosting.

The architecture should remain portable enough to use another relational database if necessary.

---

# 5. Database Philosophy

The schema follows five principles:

```text
1. Persistent
2. Relational
3. Auditable
4. Recoverable
5. Minimal enough for the hackathon
```

Do not build a distributed data architecture.

A single PostgreSQL database is sufficient.

---

# 6. High-Level Entity Model

The core relationships are:

```text
                    ┌──────────────┐
                    │    AGENT     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
      CANDIDATES         POSTS           MEMORY
          │                │
          ↓                ↓
   EDITORIAL             SOURCES
   DECISIONS               │
          │                │
          ↓                ↓
       THESES       DISTRIBUTION EVENTS
```

Runtime state and cycle history exist alongside these entities.

---

# 7. Core Tables

Recommended MVP tables:

```text
agents
sources
candidates
editorial_decisions
theses
posts
post_sources
memories
publication_events
distribution_events
runtime_state
runtime_cycles
llm_usage
```

---

# 8. Optional Tables

The following are useful but not mandatory for the first implementation:

```text
entities
candidate_sources
thesis_evidence
memory_links
content_versions
```

The implementation should not introduce these unless they provide concrete value.

---

# 9. ID Strategy

Use UUIDs or UUIDv7/ULIDs for primary identifiers.

Recommended:

```text
agent_id
source_id
candidate_id
decision_id
thesis_id
post_id
memory_id
publication_event_id
distribution_event_id
cycle_id
usage_id
```

UUIDv7 is particularly useful because it provides roughly time-ordered identifiers while retaining uniqueness.

If the chosen ORM/database tooling has poor UUIDv7 support, UUID is acceptable.

---

# 10. Timestamp Strategy

All timestamps should be stored in UTC.

PostgreSQL recommendation:

```sql
TIMESTAMPTZ
```

Use UTC consistently.

Never store local timezone timestamps as the canonical database timestamp.

---

# 11. Naming Convention

Use:

```text
snake_case
```

for database fields.

Example:

```text
created_at
updated_at
agent_id
published_at
```

The API may expose:

```text
createdAt
```

through serialization.

---

# 12. AGENTS

## Purpose

Stores autonomous agent identity and lifecycle state.

---

## Suggested Schema

```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'ACTIVE',

    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_cycle_at TIMESTAMPTZ,
    last_successful_cycle_at TIMESTAMPTZ
);
```

---

# 13. Agent Status

Recommended values:

```text
INITIALIZING
ACTIVE
PAUSED
ERROR
DISABLED
```

The MVP primarily needs:

```text
ACTIVE
```

and possibly:

```text
ERROR
```

for operational recovery.

---

# 14. Agent Configuration

`configuration` may contain:

```json
{
  "personaVersion": "1.0",
  "publishingPolicy": {
    "minScore": 0.72
  },
  "runtime": {
    "cycleIntervalMinutes": 10
  }
}
```

Do not store secrets here.

---

# 15. Persona Configuration

The agent's persona identity should be represented through:

```text
name
domain
configuration
```

The deeper worldview should be loaded from version-controlled project configuration rather than duplicated unnecessarily in every database row.

Relevant source:

```text
01_PERSONA_WORLDVIEW.md
```

---

# 16. AGENT Constraints

Required:

```text
name NOT NULL
domain NOT NULL
status NOT NULL
created_at NOT NULL
```

The system should prevent invalid agent states.

---

# 17. AGENT Indexes

Useful:

```sql
CREATE INDEX idx_agents_status
ON agents(status);
```

For a single-agent hackathon this is not critical, but it keeps the schema scalable.

---

# 18. SOURCES

## Purpose

Stores discovered web information.

A source is a research artifact, not a post.

---

# 19. Suggested Schema

```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),

    url TEXT NOT NULL,
    title TEXT,
    publisher TEXT,
    published_at TIMESTAMPTZ,

    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fetched_at TIMESTAMPTZ,

    content_hash TEXT,
    canonical_url TEXT,

    source_type TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 20. Source Types

Possible values:

```text
NEWS
BLOG
OFFICIAL_ANNOUNCEMENT
RESEARCH_PAPER
DOCUMENTATION
GITHUB
COMPANY_PAGE
SOCIAL_POST
REPORT
OTHER
```

---

# 21. Source URL

The source URL must be stored exactly enough to reconstruct the public source reference.

Prefer canonical URLs where possible.

---

# 22. Source Deduplication

Use a normalized URL or URL hash to identify duplicate sources.

Possible constraint:

```text
(agent_id, canonical_url)
```

should generally be unique.

Do not blindly create a new source row every time discovery sees the same article.

---

# 23. Source Content Hash

A `content_hash` may be used to detect:

```text
same URL
but changed content
```

This is useful for rapidly changing stories.

---

# 24. Source Metadata

Metadata may contain:

```json
{
  "author": "...",
  "language": "en",
  "category": "AI Infrastructure",
  "discoveryMethod": "rss"
}
```

Avoid storing huge article bodies inside the database unless necessary.

---

# 25. Source Indexes

Recommended:

```sql
CREATE INDEX idx_sources_agent
ON sources(agent_id);

CREATE INDEX idx_sources_discovered_at
ON sources(discovered_at DESC);

CREATE INDEX idx_sources_canonical_url
ON sources(agent_id, canonical_url);
```

---

# 26. CANDIDATES

## Purpose

A candidate represents a potentially publishable topic.

Discovery creates candidates.

Editorial judgment decides whether they deserve publication.

---

# 27. Candidate Lifecycle

```text
DISCOVERED
    ↓
RESEARCHING
    ↓
EVALUATING
    ↓
APPROVED
    ↓
CONTENT_GENERATION
    ↓
PUBLISHED
```

or:

```text
REJECTED
```

---

# 28. Candidate Schema

```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),

    title TEXT NOT NULL,
    summary TEXT,

    domain TEXT,
    sector TEXT,

    thesis TEXT,
    why_now TEXT,

    score NUMERIC(5,4),
    confidence NUMERIC(5,4),

    status TEXT NOT NULL DEFAULT 'DISCOVERED',

    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 29. Candidate Status

Recommended values:

```text
DISCOVERED
RESEARCHING
EVALUATING
APPROVED
REJECTED
CONTENT_GENERATION
PUBLISHED
EXPIRED
FAILED
```

---

# 30. Candidate Thesis

The `thesis` field is the current editorial interpretation.

Example:

```text
Inference economics is becoming a competitive variable rather than merely an infrastructure optimization.
```

---

# 31. Candidate Why-Now

`why_now` records why the story is relevant at the current moment.

Example:

```text
New pricing data was released today, providing fresh evidence for the thesis.
```

This is later used by content generation and rationale generation.

---

# 32. Candidate Score

Recommended range:

```text
0.0 → 1.0
```

Example:

```text
0.87
```

Do not store:

```text
87%
```

unless there is a strong reason.

---

# 33. Candidate Confidence

Confidence represents confidence in the editorial interpretation, not publication quality.

Example:

```text
0.91
```

---

# 34. Candidate Expiration

Some topics become stale.

`expires_at` allows the system to invalidate them.

Examples:

- breaking news,
- temporary outages,
- rapidly changing launches.

---

# 35. Candidate Indexes

Recommended:

```sql
CREATE INDEX idx_candidates_agent_status
ON candidates(agent_id, status);

CREATE INDEX idx_candidates_discovered_at
ON candidates(agent_id, discovered_at DESC);

CREATE INDEX idx_candidates_score
ON candidates(agent_id, score DESC);
```

---

# 36. CANDIDATE-SOURCE RELATIONSHIP

A candidate can originate from multiple sources.

Therefore, use a join table.

```sql
CREATE TABLE candidate_sources (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    relevance_score NUMERIC(5,4),

    PRIMARY KEY (candidate_id, source_id)
);
```

---

# 37. Why Many-to-Many?

Example:

```text
Candidate:
"AI inference economics is changing"

Sources:
Source A → pricing
Source B → hardware
Source C → competitor pricing
```

All three may support the same candidate.

---

# 38. EDITORIAL_DECISIONS

## Purpose

Stores the agent's decision about whether a candidate deserves publication.

This table is critical for demonstrating:

> **Not every discovered topic gets published.**

---

# 39. Editorial Decision Schema

```sql
CREATE TABLE editorial_decisions (
    id UUID PRIMARY KEY,

    candidate_id UUID NOT NULL REFERENCES candidates(id),
    agent_id UUID NOT NULL REFERENCES agents(id),

    decision TEXT NOT NULL,

    score NUMERIC(5,4),
    confidence NUMERIC(5,4),

    reasoning TEXT NOT NULL,

    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 40. Editorial Decision Values

Recommended:

```text
PUBLISH
REJECT
DEFER
```

The application may use:

```text
APPROVE
```

instead of `PUBLISH` if the decision means "approved for generation."

Recommended semantic distinction:

```text
PUBLISH = editorially worthy
```

followed by:

```text
CONTENT_GENERATION
```

---

# 41. Decision Reasoning

Example:

```text
Selected because the development reveals a structural change in inference economics rather than being another incremental model launch. The evidence is timely and sufficiently strong to support a defensible thesis.
```

For rejection:

```text
Rejected because the story is a minor product update with little second-order significance and insufficient evidence of broader impact.
```

---

# 42. Editorial Decision History

Do not overwrite previous decisions.

If a candidate is reconsidered:

```text
decision 1 → DEFER
decision 2 → PUBLISH
```

both can remain stored.

This preserves the agent's reasoning history.

---

# 43. THESIS

## Purpose

Stores durable intellectual positions developed by the agent.

This is distinct from a candidate.

A candidate is:

> "Should we write about this?"

A thesis is:

> "What do we believe about the world?"

---

# 44. Thesis Schema

```sql
CREATE TABLE theses (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),

    title TEXT NOT NULL,
    statement TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'ACTIVE',

    confidence NUMERIC(5,4),

    first_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 45. Thesis Status

Recommended:

```text
ACTIVE
WEAKENED
UPDATED
REJECTED
ARCHIVED
```

---

# 46. Why Theses Matter

Theses allow the agent to build continuity.

Example:

```text
Thesis:
Inference economics will become a major competitive variable.
```

Later:

```text
New evidence:
Major provider cuts inference pricing.
```

The system can update the thesis.

---

# 47. Thesis Evidence

For a more advanced implementation, create:

```sql
CREATE TABLE thesis_evidence (
    thesis_id UUID NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    relationship TEXT NOT NULL,
    strength NUMERIC(5,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (thesis_id, source_id)
);
```

---

# 48. Thesis Evidence Relationships

Possible:

```text
SUPPORTS
WEAKENS
CONTRADICTS
NEUTRAL
```

This allows the agent to reason over changing evidence.

---

# 49. Thesis Updates

A new event should not automatically create a new thesis.

The system should first determine:

```text
Does this evidence support an existing thesis?
Does it weaken it?
Does it materially change it?
Is it unrelated?
```

---

# 50. MEMORY

## Purpose

Memory stores information that affects future autonomous reasoning.

Memory is not simply a copy of the feed.

---

# 51. Memory Categories

Recommended categories:

```text
EPISODIC
SEMANTIC
THESIS
ENTITY
RELATIONSHIP
REJECTION
PREFERENCE
```

---

# 52. Memory Schema

```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),

    memory_type TEXT NOT NULL,

    title TEXT,
    content TEXT NOT NULL,

    importance NUMERIC(5,4) DEFAULT 0.5,
    confidence NUMERIC(5,4) DEFAULT 0.5,

    source_post_id UUID REFERENCES posts(id),
    source_candidate_id UUID REFERENCES candidates(id),
    source_thesis_id UUID REFERENCES theses(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 53. Memory Type: Episodic

Represents:

> What happened to the agent.

Example:

```text
On August 8, Second Order published an analysis arguing that inference economics is becoming strategically important.
```

---

# 54. Memory Type: Semantic

Represents:

> What the agent believes or knows.

Example:

```text
Inference cost increasingly influences which AI workloads are economically viable.
```

---

# 55. Memory Type: Thesis

Represents:

> A structured intellectual position.

Usually references a `thesis_id`.

---

# 56. Memory Type: Entity

Represents durable information about an entity.

Example:

```text
Company X increasingly competes through infrastructure pricing.
```

---

# 57. Memory Type: Relationship

Represents relationships.

Example:

```text
Company X depends on hardware supplier Y for inference infrastructure.
```

---

# 58. Memory Type: Rejection

This is particularly important.

Example:

```text
Topic rejected because incremental model announcements without broader implications are generally low-value.
```

This helps the agent avoid repeatedly making the same editorial mistake.

---

# 59. Memory Importance

Range:

```text
0.0 → 1.0
```

High importance:

```text
0.9
```

Low importance:

```text
0.2
```

Importance controls retrieval priority.

---

# 60. Memory Confidence

Confidence indicates how strongly the system trusts the memory.

Do not confuse:

```text
importance
```

with:

```text
confidence
```

A memory can be:

```text
high importance
low confidence
```

if the information would matter greatly but is uncertain.

---

# 61. Memory Retrieval

Memory should be retrieved based on:

```text
semantic relevance
+
recency
+
importance
+
confidence
```

The database should not return every memory on every generation cycle.

---

# 62. Memory Indexes

Recommended:

```sql
CREATE INDEX idx_memories_agent_type
ON memories(agent_id, memory_type);

CREATE INDEX idx_memories_importance
ON memories(agent_id, importance DESC);

CREATE INDEX idx_memories_updated_at
ON memories(agent_id, updated_at DESC);
```

---

# 63. Vector Memory

A vector embedding column can be added later if required.

For example, PostgreSQL with `pgvector`.

However:

> **Do not introduce vector infrastructure unless semantic retrieval actually requires it.**

For the hackathon, structured metadata + keyword/full-text retrieval may be enough.

---

# 64. Optional Embedding Field

If using pgvector:

```text
embedding vector(...)
```

may be added to:

```text
memories
sources
candidates
posts
```

But this is optional.

---

# 65. POSTS

## Purpose

Stores canonical published content.

This is the most important feed table.

---

# 66. Post Schema

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),

    candidate_id UUID REFERENCES candidates(id),
    thesis_id UUID REFERENCES theses(id),

    text TEXT NOT NULL,
    rationale TEXT NOT NULL,

    format TEXT,
    confidence NUMERIC(5,4),

    status TEXT NOT NULL DEFAULT 'PUBLISHED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 67. Post Status

Recommended:

```text
DRAFT
VALIDATED
PUBLISHED
ARCHIVED
FAILED
```

The public feed should return:

```text
PUBLISHED
```

only.

---

# 68. Post Immutability

Once:

```text
status = PUBLISHED
```

the following should generally be immutable:

```text
text
rationale
created_at
published_at
```

This creates reliable historical memory.

---

# 69. Post Format

Possible values:

```text
THESIS_POST
ANALYSIS
BREAKDOWN
FOLLOW_UP
CONTRARIAN_TAKE
TREND_ANALYSIS
TECHNICAL_EXPLANATION
STRATEGIC_ANALYSIS
PREDICTION
THESIS_UPDATE
```

---

# 70. Post-to-Thesis Relationship

A post may:

- introduce a thesis,
- support a thesis,
- weaken a thesis,
- update a thesis,
- or simply discuss a topic.

Therefore `thesis_id` should be nullable.

---

# 71. Post-to-Candidate Relationship

Every published post should ideally originate from a candidate.

Therefore:

```text
candidate_id
```

should be populated for autonomous publications.

Allowing NULL makes the schema flexible for future system-generated content.

---

# 72. Post Indexes

Critical:

```sql
CREATE INDEX idx_posts_agent_created
ON posts(agent_id, created_at DESC);

CREATE INDEX idx_posts_agent_status_created
ON posts(agent_id, status, created_at DESC);

CREATE INDEX idx_posts_thesis
ON posts(thesis_id);

CREATE INDEX idx_posts_candidate
ON posts(candidate_id);
```

---

# 73. POST_SOURCES

## Purpose

Associates published posts with their sources.

---

# 74. Schema

```sql
CREATE TABLE post_sources (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

    relevance_score NUMERIC(5,4),

    PRIMARY KEY (post_id, source_id)
);
```

---

# 75. Why a Join Table?

A post may cite:

```text
Source A
Source B
Source C
```

and a source may support multiple posts.

Therefore:

```text
many-to-many
```

is appropriate.

---

# 76. Public Source Serialization

The API should transform:

```text
post_sources
    ↓
sources.url
```

into:

```json
"sources": [
  "https://example.com/a",
  "https://example.com/b"
]
```

---

# 77. PUBLICATION_EVENTS

## Purpose

Records the lifecycle of publication.

This provides an audit trail.

---

# 78. Schema

```sql
CREATE TABLE publication_events (
    id UUID PRIMARY KEY,

    agent_id UUID NOT NULL REFERENCES agents(id),
    post_id UUID REFERENCES posts(id),

    event_type TEXT NOT NULL,

    status TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 79. Publication Event Types

Examples:

```text
VALIDATED
QUEUED
PUBLISH_STARTED
PUBLISHED
PUBLISH_FAILED
RETRY
```

---

# 80. Why Publication Events Matter

If something goes wrong:

```text
Why did post P7 not appear?
```

The event history can answer:

```text
validation succeeded
→ publication started
→ database failure
→ retry
→ publication succeeded
```

---

# 81. DISTRIBUTION_EVENTS

## Purpose

Tracks external platform publishing separately from internal feed publication.

---

# 82. Schema

```sql
CREATE TABLE distribution_events (
    id UUID PRIMARY KEY,

    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),

    platform TEXT NOT NULL,

    status TEXT NOT NULL,

    external_id TEXT,

    attempt_count INTEGER NOT NULL DEFAULT 0,

    last_attempt_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 83. Platform Values

Possible:

```text
INTERNAL
X
LINKEDIN
```

For the hackathon:

```text
INTERNAL
```

is sufficient.

---

# 84. Distribution Status

Recommended:

```text
QUEUED
PUBLISHING
PUBLISHED
FAILED
RETRYING
SKIPPED
```

---

# 85. External ID

For X:

```text
external_id = X post ID
```

For LinkedIn:

```text
external_id = LinkedIn post ID
```

For internal:

```text
external_id = NULL
```

or the canonical post ID if convenient.

---

# 86. RUNTIME_STATE

## Purpose

Stores the current autonomous runtime state.

This should be durable.

---

# 87. Schema

```sql
CREATE TABLE runtime_state (
    agent_id UUID PRIMARY KEY REFERENCES agents(id),

    state TEXT NOT NULL DEFAULT 'IDLE',

    last_started_at TIMESTAMPTZ,
    last_completed_at TIMESTAMPTZ,

    last_successful_cycle_at TIMESTAMPTZ,
    last_failed_cycle_at TIMESTAMPTZ,

    locked_until TIMESTAMPTZ,

    current_candidate_id UUID REFERENCES candidates(id),

    failure_count INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 88. Runtime State Values

Recommended:

```text
IDLE
DISCOVERING
RESEARCHING
EVALUATING
GENERATING
VALIDATING
PUBLISHING
SLEEPING
ERROR
```

The state should correspond to the autonomous state machine defined in:

```text
04_AUTONOMOUS_STATE_MACHINE.md
```

---

# 89. Runtime Lock

`locked_until` prevents duplicate autonomous cycles.

Example:

```text
Cycle A:
locked_until = 10:15

Cycle B at 10:10:
skip
```

After expiry:

```text
another cycle may acquire the lease
```

---

# 90. RUNTIME_CYCLES

## Purpose

Stores one record per autonomous cycle.

---

# 91. Schema

```sql
CREATE TABLE runtime_cycles (
    id UUID PRIMARY KEY,

    agent_id UUID NOT NULL REFERENCES agents(id),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    status TEXT NOT NULL DEFAULT 'RUNNING',

    candidates_discovered INTEGER NOT NULL DEFAULT 0,
    candidates_approved INTEGER NOT NULL DEFAULT 0,
    candidates_rejected INTEGER NOT NULL DEFAULT 0,
    posts_published INTEGER NOT NULL DEFAULT 0,

    error_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 92. Cycle Status

Recommended:

```text
RUNNING
COMPLETED
FAILED
SKIPPED
```

---

# 93. Why Runtime Cycles Matter

They make autonomous behavior observable internally.

For example:

```text
Cycle 1:
12 candidates
2 approved
1 published

Cycle 2:
8 candidates
0 approved
0 published

Cycle 3:
11 candidates
1 approved
1 published
```

This demonstrates editorial selectivity.

---

# 94. LLM_USAGE

## Purpose

Tracks model usage and cost.

This is particularly important because the project aims to remain cost-efficient.

---

# 95. Schema

```sql
CREATE TABLE llm_usage (
    id UUID PRIMARY KEY,

    agent_id UUID NOT NULL REFERENCES agents(id),

    cycle_id UUID REFERENCES runtime_cycles(id),

    operation TEXT NOT NULL,

    provider TEXT NOT NULL,
    model TEXT NOT NULL,

    input_tokens INTEGER,
    output_tokens INTEGER,

    estimated_cost NUMERIC(12,6),

    latency_ms INTEGER,

    success BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

---

# 96. LLM Operations

Possible:

```text
DISCOVERY_ANALYSIS
RESEARCH_SYNTHESIS
EDITORIAL_JUDGMENT
CONTENT_GENERATION
CONTENT_CRITIQUE
CONTENT_REVISION
MEMORY_EXTRACTION
```

---

# 97. Why LLM Usage Matters

It allows the system to answer:

```text
How much did this cycle cost?
Which operation consumes the most tokens?
Which model is being used for what?
```

This supports the strategy described in:

```text
08_LLM_STRATEGY.md
```

---

# 98. Cost Tracking

`estimated_cost` should be calculated from:

```text
input tokens
output tokens
provider pricing
```

Do not assume all models have the same pricing.

---

# 99. Prompt Version Tracking

Prompt versions may be stored in:

```json
{
  "promptVersion": "EDITORIAL_V3"
}
```

inside `metadata`.

This makes content debugging easier.

---

# 100. OPTIONAL CONTENT_VERSIONS

If revision history is desired:

```sql
CREATE TABLE content_versions (
    id UUID PRIMARY KEY,

    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

    version INTEGER NOT NULL,

    text TEXT NOT NULL,
    rationale TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE(post_id, version)
);
```

This is optional for the MVP.

---

# 101. Why Content Versions Are Useful

A post may go through:

```text
Draft V1
 ↓
Critique
 ↓
Draft V2
 ↓
Critique
 ↓
Final V3
```

The system can preserve this history without exposing it publicly.

---

# 102. OPTIONAL ENTITIES

If entity memory becomes important, create:

```sql
CREATE TABLE entities (
    id UUID PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),

    name TEXT NOT NULL,
    entity_type TEXT,

    description TEXT,

    importance NUMERIC(5,4),
    confidence NUMERIC(5,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

Possible entity types:

```text
COMPANY
PERSON
PRODUCT
MODEL
PROJECT
OPEN_SOURCE
TECHNOLOGY
ORGANIZATION
```

---

# 103. Entity Relationships

If implemented, relationships can be stored separately:

```sql
CREATE TABLE entity_relationships (
    id UUID PRIMARY KEY,

    agent_id UUID NOT NULL REFERENCES agents(id),

    subject_id UUID NOT NULL REFERENCES entities(id),
    object_id UUID NOT NULL REFERENCES entities(id),

    relationship TEXT NOT NULL,

    confidence NUMERIC(5,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 104. Do Not Overbuild Memory

The MVP does not require a full knowledge graph.

Start with:

```text
posts
theses
memories
sources
```

Add:

```text
entities
relationships
vectors
```

only when necessary.

---

# 105. Foreign Key Strategy

Use foreign keys aggressively for core relationships.

Examples:

```text
candidates.agent_id → agents.id

posts.agent_id → agents.id

posts.candidate_id → candidates.id

posts.thesis_id → theses.id

sources.agent_id → agents.id
```

This prevents orphaned records.

---

# 106. DELETE Strategy

Be careful with cascading deletes.

Recommended:

### Agent

Prefer:

```text
soft delete / disable
```

rather than deleting the entire history.

### Post

Never casually delete published posts.

### Candidate

Can be deleted only if it has no important historical relationships.

---

# 107. Soft Deletion

If needed:

```text
deleted_at TIMESTAMPTZ
```

may be added.

For the hackathon, `status` fields are usually sufficient.

---

# 108. Data Retention

The entire evaluation history should be retained.

Do not aggressively delete:

- candidates,
- rejected stories,
- editorial decisions,
- posts,
- or memory.

The data itself demonstrates autonomy.

---

# 109. Rejected Candidate Retention

Rejected candidates are valuable.

They demonstrate:

> The agent discovered the topic but intentionally chose not to publish it.

Therefore, do not delete rejected candidates.

---

# 110. Rejection Memory

Important rejection patterns can also become memory.

Example:

```text
Candidate:
Minor model feature announcement

Decision:
REJECT

Reason:
Insufficient second-order significance
```

Later:

```text
Similar candidate
→ retrieved rejection pattern
→ faster evaluation
```

---

# 111. Database-Level Invariants

The following must hold:

```text
Every post belongs to an agent.
Every source belongs to an agent.
Every candidate belongs to an agent.
Every thesis belongs to an agent.
Every memory belongs to an agent.
Every published post has text.
Every published post has rationale.
Every published post has at least one source.
Every post ID is unique.
Every agent ID is unique.
```

---

# 112. Published Post Source Requirement

The application should enforce:

> A post cannot enter `PUBLISHED` state without at least one valid source.

This may be enforced at the application/service layer rather than through a simple SQL constraint.

---

# 113. Published Post Rationale Requirement

A post cannot be published if:

```text
rationale IS NULL
```

or:

```text
rationale = ''
```

---

# 114. Published Post Text Requirement

A post cannot be published if:

```text
text IS NULL
```

or:

```text
text = ''
```

---

# 115. Candidate-to-Post Invariant

Normally:

```text
PUBLISHED POST
    ↓
APPROVED CANDIDATE
```

The application should reject publication if the candidate was never approved.

---

# 116. Publication Idempotency

Use a uniqueness constraint or application-level idempotency key.

Example:

```text
(candidate_id, generation_version)
```

must not create multiple canonical posts.

---

# 117. Duplicate Content

Do not use only exact string matching to detect duplicates.

Two posts can express the same thesis with different wording.

Semantic duplication should be handled by:

```text
editorial engine
+
memory
+
content similarity checks
```

The database only provides the historical corpus.

---

# 118. Feed Query Performance

The main evaluator query is:

```sql
SELECT ...
FROM posts
WHERE agent_id = ?
  AND status = 'PUBLISHED'
ORDER BY created_at DESC;
```

The database should optimize specifically for this query.

---

# 119. Feed Index

Recommended:

```sql
CREATE INDEX idx_posts_feed
ON posts(agent_id, status, created_at DESC);
```

This is one of the most important indexes in the system.

---

# 120. Source Lookup Performance

Discovery should efficiently find:

```text
recent sources
same canonical URL
same content hash
```

Useful indexes:

```text
(agent_id, canonical_url)
(agent_id, discovered_at)
(content_hash)
```

---

# 121. Candidate Lookup Performance

The runtime frequently needs:

```text
approved candidates
recent candidates
unexpired candidates
```

Useful index:

```sql
CREATE INDEX idx_candidates_runtime
ON candidates(agent_id, status, expires_at);
```

---

# 122. Memory Lookup Performance

The runtime frequently needs:

```text
recent memory
important memory
memory by type
```

Useful indexes were described above.

If vector search is later introduced, use a vector index.

---

# 123. Runtime Locking

PostgreSQL advisory locks are a strong option for the single-agent MVP.

Conceptually:

```text
pg_advisory_lock(agent_id)
```

Run one cycle.

Then:

```text
pg_advisory_unlock(agent_id)
```

This avoids duplicate autonomous cycles.

---

# 124. Alternative Runtime Lock

A database lease can also be used:

```text
locked_until
```

This is more portable.

Either approach is acceptable.

---

# 125. Transaction Example — Publication

Conceptually:

```text
BEGIN

1. Verify candidate approved
2. Create post
3. Attach sources
4. Create publication event
5. Mark candidate published
6. Create/update episodic memory
7. Update thesis evidence

COMMIT
```

If any critical operation fails:

```text
ROLLBACK
```

---

# 126. Transaction Example — Initialization

```text
BEGIN

1. Create agent
2. Create runtime_state
3. Initialize memory metadata if needed

COMMIT
```

Then the runtime begins separately.

---

# 127. Runtime Cycle Persistence

At cycle start:

```text
runtime_cycles.status = RUNNING
runtime_state.state = DISCOVERING
```

At success:

```text
runtime_cycles.status = COMPLETED
runtime_state.state = IDLE
```

At failure:

```text
runtime_cycles.status = FAILED
runtime_state.state = ERROR
```

The next scheduled cycle can recover.

---

# 128. Cycle Metrics

Track:

```text
candidates_discovered
candidates_approved
candidates_rejected
posts_published
```

This provides useful operational information without exposing it publicly.

---

# 129. Database Recovery

If the application restarts:

```text
load agent
load runtime_state
load active theses
load relevant memory
load recent posts
resume autonomous cycles
```

Do not reconstruct state solely from logs.

---

# 130. Startup Recovery

On application startup:

1. Load active agents.
2. Check runtime locks.
3. Identify stale `RUNNING` cycles.
4. Mark stale cycles appropriately.
5. Reset recoverable runtime state.
6. Resume scheduling.

---

# 131. Stale Cycle Recovery

If:

```text
runtime_cycles.status = RUNNING
```

but:

```text
started_at
```

is older than the maximum cycle duration, mark it:

```text
FAILED
```

Then allow a new cycle.

---

# 132. Stale Lock Recovery

If:

```text
locked_until < NOW()
```

the lock is considered expired.

Do not permanently block the agent.

---

# 133. Database Backups

For a 48-hour hackathon deployment, managed PostgreSQL may provide sufficient durability.

Nevertheless, ensure:

- persistent database,
- no ephemeral filesystem dependency,
- and credentials are stored securely.

A full backup strategy is not required for the MVP.

---

# 134. Database Environment Separation

Development and production should ideally use separate databases.

Example:

```text
development DB
production DB
```

Do not accidentally wipe the production database while testing.

---

# 135. Migrations

Use database migrations.

Do not manually modify production tables without migration tracking.

Possible tools:

```text
Prisma Migrate
Alembic
Drizzle
Knex
Flyway
```

depending on the stack.

---

# 136. Migration Requirements

Every schema change should be:

```text
versioned
repeatable
reviewable
deployable
```

---

# 137. Seed Data

The production deployment should not depend on fake seed posts.

The agent should generate its own content after initialization.

Development may use:

```text
seed sources
seed candidates
seed posts
```

for testing.

---

# 138. Production Database Must Start Clean

For the hackathon evaluation:

```text
fresh agent
fresh runtime
fresh memory
```

should be initialized from the evaluator's request.

Do not preload a fake history designed to make the agent appear autonomous.

---

# 139. However — Persona Knowledge Is Different

Static persona/worldview configuration may be pre-existing.

For example:

```text
01_PERSONA_WORLDVIEW.md
```

defines the agent's identity.

That is configuration, not fake runtime history.

---

# 140. Static vs Dynamic Knowledge

### Static

```text
persona worldview
writing principles
editorial standards
sector taxonomy
system instructions
```

### Dynamic

```text
sources
candidates
posts
theses
memory
runtime state
```

Keep these conceptually separate.

---

# 141. Database and Documentation

The following documents map directly to database responsibilities:

```text
03_PERSONA...
04_AUTONOMOUS_STATE_MACHINE.md
05_MEMORY_AND_KNOWLEDGE.md
06_DISCOVERY_AND_SOURCE_STRATEGY.md
07_EDITORIAL_ENGINE.md
09_CONTENT_GENERATION.md
10_DISTRIBUTION_ARCHITECTURE.md
11_API_CONTRACT.md
```

The database is the persistence layer beneath all of them.

---

# 142. Minimum Viable Schema

If implementation time becomes constrained, the absolute MVP can operate with:

```text
agents
sources
candidates
editorial_decisions
posts
post_sources
theses
memories
runtime_state
```

The remaining tables can be added incrementally.

---

# 143. Recommended Hackathon Schema

For the actual submission, use:

```text
agents
sources
candidates
candidate_sources
editorial_decisions
theses
thesis_evidence
posts
post_sources
memories
publication_events
distribution_events
runtime_state
runtime_cycles
llm_usage
```

This provides enough observability and continuity without becoming excessive.

---

# 144. Relationship Diagram

The recommended architecture:

```text
                         ┌──────────────┐
                         │    AGENT     │
                         └──────┬───────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
         CANDIDATES          THESES             MEMORIES
              │                 │                  │
        ┌─────┴─────┐           │                  │
        ▼           ▼           ▼                  │
     SOURCES    DECISIONS   THESIS EVIDENCE        │
        │           │           │                  │
        └───────────┴─────┬─────┴──────────────────┘
                          ▼
                        POSTS
                          │
                     ┌────┴────┐
                     ▼         ▼
                POST_SOURCES  PUBLICATION_EVENTS
                                │
                                ▼
                         DISTRIBUTION_EVENTS

AGENT
  │
  └── RUNTIME_STATE
         │
         └── RUNTIME_CYCLES
                │
                └── LLM_USAGE
```

---

# 145. Data Flow

The normal lifecycle is:

```text
SOURCE
  ↓
CANDIDATE
  ↓
EDITORIAL_DECISION
  ↓
THESIS
  ↓
CONTENT
  ↓
POST
  ↓
PUBLICATION_EVENT
  ↓
MEMORY
```

External distribution branches from:

```text
POST
 ↓
DISTRIBUTION_EVENT
```

---

# 146. Memory Flow

After publication:

```text
POST
 ↓
extract durable knowledge
 ↓
MEMORY
 ↓
future candidate evaluation
```

This creates the feedback loop:

```text
WORLD
 ↓
DISCOVERY
 ↓
POST
 ↓
MEMORY
 ↓
INTERPRETATION OF WORLD
```

---

# 147. Editorial Learning

Rejected candidates should also influence memory.

Example:

```text
Candidate
 ↓
Rejected
 ↓
reason = insufficient significance
 ↓
rejection memory
 ↓
future evaluation
```

This allows the system to improve editorial selectivity.

---

# 148. Do Not Train the Model at Runtime

The database is not intended to fine-tune the LLM during the hackathon.

Instead:

```text
database memory
→ retrieval
→ context
→ reasoning
```

is sufficient.

This is cheaper, faster, and more reliable.

---

# 149. Memory Is External to the Model

The LLM itself should not be expected to remember the 48-hour history.

The architecture is:

```text
LLM
 +
persistent memory
 =
continuous agent identity
```

---

# 150. Database as Long-Term Memory

The most important persistent artifacts are:

```text
What I published.
What I believed.
What evidence changed my beliefs.
What I rejected.
What I learned.
```

That is the practical definition of memory for Second Order.

---

# 151. Final Database Invariants

The implementation should guarantee:

```text
1. No published post disappears unexpectedly.
2. Every published post has a unique ID.
3. Every published post has a timestamp.
4. Every published post has a rationale.
5. Every published post has sources.
6. Every post belongs to an agent.
7. Every candidate belongs to an agent.
8. Every editorial decision is persisted.
9. Rejected candidates are retained.
10. Important theses persist across cycles.
11. Relevant memories persist across restarts.
12. Runtime state can recover after crashes.
13. Duplicate cycles are prevented.
14. Publication is idempotent.
15. Feed queries are efficiently indexed.
16. External distribution cannot corrupt the internal feed.
```

---

# 152. Final Architecture Principle

The database should make the following possible:

```text
Kill the application.
Restart it.
Ask:

"What have you published?"

The agent should still know.
```

Then:

```text
Ask:

"What did you previously believe?"

The agent should still know.

Ask:

"What changed your mind?"

The agent should be able to reconstruct the answer.

Ask:

"Why didn't you publish this?"

The system should have a persisted editorial decision.
```

That is why the database is more than storage.

It is the durable substrate that turns Second Order from:

> **a stateless content generator**

into:

> **a persistent autonomous technological persona.**
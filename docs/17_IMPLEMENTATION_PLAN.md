# 17_IMPLEMENTATION_PLAN.md

# Second Order — Implementation Plan

## 1. Purpose

This document converts the Second Order architecture into an executable engineering plan.

It defines:

- implementation order,
- milestones,
- dependencies,
- acceptance criteria,
- development priorities,
- testing gates,
- deployment sequence,
- and the final hackathon submission process.

The implementation should be incremental.

> **Do not build the entire system simultaneously. Build the smallest autonomous loop first, prove it works, then add intelligence and sophistication.**

---

# 2. Implementation Objective

The final system must support this lifecycle:

```text
INITIALIZE
    ↓
DISCOVER
    ↓
FILTER
    ↓
JUDGE
    ↓
RESEARCH
    ↓
GENERATE
    ↓
VALIDATE
    ↓
PUBLISH
    ↓
REMEMBER
    ↓
WAIT
    ↓
DISCOVER AGAIN
```

All major engineering decisions should support this loop.

---

# 3. Source of Truth

Before implementation, the coding agent must read:

```text
00_PROJECT_VISION.md
01_PERSONA_WORLDVIEW.md
02_EDITORIAL_CONSTITUTION.md
03_SYSTEM_ARCHITECTURE.md
04_AUTONOMOUS_STATE_MACHINE.md
05_MEMORY_AND_KNOWLEDGE.md
06_DISCOVERY_AND_SOURCE_STRATEGY.md
07_EDITORIAL_ENGINE.md
08_LLM_STRATEGY.md
09_CONTENT_GENERATION.md
10_DISTRIBUTION_ARCHITECTURE.md
11_API_CONTRACT.md
12_DATABASE_SCHEMA.md
13_DEPLOYMENT.md
14_COST_AND_RESOURCE_BUDGET.md
15_SECURITY_AND_SECRETS.md
16_TESTING_AND_EVALUATION.md
18_HACKATHON_CHECKLIST.md
19_DECISIONS.md
```

These documents collectively define the system.

Record non-obvious implementation decisions in:

```text
19_DECISIONS.md
```

This prevents late hackathon changes from living only in memory or chat history.

If implementation details conflict with them:

> **Do not silently choose one. Resolve the conflict according to the highest-level project vision and API requirements.**

---

# 4. Implementation Principle

Build in this order:

```text
FOUNDATION
    ↓
DATABASE
    ↓
API
    ↓
RUNTIME
    ↓
DISCOVERY
    ↓
EDITORIAL ENGINE
    ↓
LLM
    ↓
CONTENT GENERATION
    ↓
MEMORY
    ↓
DISTRIBUTION
    ↓
OBSERVABILITY
    ↓
SECURITY HARDENING
    ↓
AUTONOMY TEST
    ↓
DEPLOYMENT
```

---

# 5. Do Not Start With

Do NOT begin by implementing:

```text
X integration
LinkedIn integration
complex frontend
vector database
multi-agent architecture
advanced analytics
GPU inference
microservices
```

These are not required for the core evaluation.

---

# 6. MVP Definition

The MVP is:

```text
One autonomous agent
+
One persona
+
Live discovery
+
Editorial judgment
+
LLM generation
+
Persistent memory
+
Post storage
+
Autonomous scheduling
+
Required API
```

Nothing else is necessary for the first working version.

## MVP Non-Goals

The MVP should explicitly defer:

```text
real social posting
frontend dashboard polish
semantic/vector memory
multi-agent orchestration
manual post creation tools
engagement analytics
```

These features are useful only after the autonomous loop can survive restart, publish over time, and expose the required feed contract.

---

# 6A. Model Cost Strategy

Implement the LLM layer as free-first.

The first working version should not depend on expensive multi-agent orchestration. Use one autonomous runtime and route model calls by task cost:

```text
code/rules -> free model -> paid fallback only if necessary
```

Acceptance requirements:

```text
[ ] primary model can be configured as a free router/model
[ ] paid fallback is optional and disabled by budget when exhausted
[ ] no paid call happens before deduplication and basic filtering
[ ] every LLM call records provider, model, operation, success, and estimated cost
[ ] runtime can defer publication when model budget or free availability fails
```

This keeps the project competitive on reliability and evaluation behavior instead of spending on unnecessary agent complexity.

---

# 7. Phase 0 — Repository Preparation

## Objective

Create a clean project structure.

Recommended:

```text
second-order/
│
├── docs/
│   ├── 00_PROJECT_VISION.md
│   ├── ...
│   └── 17_IMPLEMENTATION_PLAN.md
│
├── src/
│   ├── api/
│   ├── agent/
│   ├── discovery/
│   ├── editorial/
│   ├── generation/
│   ├── memory/
│   ├── distribution/
│   ├── llm/
│   ├── database/
│   ├── runtime/
│   ├── security/
│   └── shared/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── system/
│   └── evaluation/
│
├── scripts/
│
├── .env.example
├── .gitignore
├── README.md
└── package/project configuration
```

The exact language/framework may differ.

---

# 8. Phase 0 Acceptance Criteria

The project must:

```text
[ ] initialize locally
[ ] install dependencies
[ ] run tests
[ ] start development server
[ ] connect to local/test database
[ ] load environment configuration
```

No agent intelligence is required yet.

---

# 9. Phase 1 — Configuration System

Implement centralized configuration.

Required categories:

```text
application
database
LLM
runtime
budget
discovery
distribution
security
```

---

# 10. Configuration Requirements

Configuration should come from environment variables.

Do not scatter:

```text
API keys
model names
runtime intervals
budgets
```

through application code.

---

# 11. Configuration Validation

On startup:

```text
load configuration
        ↓
validate required values
        ↓
start application
```

If a required production configuration is missing:

```text
fail clearly
```

rather than failing later during a runtime cycle.

---

# 12. Phase 1 Acceptance Criteria

```text
[ ] .env.example exists
[ ] production secrets are external
[ ] configuration is typed/validated
[ ] development configuration works
[ ] test configuration works
[ ] production configuration can be supplied
```

---

# 13. Phase 2 — Database

Implement the schema defined in:

```text
12_DATABASE_SCHEMA.md
```

---

# 14. Database Priority

Implement first:

```text
agents
posts
sources
candidates
runtime_state
```

Then:

```text
memory
theses
editorial_decisions
llm_usage
```

Then optional:

```text
distribution_events
```

---

# 15. Database Migrations

Create versioned migrations.

The project must support:

```text
fresh database
→ migrations
→ working schema
```

---

# 16. Database Repository Layer

Do not allow the entire application to directly manipulate SQL.

Create repositories/services such as:

```text
AgentRepository
PostRepository
CandidateRepository
MemoryRepository
RuntimeRepository
SourceRepository
```

---

# 17. Database Acceptance Criteria

```text
[ ] migrations run successfully
[ ] agent can be created
[ ] agent can be retrieved
[ ] post can be created
[ ] posts can be retrieved chronologically
[ ] memory can be persisted
[ ] runtime state can be persisted
[ ] database survives application restart
```

---

# 18. Phase 3 — Agent Domain Model

Implement the core agent object.

Conceptually:

```text
Agent
├── identity
├── persona
├── worldview
├── memory
├── runtime state
└── configuration
```

---

# 19. Agent Initialization

Implement:

```http
POST /api/agent/init
```

The endpoint should:

```text
validate request
 ↓
create/load agent
 ↓
initialize runtime state
 ↓
persist
 ↓
return agentId
```

---

# 20. Agent Initialization Must Not Generate Content

The initialization endpoint should not perform the entire autonomous cycle synchronously.

Initialization means:

> "The agent exists and is ready to operate."

The runtime is responsible for autonomous execution.

---

# 21. Phase 3 Acceptance Criteria

```text
[ ] POST /api/agent/init works
[ ] agentId returned
[ ] agent persisted
[ ] persona persisted
[ ] runtime state created
[ ] duplicate initialization handled
[ ] repeated init does not create competing active agents
[ ] runtime starts or is scheduled without another evaluator action
```

---

# 22. Phase 4 — Feed API

Implement:

```http
GET /api/agent/feed?agentId=...
```

---

# 23. Feed Behavior

The endpoint must:

```text
validate agentId
 ↓
load posts
 ↓
sort newest first
 ↓
return required schema
```

---

# 24. Feed Must Be Read-Only

The feed endpoint must never:

```text
discover
generate
publish
modify memory
```

It is an observation endpoint.

---

# 25. Feed Acceptance Criteria

```text
[ ] empty feed returns []
[ ] posts return correctly
[ ] newest first
[ ] unique IDs
[ ] ISO UTC timestamps
[ ] rationale present
[ ] sources present
[ ] previous posts remain available
```

---

# 26. Phase 5 — Runtime State Machine

Implement:

```text
04_AUTONOMOUS_STATE_MACHINE.md
```

as actual code.

---

# 27. Runtime States

At minimum:

```text
INITIALIZING
IDLE
DISCOVERING
FILTERING
RESEARCHING
JUDGING
GENERATING
VALIDATING
PUBLISHING
REMEMBERING
WAITING
ERROR_RECOVERY
```

---

# 28. Runtime Transition Engine

The runtime should explicitly control transitions.

Conceptually:

```text
state
 ↓
action
 ↓
result
 ↓
next state
```

Avoid one giant function containing the entire agent.

---

# 29. Runtime Cycle

The core cycle should be approximately:

```text
WAKE
 ↓
LOAD STATE
 ↓
DISCOVER
 ↓
FILTER
 ↓
JUDGE
 ↓
RESEARCH
 ↓
GENERATE
 ↓
VALIDATE
 ↓
PUBLISH
 ↓
REMEMBER
 ↓
SAVE STATE
 ↓
WAIT
```

---

# 30. Runtime Lock

Implement a lease/lock so only one cycle can run per agent.

Required behavior:

```text
cycle A running
cycle B starts
        ↓
B sees active lease
        ↓
B exits safely
```

---

# 31. Runtime Recovery

Locks must expire.

If a process crashes:

```text
stale lease
 ↓
lease timeout
 ↓
next cycle recovers
```

---

# 32. Phase 5 Acceptance Criteria

```text
[ ] runtime starts automatically
[ ] cycle executes
[ ] state transitions are observable
[ ] only one cycle runs
[ ] failed cycle does not kill runtime
[ ] stale locks recover
[ ] next cycle can execute
```

---

# 33. Phase 6 — Discovery Layer

Implement:

```text
06_DISCOVERY_AND_SOURCE_STRATEGY.md
```

---

# 34. Discovery Provider Interface

Use an abstraction:

```text
DiscoveryProvider
```

Possible implementations:

```text
RSSProvider
WebSearchProvider
GitHubProvider
ResearchProvider
OfficialSourceProvider
```

---

# 35. Discovery Should Be Modular

The Editorial Engine should not care whether a candidate came from:

```text
RSS
search
GitHub
research paper
official website
```

It should receive normalized candidates.

---

# 36. Normalized Candidate

A candidate should contain approximately:

```text
id
title
summary
url
source
publishedAt
discoveredAt
sector
content
```

plus scoring metadata.

---

# 37. Discovery Source Priority

Prioritize:

```text
primary sources
official announcements
technical documentation
research
credible reporting
```

before:

```text
low-quality aggregation
```

---

# 38. Discovery Deduplication

Implement:

```text
URL deduplication
title similarity
content hash
semantic similarity where practical
```

---

# 39. Discovery Freshness

Candidates must contain:

```text
publishedAt
discoveredAt
```

and support freshness scoring.

---

# 40. Discovery Acceptance Criteria

```text
[ ] live source can be queried
[ ] candidates normalized
[ ] duplicates removed
[ ] stale candidates filtered
[ ] source metadata preserved
[ ] discovery failure is recoverable
[ ] no single source is mandatory
[ ] source allowlist/seed list contains URLs only, not prewritten posts
[ ] at least one fallback discovery provider exists
```

---

# 41. Phase 7 — Source Sanitization & Security

Before feeding content to the LLM:

```text
raw source
 ↓
URL validation
 ↓
fetch
 ↓
sanitize
 ↓
extract text
 ↓
mark as UNTRUSTED EVIDENCE
```

---

# 42. Source Safety

Implement:

```text
timeouts
response-size limits
URL validation
redirect validation
private-IP blocking
safe HTML parsing
```

---

# 43. Prompt Injection Boundary

Every source should enter the model context with explicit semantics:

```text
UNTRUSTED SOURCE MATERIAL
```

The model must not treat source text as instructions.

---

# 44. Phase 7 Acceptance Criteria

```text
[ ] malicious source cannot alter system policy
[ ] private URLs rejected
[ ] huge responses rejected
[ ] source timeout handled
[ ] source parsing safe
```

---

# 45. Phase 8 — LLM Provider Layer

Implement:

```text
08_LLM_STRATEGY.md
```

---

# 46. LLM Abstraction

Create:

```text
LLMProvider
```

with:

```text
generate()
```

or equivalent structured methods.

---

# 47. Required Implementations

At minimum:

```text
RealLLMProvider
MockLLMProvider
```

---

# 48. Model Routing

Implement:

```text
fast model
strong model
optional fallback
```

---

# 49. LLM Operations

Separate operations:

```text
SCREEN
SUMMARIZE
JUDGE
GENERATE
CRITIQUE
MEMORY_EXTRACT
```

Do not use one generic prompt for everything.

---

# 50. Structured Output

Use structured responses for:

```text
editorial decisions
candidate scores
memory extraction
content generation
```

Validate all outputs.

---

# 51. LLM Usage Tracking

Every real LLM call must record:

```text
provider
model
operation
tokens
estimated cost
latency
success
cycle
```

---

# 52. LLM Budget Guard

Before every call:

```text
check remaining budget
```

If insufficient:

```text
fallback
defer
or reject
```

---

# 53. Phase 8 Acceptance Criteria

```text
[ ] provider abstraction works
[ ] mock provider works
[ ] real provider works
[ ] structured outputs validate
[ ] retries bounded
[ ] usage recorded
[ ] budget enforced
```

---

# 54. Phase 9 — Editorial Engine

Implement:

```text
07_EDITORIAL_ENGINE.md
```

---

# 55. Editorial Pipeline

The engine should perform:

```text
candidate
 ↓
relevance
 ↓
significance
 ↓
timeliness
 ↓
originality
 ↓
persona fit
 ↓
evidence quality
 ↓
repetition penalty
 ↓
editorial score
 ↓
PUBLISH / REJECT / DEFER
```

---

# 56. Editorial Judgment Must Be Independent

Do not make:

```text
interesting = publish
```

The agent should ask:

```text
Is this worth occupying the persona's limited attention?
```

---

# 57. Editorial Scoring

Implement configurable scoring.

Possible dimensions:

```text
importance
novelty
timeliness
technology relevance
strategic significance
evidence quality
persona fit
originality
repetition
```

---

# 58. Rejection Reasons

Every rejection should have an internal reason such as:

```text
LOW_SIGNIFICANCE
STALE
DUPLICATE
WEAK_EVIDENCE
OUT_OF_SCOPE
INSUFFICIENT_NOVELTY
POOR_PERSONA_FIT
```

---

# 59. Editorial Acceptance Criteria

```text
[ ] weak stories rejected
[ ] duplicates rejected
[ ] stale stories rejected
[ ] strong stories selected
[ ] cross-sector technology considered
[ ] decisions persist
[ ] editorial reasoning available
```

---

# 60. Phase 10 — Persona & Worldview Integration

Load the rules from:

```text
01_PERSONA_WORLDVIEW.md
```

into the generation/editorial pipeline.

---

# 61. Persona Must Be Configuration

Do not recreate persona rules in random prompts.

Centralize:

```text
identity
interests
worldview
editorial principles
tone
taboos
```

---

# 62. Persona Stability

Every generation should receive the relevant stable persona context.

Do not rely solely on conversation history.

There may be no persistent conversation.

---

# 63. Persona Context Budget

Do not include the entire worldview document in every call if it becomes unnecessarily large.

Use a compact runtime representation.

---

# 64. Persona Acceptance Criteria

Across multiple test posts:

```text
[ ] recognizable voice
[ ] stable worldview
[ ] stable domain
[ ] technology-focused
[ ] cross-sector capable
[ ] no creator impersonation
```

---

# 65. Phase 11 — Memory System

Implement:

```text
05_MEMORY_AND_KNOWLEDGE.md
```

---

# 66. Memory Categories

Support:

```text
episodic memory
semantic memory
thesis memory
rejection memory
source memory
topic memory
```

---

# 67. Memory Lifecycle

```text
experience
 ↓
candidate memory
 ↓
validation
 ↓
persist
 ↓
retrieve later
 ↓
influence future reasoning
 ↓
update/strengthen/weaken
```

---

# 68. Memory Retrieval

Given a candidate:

```text
retrieve relevant memories
```

using:

```text
topic
entities
semantic similarity
sector
thesis relationship
recency
```

---

# 69. Memory Must Influence Behavior

A successful implementation is not:

```text
database contains memories
```

It is:

```text
database contains memories
        ↓
future reasoning changes because of them
```

---

# 70. Memory Acceptance Criteria

```text
[ ] posts create useful memories
[ ] relevant memories retrieved
[ ] previous topics recognized
[ ] duplicate stories penalized
[ ] thesis evolution possible
[ ] false/low-confidence memories not blindly trusted
```

---

# 71. Phase 12 — Research Synthesis

Before final generation, selected candidates may require deeper research.

Implement:

```text
candidate
 ↓
source collection
 ↓
fact extraction
 ↓
evidence synthesis
 ↓
editorial context
```

---

# 72. Research Requirements

Research should answer:

```text
What actually happened?
What is new?
Why does it matter?
What evidence supports this?
What is uncertain?
What does it connect to?
```

---

# 73. Research Must Not Become Endless

Set:

```text
MAX_RESEARCH_SOURCES
MAX_RESEARCH_TIME
MAX_RESEARCH_TOKENS
```

---

# 74. Research Acceptance Criteria

```text
[ ] selected topics receive sufficient evidence
[ ] primary sources prioritized
[ ] conflicting information identified
[ ] research bounded
[ ] research failures recoverable
```

---

# 75. Phase 13 — Content Generation

Implement:

```text
09_CONTENT_GENERATION.md
```

---

# 76. Generation Pipeline

```text
selected topic
 ↓
research
 ↓
relevant memory
 ↓
persona context
 ↓
editorial thesis
 ↓
draft
 ↓
critique
 ↓
revision if justified
 ↓
final post
```

---

# 77. Content Must Be Original

The system may learn from general writing techniques, but it should generate original text.

Do not directly reproduce source content.

---

# 78. Generation Requirements

Every final post needs:

```text
text
rationale
sources
```

---

# 79. Content Validation

Before publication:

```text
schema
length
source presence
persona fit
topic relevance
unsupported claims
duplicate similarity
```

must be checked.

---

# 80. Content Acceptance Criteria

```text
[ ] strong hook
[ ] clear thesis
[ ] evidence
[ ] distinctive viewpoint
[ ] readable structure
[ ] source-backed
[ ] concise
[ ] no obvious hallucinations
```

---

# 81. Phase 14 — Publication

Implement:

```text
10_DISTRIBUTION_ARCHITECTURE.md
```

---

# 82. Internal Publication First

The first publication target should be:

```text
internal feed
```

not X or LinkedIn.

---

# 83. Publication Transaction

```text
validate
 ↓
persist post
 ↓
record publication event
```

Only after successful persistence should optional external distribution occur.

---

# 84. Publication Idempotency

The same logical post must not be inserted twice because of retries.

Use:

```text
candidate identity
content hash
publication key
```

as appropriate.

---

# 85. Publication Acceptance Criteria

```text
[ ] post persists
[ ] feed exposes it
[ ] post ID unique
[ ] timestamp valid
[ ] rationale included
[ ] sources included
[ ] duplicate publication prevented
```

---

# 86. Phase 15 — Autonomous Loop Integration

Now connect every component.

Final pipeline:

```text
Runtime
  ↓
Discovery
  ↓
Candidate normalization
  ↓
Deduplication
  ↓
Editorial Engine
  ↓
Research
  ↓
Memory retrieval
  ↓
LLM generation
  ↓
Validation
  ↓
Publication
  ↓
Memory update
  ↓
Runtime state update
```

---

# 87. First True Autonomous Test

This is the first major milestone.

Run:

```text
POST /api/agent/init
```

Then do nothing.

The system must eventually produce a post.

---

# 88. Autonomous Loop Milestone

This milestone is passed only if:

```text
[ ] no generation API exists/needs to be called
[ ] runtime starts automatically
[ ] discovery occurs
[ ] editorial judgment occurs
[ ] content is generated
[ ] post is persisted
[ ] feed changes
```

---

# 89. Phase 16 — Multiple-Cycle Test

After the first autonomous post:

```text
wait
```

and allow another cycle.

Verify:

```text
new candidates
new decisions
possible second publication
```

---

# 90. Multiple-Cycle Acceptance Criteria

```text
[ ] cycle 1 works
[ ] cycle 2 works
[ ] cycle 3 works
[ ] no manual intervention
[ ] previous posts remain
[ ] duplicate stories handled
[ ] memory is used
```

---

# 91. Phase 17 — Cross-Sector Intelligence

Ensure the discovery and editorial architecture supports:

```text
AI
semiconductors
robotics
cloud
cybersecurity
developer tools
open source
hardware
consumer technology
operating systems
telecommunications
databases
distributed systems
AR/VR
quantum
space technology
other meaningful technology sectors
```

---

# 92. Cross-Sector Acceptance Criteria

The system should be capable of publishing about a non-AI technology development when:

```text
it is important
it fits the worldview
it has strong evidence
it offers meaningful analysis
```

It should not force AI relevance artificially.

---

# 93. Phase 18 — Cost Controls

Implement:

```text
14_COST_AND_RESOURCE_BUDGET.md
```

---

# 94. Cost Control Requirements

```text
[ ] token usage tracked
[ ] cost tracked
[ ] daily budget tracked
[ ] total budget tracked
[ ] per-cycle budget enforced
[ ] model downgrade supported
[ ] retry cost bounded
```

---

# 95. Budget Test

Set:

```text
TOTAL_LLM_BUDGET_USD=0.01
```

or another tiny test budget.

Run a cycle.

Verify the system stops expensive calls safely.

---

# 96. Phase 19 — Security Hardening

Implement:

```text
15_SECURITY_AND_SECRETS.md
```

---

# 97. Security Requirements

```text
[ ] secrets outside Git
[ ] HTTPS
[ ] input validation
[ ] SQL injection protection
[ ] SSRF protection
[ ] source sanitization
[ ] prompt injection defense
[ ] LLM output validation
[ ] protected runtime trigger
[ ] development endpoints disabled
```

---

# 98. Phase 20 — Testing Suite

Implement:

```text
16_TESTING_AND_EVALUATION.md
```

as executable tests wherever possible.

---

# 99. Automated Tests

Automate:

```text
API
database
runtime
discovery
editorial logic
schema validation
security
budget
publication
memory
```

---

# 100. Manual Evaluation

Manual evaluation remains necessary for:

```text
voice
engagement
editorial quality
originality
worldview coherence
memory quality
```

---

# 101. Phase 21 — Observability

Implement internal metrics.

Minimum:

```text
cycles
successful cycles
failed cycles
posts
candidates
rejections
last cycle
last post
LLM usage
LLM cost
```

---

# 102. Logging

Ensure logs make it possible to answer:

```text
Why did the agent fail?
Why did it publish?
Why did it reject?
How much did the cycle cost?
When did the last cycle run?
```

---

# 103. Phase 22 — Deployment

Follow:

```text
13_DEPLOYMENT.md
```

---

# 104. Deployment Order

```text
create database
 ↓
configure secrets
 ↓
run migrations
 ↓
deploy application
 ↓
verify health
 ↓
verify API
 ↓
verify runtime
```

---

# 105. Production Smoke Test

Run:

```text
GET /health
```

Then:

```text
POST /api/agent/init
```

Then:

```text
GET /api/agent/feed
```

---

# 106. Production Autonomous Test

After initialization:

```text
DO NOTHING
```

Wait for the runtime.

Do not trigger generation manually.

---

# 107. Phase 23 — Restart Recovery

Restart the production service.

Verify:

```text
existing posts remain
memory remains
runtime resumes
new cycles occur
```

---

# 108. Phase 24 — Failure Recovery

Test in staging:

```text
LLM failure
source failure
database reconnect
application restart
runtime crash
scheduler duplication
```

---

# 109. Phase 25 — 48-Hour Readiness

Before the actual hackathon submission, the system must satisfy:

```text
[ ] autonomous operation
[ ] persistence
[ ] feed availability
[ ] reliable scheduling
[ ] LLM provider stable
[ ] budget stable
[ ] source discovery stable
[ ] memory stable
```

---

# 110. Implementation Priority Levels

Each feature should be classified:

### P0 — Required

Without this the project fails the hackathon.

```text
API
database
runtime
discovery
editorial judgment
LLM
generation
memory
internal publication
autonomy
```

### P1 — Important

Improves reliability/quality.

```text
fallback LLM
advanced deduplication
thesis evolution
budget routing
strong observability
security hardening
```

### P2 — Optional

Only after P0/P1 are stable.

```text
X
LinkedIn
advanced frontend
analytics
advanced semantic search
```

---

# 111. P0 Implementation Order

Strictly prioritize:

```text
1. Project foundation
2. Configuration
3. Database
4. Init API
5. Feed API
6. Runtime
7. Discovery
8. LLM
9. Editorial Engine
10. Content Generation
11. Publication
12. Memory
13. Autonomous integration
```

---

# 112. P1 Implementation Order

Then:

```text
14. Security hardening
15. Cost controls
16. Advanced memory
17. Better research
18. Fallback model
19. Observability
20. Recovery
21. Evaluation tooling
```

---

# 113. P2 Implementation Order

Only if time remains:

```text
22. X integration
23. LinkedIn integration
24. Frontend dashboard
25. Advanced analytics
26. Advanced semantic retrieval
```

---

# 114. Definition of Done — Component

A component is not complete merely because the code exists.

A component is complete when:

```text
implemented
+
tested
+
integrated
+
failure-handled
+
documented
```

---

# 115. Definition of Done — Feature

Every feature must have:

```text
implementation
unit/integration test
error handling
configuration
logging where appropriate
acceptance criterion
```

---

# 116. Definition of Done — Autonomous Capability

An autonomous capability is complete only when:

```text
it can run without human prompting
```

and:

```text
it persists relevant state
```

and:

```text
it recovers from normal failure.
```

---

# 117. Development Workflow

For every implementation task:

```text
READ DOC
 ↓
DEFINE INTERFACE
 ↓
IMPLEMENT MINIMUM VERSION
 ↓
WRITE TEST
 ↓
RUN TEST
 ↓
INTEGRATE
 ↓
RUN SYSTEM TEST
 ↓
COMMIT
```

---

# 118. Coding Agent Rule

Antigravity should not implement a feature by guessing undocumented behavior.

If requirements are unclear:

```text
inspect relevant documentation
```

before introducing architecture.

---

# 119. Coding Agent Rule — Avoid Overengineering

Do not introduce:

```text
microservices
message brokers
complex orchestration
multiple databases
```

unless required by an explicit project requirement.

---

# 120. Coding Agent Rule — Preserve Interfaces

Once an interface is defined:

```text
DiscoveryProvider
LLMProvider
MemoryRepository
PublicationService
```

prefer extending it over rewriting the architecture.

---

# 121. Coding Agent Rule — Test After Each Milestone

After every major phase:

```text
run tests
```

before moving on.

Do not accumulate dozens of untested changes.

---

# 122. Coding Agent Rule — Keep Production and Test Paths Separate

Never add hacks such as:

```text
if TESTING:
    bypass editorial judgment
```

that can accidentally leak into production behavior.

Mocks should replace external services cleanly.

---

# 123. Coding Agent Rule — No Fake Autonomy

Do not implement:

```text
timer
→ always generate predetermined post
```

to satisfy the appearance of autonomy.

The real pipeline must perform:

```text
discovery
judgment
generation
memory
```

---

# 124. Coding Agent Rule — No Fake Sources

Do not create fake URLs merely to satisfy:

```text
sources
```

requirements.

Every published post must have real supporting sources.

---

# 125. Coding Agent Rule — No Preloaded Feed

Do not seed production with a large collection of fake posts.

The evaluator must observe posts generated after initialization.

---

# 126. Development Seed Data

Seed data is allowed for local testing.

It must be clearly separated from production.

Example:

```text
NODE_ENV=test
```

may load fixtures.

Production must not.

---

# 127. Coding Agent Rule — No Manual Publication Dependency

The system must not require:

```text
POST /debug/publish
```

to create production posts.

---

# 128. Coding Agent Rule — No Hidden Human Loop

The system must not contain:

```text
waiting_for_human=true
```

or equivalent behavior after initialization.

The whole point is autonomous operation.

---

# 129. Coding Agent Rule — Preserve Evidence

When publishing, store:

```text
candidate
sources
editorial decision
generation metadata
post
```

so the publication can be explained later.

---

# 130. Phase Gates

Each phase has a gate.

### Gate A

Foundation works.

### Gate B

Database + API work.

### Gate C

Runtime works.

### Gate D

Discovery works.

### Gate E

LLM + editorial engine work.

### Gate F

First autonomous post works.

### Gate G

Multiple autonomous cycles work.

### Gate H

Memory affects future behavior.

### Gate I

Failure recovery works.

### Gate J

48-hour simulation passes.

Do not move forward while a critical gate is broken.

---

# 131. First Demo Milestone

The first meaningful demo should be:

```text
POST /api/agent/init
        ↓
wait
        ↓
GET /api/agent/feed
        ↓
autonomously generated post
```

This should happen as early as possible.

---

# 132. Second Demo Milestone

Then:

```text
Post A
 ↓
new cycle
 ↓
Post B
```

without intervention.

---

# 133. Third Demo Milestone

Then demonstrate:

```text
Post A:
technology event

Post B:
related development

Post B references/evolves the thinking from Post A
```

This demonstrates memory.

---

# 134. Fourth Demo Milestone

Demonstrate rejection:

```text
candidate A → rejected
candidate B → rejected
candidate C → published
```

This demonstrates editorial judgment.

---

# 135. Fifth Demo Milestone

Demonstrate cross-sector intelligence:

```text
Post A → AI

Post B → semiconductor

Post C → robotics

Post D → developer infrastructure
```

while maintaining the same worldview.

---

# 136. Sixth Demo Milestone

Demonstrate recovery:

```text
agent running
 ↓
restart
 ↓
memory retained
 ↓
runtime resumes
 ↓
new post appears later
```

---

# 137. Final Evaluation Demo

The ideal demonstration is not a screen showing code.

It is the feed itself.

The evaluator should be able to observe:

```text
time
 ↓
post
 ↓
time
 ↓
post
 ↓
time
 ↓
post
```

and see intellectual continuity.

---

# 138. Final Submission Freeze

Before submission:

```text
freeze feature development
```

Then:

```text
run complete test suite
deploy final version
run smoke test
run autonomy test
verify budget
verify security
```

---

# 139. Do Not Make Risky Changes After Freeze

After the final autonomous test passes, do not casually change:

```text
LLM prompts
database schema
runtime timing
model provider
security configuration
```

without retesting.

---

# 140. Final Production Checklist

```text
[ ] Correct repository version deployed
[ ] Database migrated
[ ] Secrets configured
[ ] LLM provider working
[ ] Discovery working
[ ] Runtime enabled
[ ] API working
[ ] Feed working
[ ] Memory working
[ ] Budget configured
[ ] Security controls enabled
[ ] Logs visible
[ ] No development endpoints
[ ] Social integrations disabled unless intentional
```

---

# 141. Final Autonomy Checklist

```text
[ ] POST /init is the only initialization action
[ ] no human topic selection
[ ] no human content prompting
[ ] no human publication
[ ] discovery autonomous
[ ] editorial judgment autonomous
[ ] generation autonomous
[ ] memory autonomous
[ ] publication autonomous
[ ] future cycles autonomous
```

---

# 142. Final Quality Checklist

Read the feed and ask:

```text
[ ] Is the writing interesting?
[ ] Is the persona recognizable?
[ ] Are the opinions distinct?
[ ] Are sources credible?
[ ] Are rationales meaningful?
[ ] Is there evidence of memory?
[ ] Are weak topics rejected?
[ ] Is there cross-sector coverage?
[ ] Is the feed non-repetitive?
[ ] Does the agent appear intellectually alive?
```

---

# 143. Final Engineering Checklist

```text
[ ] Tests passing
[ ] No critical dependency vulnerabilities
[ ] No secrets in repository
[ ] Database persistent
[ ] Runtime lock tested
[ ] Retry limits tested
[ ] Budget guard tested
[ ] Source failures tested
[ ] LLM failures tested
[ ] Restart tested
[ ] Autonomous operation tested
```

---

# 144. Final Hackathon State

At submission time, the system should look approximately like:

```text
                     SECOND ORDER
                           │
                           ▼
                    INITIALIZED ONCE
                           │
                           ▼
                     AUTONOMOUS LOOP
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
      DISCOVERY         JUDGMENT          MEMORY
          │                │                ▲
          └────────────────┼────────────────┘
                           ▼
                       GENERATION
                           │
                           ▼
                       VALIDATION
                           │
                           ▼
                       PUBLICATION
                           │
                           ▼
                       FEED API
                           │
                           ▼
                       EVALUATOR
```

---

# 145. Final Implementation Principle

The implementation should be built around one fundamental distinction:

```text
Traditional AI application:

Human
 ↓
Prompt
 ↓
Model
 ↓
Output
```

Second Order:

```text
World
 ↓
Observation
 ↓
Memory
 ↓
Judgment
 ↓
Model
 ↓
Publication
 ↓
Memory
 ↓
Future Judgment
```

The second architecture is the product.

---

# 146. Ultimate Definition of Success

The implementation is successful when the team can perform:

```text
POST /api/agent/init
```

once,

walk away,

and approximately 48 hours later find that the system has:

```text
discovered new information
+
rejected things that were not worth saying
+
published worthwhile ideas
+
maintained a recognizable identity
+
remembered what it previously said
+
updated its thinking when circumstances changed
+
continued operating without additional prompts
```

That is the implementation target.

---

# 147. Recommended Build Sequence — Condensed

For practical execution, Antigravity should follow this exact order:

```text
01. Repository foundation
02. Configuration
03. Database + migrations
04. Agent model
05. POST /api/agent/init
06. GET /api/agent/feed
07. Runtime state machine
08. Runtime scheduler
09. Discovery provider
10. Source sanitization
11. LLM provider abstraction
12. Mock LLM
13. Editorial Engine
14. Persona/worldview integration
15. Memory
16. Research synthesis
17. Content generation
18. Content validation
19. Internal publication
20. Full autonomous loop
21. Cost controls
22. Security hardening
23. Observability
24. Failure recovery
25. Automated test suite
26. Multi-cycle autonomy test
27. Long-running test
28. Production deployment
29. Fresh deployment test
30. 12–24 hour dry run
31. Final freeze
32. Hackathon initialization
```

---

# 148. What Not To Do

Do not:

```text
build everything before testing anything

add X/LinkedIn before internal publishing works

add a frontend before the backend works

add vector search before basic memory works

deploy Ollama before proving hosted inference is insufficient

add multiple agents before one agent works

optimize infrastructure before the autonomous loop works

optimize cost before measuring actual cost

optimize engagement before establishing factual reliability

pre-generate posts for the evaluation

manually trigger posts during evaluation

hard-code fake autonomy
```

---

# 149. Priority Rule When Time Runs Short

If development time becomes constrained:

### Keep

```text
API
database
runtime
discovery
LLM
editorial judgment
generation
memory
internal publication
```

### Simplify

```text
advanced memory retrieval
research depth
fallback providers
analytics
UI
```

### Remove

```text
X
LinkedIn
multi-agent architecture
advanced infrastructure
```

The autonomous internal feed is the core product.

---

# 150. Final Principle for Antigravity

The coding agent should think of the implementation as a sequence of increasingly complete proofs:

```text
Proof 1:
The server works.

Proof 2:
The database works.

Proof 3:
The API works.

Proof 4:
The runtime works.

Proof 5:
The agent can discover.

Proof 6:
The agent can judge.

Proof 7:
The agent can write.

Proof 8:
The agent can publish.

Proof 9:
The agent can remember.

Proof 10:
The agent can repeat this without human intervention.

Proof 11:
The agent can survive failure.

Proof 12:
The agent can do all of this for ~48 hours.
```

Do not skip the proofs.

The final goal is not merely a sophisticated codebase.

It is a system for which we can demonstrate:

> **After initialization, Second Order genuinely continues thinking, selecting, creating, remembering, and publishing on its own.**
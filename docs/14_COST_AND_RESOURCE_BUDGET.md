# 14_COST_AND_RESOURCE_BUDGET.md

# Second Order — Cost & Resource Budget

## 1. Purpose

This document defines the financial, compute, API, storage, and operational resource budget for **Second Order**.

The objective is not to make the system literally zero-cost at all times.

The objective is:

> **Use the smallest practical budget that produces a reliable, intelligent, engaging autonomous persona for the full hackathon evaluation window.**

The hackathon evaluation lasts approximately:

```text
48 hours
```

The system must remain operational throughout that period without requiring manual intervention.

---

# Free-First Budget Policy

The default budget posture is:

```text
free by default
paid only as bounded fallback
never spend money just to fill the feed
```

The system should prefer:

```text
code/rules before LLM calls
free models before paid models
short prompts before long prompts
candidate filtering before generation
fewer stronger posts before many weak posts
```

Recommended hard guards:

```text
MAX_DAILY_LLM_COST_USD=1.00
MAX_MONTHLY_LLM_COST_USD=10.00
MAX_LLM_CALLS_PER_CYCLE=6
MAX_PAID_LLM_CALLS_PER_DAY=10
MAX_POSTS_PER_DAY=6
```

These values may be adjusted, but the implementation must have explicit limits.

When free model routing is unavailable, the agent should follow this order:

```text
retry once with backoff
try configured free fallback
use paid fallback only if budget allows
otherwise defer publication
```

The agent must not publish unsupported or fabricated posts merely because a model provider failed.

---

# 2. Budget Philosophy

Second Order should follow this principle:

```text
Spend money on intelligence.
Avoid spending money on infrastructure that does not improve intelligence or reliability.
```

Priority:

```text
1. Reliable LLM inference
2. Reliable persistent database
3. Reliable application hosting
4. Reliable autonomous scheduling
5. Everything else
```

Avoid spending money on:

- unnecessary microservices,
- premium analytics,
- expensive vector databases,
- Kubernetes,
- message brokers,
- social-media infrastructure,
- GPU servers,
- unnecessary observability platforms.

---

# 3. Target Budget

The preferred target for the entire hackathon is:

```text
TARGET:
$5–$15 USD
```

A stronger model can justify additional spending if it materially improves:

- editorial reasoning,
- factual reliability,
- writing quality,
- or persona consistency.

---

# 4. Hard Budget Ceiling

The system should have a configurable maximum LLM spend.

Recommended initial ceiling:

```text
MAX_LLM_BUDGET = $15
```

This is a safety limit, not a requirement to spend $15.

The system should attempt to remain well below it.

---

# 5. Preferred Spend

A reasonable target is:

```text
Hosting:
$0–$5

Database:
$0–$5

LLM:
$3–$10

Other services:
$0–$2

TOTAL:
approximately $5–$15
```

Actual prices depend on providers and selected plans.

---

# 6. Zero-Cost Mode

The system should support a low-cost mode:

```text
BUDGET_MODE=FREE
```

This should use:

- free hosting where practical,
- free PostgreSQL where practical,
- free/open model APIs where available,
- free information sources,
- no external social publishing.

The architecture must still remain production-correct.

---

# 7. Recommended Mode

For the actual hackathon, use:

```text
BUDGET_MODE=HACKATHON
```

This means:

- free infrastructure wherever reliable,
- paid LLM inference where it materially improves quality,
- conservative token usage,
- persistent database,
- no unnecessary external integrations.

---

# 8. Premium Mode

An optional configuration may exist:

```text
BUDGET_MODE=QUALITY
```

This allows:

- stronger reasoning model,
- more research,
- additional verification,
- higher-quality generation.

It should still respect the absolute budget ceiling.

---

# 9. Cost Categories

Track costs in these categories:

```text
LLM inference
Hosting
Database
Web/discovery APIs
External scheduler
Social APIs
Storage
Monitoring
Other
```

---

# 10. LLM Is the Main Variable Cost

The largest unpredictable expense will likely be LLM inference.

Therefore:

> **LLM usage must be explicitly measured.**

Track:

```text
provider
model
operation
input tokens
output tokens
estimated cost
latency
success/failure
cycle
```

This is stored in:

```text
llm_usage
```

---

# 11. LLM Cost Model

Conceptually:

```text
cost =
(input_tokens × input_price)
+
(output_tokens × output_price)
```

Normalize the provider's pricing into a common internal representation.

---

# 12. Do Not Estimate Cost From Number of Requests Alone

One request could contain:

```text
500 tokens
```

or:

```text
50,000 tokens
```

Therefore:

```text
requests ≠ cost
```

Token usage is the primary measurement.

---

# 13. Model Allocation

Do not use the strongest model for every operation.

Recommended architecture:

```text
                    Candidate
                       │
                       ▼
                 Fast / Cheap LLM
                       │
                 initial screening
                       │
                       ▼
                Editorial Engine
                       │
                 Stronger LLM
                       │
                       ▼
                Content Generation
                       │
                       ▼
                  Critique
                       │
                       ▼
              Strong/Medium LLM
```

---

# 14. Cheap Model Responsibilities

Use a lower-cost model for:

- candidate classification,
- basic relevance filtering,
- source summarization,
- duplicate detection,
- simple extraction,
- memory classification,
- lightweight formatting.

Do not spend premium inference on trivial operations.

---

# 15. Strong Model Responsibilities

Use a stronger model for:

- editorial judgment,
- thesis formation,
- difficult synthesis,
- nuanced reasoning,
- final content generation,
- content critique,
- high-value follow-up analysis.

---

# 16. Model Selection Principle

Choose models based on:

```text
quality per dollar
```

not:

```text
raw benchmark score
```

A slightly weaker model that costs 10× less may be significantly better for this architecture.

---

# 17. Primary Model

Configure:

```env
LLM_PRIMARY_PROVIDER=
LLM_PRIMARY_MODEL=
```

The primary model should be used for high-value reasoning.

---

# 18. Fast Model

Configure:

```env
LLM_FAST_PROVIDER=
LLM_FAST_MODEL=
```

This model should handle routine work.

---

# 19. Fallback Model

Optional:

```env
LLM_FALLBACK_PROVIDER=
LLM_FALLBACK_MODEL=
```

The fallback should only be invoked when:

- primary model fails,
- primary provider is unavailable,
- or budget policy explicitly allows it.

---

# 20. Avoid Automatic Premium Escalation

Do not automatically escalate every difficult candidate to an expensive model.

Use:

```text
complexity
+
editorial importance
+
confidence
```

to determine whether premium reasoning is justified.

---

# 21. Complexity Score

Candidates may receive:

```text
complexity = 0.0–1.0
```

Example:

```text
0.2 → straightforward
0.5 → moderate
0.9 → highly complex
```

High complexity can justify a stronger model.

---

# 22. Editorial Value Score

Candidates already have:

```text
editorial_score = 0.0–1.0
```

Only high-value candidates should receive expensive generation.

---

# 23. Recommended LLM Routing

Conceptually:

```text
Candidate discovered
       │
       ▼
Fast model
       │
       ├── clearly weak → REJECT
       │
       └── potentially valuable
                  │
                  ▼
            Strong model
                  │
          editorial judgment
                  │
          ┌───────┴────────┐
          ▼                ▼
       REJECT            APPROVE
                           │
                           ▼
                    content generation
```

---

# 24. Candidate Filtering

Before expensive reasoning, remove:

- duplicate stories,
- obvious spam,
- low-quality sources,
- irrelevant sectors,
- trivial product updates,
- stale information,
- unsupported claims.

This reduces both cost and noise.

---

# 25. Source Deduplication

If ten sources discuss the same event:

```text
10 sources
    ↓
1 candidate
```

Do not perform ten independent full LLM analyses.

---

# 26. Research Compression

Raw source material should be compressed before entering expensive model contexts.

Example:

```text
10 articles
 ↓
fact extraction
 ↓
structured evidence
 ↓
2,000 tokens
 ↓
strong model
```

rather than:

```text
10 articles
 ↓
20,000 tokens
 ↓
strong model
```

---

# 27. Context Budget

Every LLM call should have a maximum context budget.

Example policy:

```text
screening:
small

editorial reasoning:
medium

final generation:
medium/large

critique:
medium
```

Exact limits depend on the chosen model.

---

# 28. Do Not Send the Entire Database

Never construct prompts like:

```text
Here are all posts ever published...
Here are all sources...
Here is all memory...
```

Instead retrieve only relevant context.

---

# 29. Memory Retrieval Budget

For each candidate, retrieve approximately:

```text
top relevant memories
+
relevant theses
+
recent related posts
```

Do not retrieve the entire memory corpus.

---

# 30. Recent Feed Context

Use a small number of recent posts to maintain voice and continuity.

For example:

```text
last 3–10 relevant posts
```

rather than every post ever published.

---

# 31. Thesis Context

If a candidate relates to an existing thesis:

```text
retrieve thesis
+
supporting evidence
+
contradicting evidence
```

This is more valuable than generic historical context.

---

# 32. LLM Call Budget

Set configurable limits:

```env
MAX_LLM_CALLS_PER_CYCLE=
MAX_LLM_TOKENS_PER_CYCLE=
MAX_LLM_COST_PER_CYCLE=
```

Example initial policy:

```text
MAX_LLM_CALLS_PER_CYCLE=15
```

but the implementation should avoid reaching this maximum routinely.

---

# 33. Cycle Cost Budget

Set:

```env
MAX_CYCLE_COST_USD=0.10
```

as an example starting point.

If a cycle approaches the limit:

```text
stop low-priority work
```

and preserve the remaining budget for important content.

The exact number should be calibrated against the selected model pricing.

---

# 34. Daily Budget

Set:

```env
DAILY_LLM_BUDGET_USD=1.00
```

as an example conservative target.

This produces approximately:

```text
$2
```

for 48 hours if fully consumed.

The value may be increased if stronger inference is needed.

---

# 35. Absolute Budget

Set:

```env
TOTAL_LLM_BUDGET_USD=15.00
```

as the emergency ceiling.

The system must never intentionally exceed it.

---

# 36. Budget States

Use:

```text
NORMAL
CAUTIOUS
RESTRICTED
EXHAUSTED
```

---

# 37. NORMAL

When:

```text
remaining budget > 50%
```

normal model routing applies.

---

# 38. CAUTIOUS

When:

```text
remaining budget <= 50%
```

begin reducing unnecessary expensive inference.

Possible actions:

```text
fewer candidates
smaller contexts
more fast-model screening
fewer critique passes
```

---

# 39. RESTRICTED

When:

```text
remaining budget <= 20%
```

use:

```text
fast model for routine work
strong model only for exceptional candidates
```

---

# 40. EXHAUSTED

When:

```text
remaining budget <= 0
```

do not make paid LLM calls.

The system should:

```text
continue serving existing feed
continue persistence
continue discovery if useful
wait for budget availability
```

Do not fabricate posts.

---

# 41. Budget Guard

The LLM service should perform a check before each call:

```text
Can this call fit within the remaining budget?
```

If not:

```text
skip
fallback
or defer
```

---

# 42. Never Exceed Budget Due to Retries

Retries can unexpectedly multiply cost.

Therefore:

```text
attempt 1
attempt 2
attempt 3
```

must all be included in budget calculations.

---

# 43. Maximum Retry Count

Recommended:

```text
MAX_LLM_RETRIES=2
```

Temporary errors may be retried.

Permanent errors should not.

---

# 44. Cost Attribution

Every LLM call must identify:

```text
agent_id
cycle_id
operation
provider
model
```

This allows cost analysis by subsystem.

---

# 45. Cost by Operation

Track at least:

```text
EDITORIAL_JUDGMENT
CONTENT_GENERATION
CONTENT_CRITIQUE
RESEARCH_SYNTHESIS
MEMORY_EXTRACTION
```

---

# 46. Identify the Expensive Operations

At the end of the evaluation, the system should make it possible to determine:

```text
Which operation consumed the most money?
```

This is useful for optimization.

---

# 47. Hosting Budget

The application should first attempt to use a free hosting tier if it provides sufficient reliability for the evaluation.

However:

> **Do not choose free infrastructure solely because it is free if it creates a significant risk of evaluation failure.**

Reliability has monetary value.

---

# 48. Hosting Decision Rule

Use:

```text
free tier
```

when:

- uptime is adequate,
- background execution is adequate,
- database persistence is adequate,
- and the 48-hour evaluation can be reliably supported.

Otherwise:

```text
upgrade minimally.
```

---

# 49. Render Strategy

If Render is used:

```text
Web Service
+
PostgreSQL
```

is the baseline.

If the free web service sleeps, use an appropriate scheduler/wake mechanism or choose a plan that provides sufficient runtime behavior.

Do not assume that keeping the process warm is equivalent to guaranteed autonomous scheduling.

---

# 50. Native Scheduler Preference

If a hosting platform offers a native cron/scheduled job:

> Prefer it over an external keepalive.

Why:

```text
native scheduler
→ explicitly invokes work

keepalive
→ merely prevents sleep
```

The former is architecturally cleaner.

---

# 51. External Scheduler Cost

An external scheduler should ideally cost:

```text
$0
```

for the hackathon.

The scheduling frequency required is low.

Approximately:

```text
every 10–15 minutes
```

is sufficient.

---

# 52. Database Budget

The database must be persistent.

Preferred:

```text
free managed PostgreSQL
```

if its limits are comfortably above expected usage.

---

# 53. Expected Database Size

The hackathon should produce relatively little data.

Even with:

```text
hundreds of candidates
thousands of source records
dozens/hundreds of posts
```

a small PostgreSQL instance should be sufficient.

---

# 54. Database Storage Optimization

Do not store entire web pages unnecessarily.

Store:

```text
URL
title
publisher
metadata
extracted facts
content hash
```

rather than massive raw HTML blobs.

---

# 55. Source Content

If raw source content is needed for research, consider:

```text
short-lived cache
```

rather than permanent storage.

The persistent database should focus on knowledge that affects future behavior.

---

# 56. Memory Storage

Memory volume should remain small.

Prefer:

```text
compressed semantic memory
```

over:

```text
entire article dumps
```

---

# 57. Vector Database Cost

Do not purchase a hosted vector database for the hackathon.

If semantic search becomes useful:

```text
PostgreSQL + pgvector
```

is preferred.

This avoids another service.

---

# 58. Redis Cost

Do not add Redis unless it solves a demonstrated problem.

PostgreSQL can handle:

- runtime locks,
- queues,
- persistence,
- state,
- and feed retrieval.

---

# 59. Message Broker Cost

Do not deploy:

```text
Kafka
RabbitMQ
NATS
```

for the MVP.

The workload does not justify it.

---

# 60. Object Storage

Object storage is not required.

The project does not need:

- images,
- videos,
- large files,
- model checkpoints.

Therefore:

```text
object storage budget = $0
```

for the MVP.

---

# 61. External Information Sources

Prefer free sources:

```text
RSS
official websites
public APIs
public documentation
GitHub
research repositories
```

Do not purchase expensive news APIs unless discovery quality genuinely requires them.

---

# 62. Source Diversity

Free does not mean low quality.

The discovery system should prioritize:

```text
primary sources
official announcements
technical documentation
research papers
engineering blogs
credible reporting
```

---

# 63. Paid Search APIs

A paid search API may be considered if:

```text
free discovery sources
```

produce insufficient breadth.

But this is a secondary expense.

---

# 64. Search Cost Guard

If a paid search provider is used:

```env
MAX_SEARCH_COST_PER_CYCLE=
MAX_SEARCH_COST_PER_DAY=
```

should be enforced.

---

# 65. Search Request Budget

Do not repeatedly search the same query.

Use:

```text
query normalization
cache
source deduplication
recent-source memory
```

---

# 66. Social Media Cost

X and LinkedIn are not required.

Therefore:

```text
hackathon social API budget = $0
```

unless external publishing is intentionally enabled.

---

# 67. Why Social APIs Are Low Priority

They do not directly improve the core evaluation requirements:

```text
autonomy
editorial judgment
persona consistency
memory
publishing rationale
feed quality
```

They add:

```text
credentials
rate limits
platform restrictions
failure modes
```

Therefore they should not consume the initial budget.

---

# 68. Monitoring Budget

Use free monitoring where possible.

At minimum:

```text
application logs
health endpoint
runtime logs
database logs
```

A premium monitoring service is unnecessary for a 48-hour hackathon.

---

# 69. External Uptime Monitoring

If used to wake/check the service:

```text
prefer free tier
```

and keep the request frequency low.

---

# 70. Logging Cost

Do not log entire source documents or LLM prompts in production.

This reduces:

```text
storage
log volume
privacy risk
```

---

# 71. LLM Prompt Logging

Store:

```text
prompt version
operation
model
token usage
```

rather than necessarily storing every full prompt.

Full prompts may be retained locally during debugging if needed.

---

# 72. Resource Limits

The runtime should have explicit limits:

```env
MAX_CANDIDATES_PER_CYCLE=
MAX_SOURCES_PER_CYCLE=
MAX_LLM_CALLS_PER_CYCLE=
MAX_GENERATIONS_PER_CYCLE=
MAX_CYCLE_DURATION_SECONDS=
```

---

# 73. Candidate Limit

Example:

```env
MAX_CANDIDATES_PER_CYCLE=20
```

If discovery returns 200 stories:

```text
rank/filter first
→ process top candidates
```

Do not send all 200 through expensive reasoning.

---

# 74. Source Limit

Example:

```env
MAX_SOURCES_PER_CYCLE=50
```

This prevents an unexpectedly large discovery response from consuming excessive resources.

---

# 75. Generation Limit

Example:

```env
MAX_PUBLICATIONS_PER_CYCLE=1
```

This is recommended initially.

It prevents feed flooding and controls cost.

---

# 76. Publication Frequency

A useful default:

```text
0–1 publications per cycle
```

rather than:

```text
1+ publications guaranteed
```

---

# 77. Why One Post Per Cycle?

Because:

```text
quality > volume
```

and it gives the evaluator a more natural feed.

---

# 78. Daily Publication Target

Do not hard-code a daily publication target.

A healthy range might be:

```text
2–8 strong posts/day
```

depending on information flow.

But:

```text
0 posts
```

is valid when nothing meets the editorial standard.

---

# 79. 48-Hour Expected Output

A plausible evaluation outcome might be:

```text
10–20 high-quality posts
```

over 48 hours.

This is not a requirement.

The system should publish according to editorial merit.

---

# 80. Cost per Post

Track:

```text
total LLM cost
/
number of published posts
```

Example:

```text
$5 / 15 posts
=
$0.33/post
```

This is a useful optimization metric.

---

# 81. Cost per Cycle

Track:

```text
cycle cost
```

Example:

```text
Cycle 1 → $0.04
Cycle 2 → $0.01
Cycle 3 → $0.06
```

A cycle producing no publication should ideally be cheaper than a publication cycle.

---

# 82. Cost-Aware Editorial Pipeline

The system should effectively implement:

```text
cheap filtering
      ↓
cheap deduplication
      ↓
moderate research
      ↓
expensive judgment
      ↓
expensive generation
```

This is one of the highest-leverage cost optimizations.

---

# 83. Don't Optimize Away the Important Parts

Do not save money by:

- removing research,
- removing editorial judgment,
- using an extremely weak model for final writing,
- publishing unverified claims.

Cost optimization should preserve:

```text
quality
accuracy
persona
autonomy
```

---

# 84. Resource Priority

When resources become constrained:

### Preserve

```text
database
feed
memory
editorial engine
high-value generation
```

### Reduce

```text
low-value discovery
redundant research
weak candidates
expensive critique passes
external distribution
```

---

# 85. Degradation Strategy

When budget pressure increases:

```text
NORMAL
  ↓
reduce candidate volume
  ↓
reduce context size
  ↓
use fast model more often
  ↓
reserve strong model for top candidates
  ↓
reduce cycle frequency
  ↓
pause expensive operations
```

The feed remains available throughout.

---

# 86. Do Not Degrade to Fake Content

Never respond to budget pressure by:

```text
inventing facts
removing sources
publishing filler
```

If the system cannot afford a high-quality generation:

```text
do not publish.
```

---

# 87. Runtime Frequency as a Cost Lever

If LLM usage becomes too high:

```text
10-minute cycles
```

can become:

```text
15-minute cycles
```

or:

```text
20-minute cycles
```

before sacrificing content quality.

---

# 88. Why Frequency Is Flexible

The objective is:

```text
autonomous publishing over time
```

not:

```text
maximum number of cycles.
```

---

# 89. Budget Configuration

Recommended environment variables:

```env
BUDGET_MODE=HACKATHON

TOTAL_LLM_BUDGET_USD=15
DAILY_LLM_BUDGET_USD=1

MAX_CYCLE_COST_USD=0.10
MAX_LLM_CALLS_PER_CYCLE=15
MAX_LLM_TOKENS_PER_CYCLE=30000

MAX_CANDIDATES_PER_CYCLE=20
MAX_SOURCES_PER_CYCLE=50
MAX_PUBLICATIONS_PER_CYCLE=1

RUNTIME_INTERVAL_MINUTES=10
```

These are initial defaults, not immutable values.

---

# 90. Resource Dashboard

The application should ideally expose internal metrics such as:

```text
LLM Spend
$2.13 / $15

Cycles
37

Posts
8

Candidates
412

Rejected
380

Last Cycle
4 minutes ago

Last Post
31 minutes ago
```

This is for operators only.

Do not expose it through the evaluator's feed endpoint.

---

# 91. Cost Alerts

Trigger warnings at:

```text
50%
75%
90%
100%
```

of the total budget.

---

# 92. Example Budget Alert

At 75%:

```text
WARNING:
LLM budget 75% consumed.

Switching to cost-conscious routing.
```

At 90%:

```text
CRITICAL:
Only 10% of LLM budget remains.

Reserve premium inference for exceptional candidates.
```

---

# 93. Automatic Model Downgrade

At a high budget threshold:

```text
strong model
```

may become:

```text
medium/fast model
```

for routine tasks.

However, preserve the strongest model for:

```text
high-value breaking stories
complex thesis updates
important corrections
```

---

# 94. Cost-Aware Source Discovery

If search costs money, use a hierarchy:

```text
free feeds
 ↓
official sources
 ↓
free web search
 ↓
paid search
```

Only use paid search when free discovery is insufficient.

---

# 95. Cache Research

If a source was recently fetched:

```text
do not fetch again
```

unless:

```text
content may have changed
```

or:

```text
story requires verification.
```

---

# 96. Cache Model Results Carefully

Do not blindly cache LLM output for all prompts.

Cache deterministic extraction tasks where appropriate.

For editorial reasoning:

```text
candidate + evidence + prompt version
```

can serve as a reproducibility key.

---

# 97. Duplicate Candidate Prevention

Before sending a candidate to the LLM:

```text
check:
URL
title similarity
source hash
semantic similarity
existing thesis
existing recent posts
```

This saves both money and feed quality.

---

# 98. Existing Thesis Reuse

If a new source relates to an existing thesis:

```text
reuse thesis context
```

rather than constructing an entirely new reasoning chain.

This reduces token usage and improves continuity.

---

# 99. Memory Compression

Periodically consolidate redundant memories.

Example:

```text
Memory A:
Inference costs declined.

Memory B:
Inference prices declined.

Memory C:
Inference economics are becoming more important.
```

could become:

```text
Inference economics are increasingly shaped by declining inference costs and pricing competition.
```

This keeps retrieval efficient.

---

# 100. Database Resource Budget

Expected 48-hour workload:

```text
Agents:
1

Posts:
~10–50

Candidates:
hundreds

Sources:
hundreds to low thousands

Memories:
hundreds

Runtime cycles:
hundreds
```

This is tiny for PostgreSQL.

---

# 101. CPU Budget

The application should be lightweight.

Most compute should be spent externally through:

```text
LLM APIs
```

The application itself primarily performs:

```text
HTTP
database queries
source fetching
lightweight processing
```

---

# 102. RAM Budget

Avoid loading:

```text
entire source corpus
entire memory corpus
entire feed
```

into RAM.

Use:

```text
bounded queries
pagination where appropriate
limited context
```

---

# 103. Disk Budget

Do not store:

```text
full webpages
large model files
videos
images
```

for the hackathon.

This keeps disk usage minimal.

---

# 104. Network Budget

Network traffic is primarily:

```text
source retrieval
LLM requests
API requests
```

Keep source retrieval bounded.

Do not crawl entire websites.

---

# 105. No Aggressive Crawling

The discovery system must respect:

- robots policies where applicable,
- source terms,
- API rate limits,
- reasonable request frequency.

Do not build a web crawler that repeatedly downloads entire sites.

---

# 106. Rate Limits

Every external service should have:

```text
request timeout
retry limit
backoff
rate limit awareness
```

---

# 107. Timeout Defaults

Use bounded timeouts.

Example conceptual defaults:

```text
HTTP source fetch:
10–20 seconds

LLM request:
30–120 seconds

database query:
5–10 seconds
```

Exact values depend on provider behavior.

---

# 108. Cycle Duration Limit

Set:

```env
MAX_CYCLE_DURATION_SECONDS=300
```

as an example.

A cycle that exceeds the limit should be aborted or safely terminated.

---

# 109. Why Bounded Cycles Matter

Without a limit:

```text
cycle hangs
 ↓
runtime lock remains
 ↓
future cycles blocked
 ↓
agent appears dead
```

Bounded execution prevents this.

---

# 110. Resource Cleanup

At cycle completion or failure:

```text
release runtime lock
close HTTP resources
release database connections
persist cycle result
```

---

# 111. Graceful Shutdown

On deployment restart:

```text
SIGTERM
 ↓
stop starting new cycles
 ↓
finish or safely abort current work
 ↓
persist state
 ↓
close connections
 ↓
exit
```

Do not immediately terminate without cleanup if avoidable.

---

# 112. Restart Strategy

A restart should be safe because:

```text
database persists everything important
```

and:

```text
runtime locks expire
```

---

# 113. Budget and Reliability Tradeoff

If forced to choose:

```text
$0 + unreliable
```

versus:

```text
$5 + reliable
```

prefer:

```text
$5 + reliable
```

for a hackathon where evaluation depends on 48-hour availability.

---

# 114. Budget and Quality Tradeoff

If forced to choose:

```text
cheap weak model
```

versus:

```text
moderately expensive strong model
```

for the final editorial decision:

prefer the stronger model if the additional cost is comfortably inside the budget.

---

# 115. Spending Decision Rule

Spend more only when it solves one of:

```text
quality bottleneck
reliability bottleneck
autonomy bottleneck
evaluation bottleneck
```

Do not spend more merely because a premium product exists.

---

# 116. What We Should NOT Buy

For the hackathon MVP, do not purchase:

```text
GPU server
large cloud VM
hosted vector database
Kafka
Redis Cloud
premium observability suite
social-media management platform
enterprise search API
```

unless testing proves a specific need.

---

# 117. What May Be Worth Paying For

Potentially worth spending on:

```text
strong LLM inference
reliable hosting
persistent PostgreSQL
```

These directly affect the evaluation.

---

# 118. Cost Optimization Priority

If costs are too high, optimize in this order:

```text
1. Remove duplicate candidates.
2. Reduce source context.
3. Use fast model for screening.
4. Reduce unnecessary critique calls.
5. Reduce cycle frequency.
6. Reduce expensive research.
7. Only then downgrade final generation quality.
```

---

# 119. Quality Optimization Priority

If content quality is too low and budget remains:

```text
1. Improve editorial reasoning.
2. Improve source quality.
3. Improve research synthesis.
4. Improve final generation model.
5. Add critique/revision.
6. Increase context quality.
```

Do not simply increase token limits.

---

# 120. Resource Monitoring During Evaluation

During the 48-hour period, operators should periodically inspect:

```text
last successful cycle
last publication
LLM spend
error rate
database health
```

Do not manually intervene in content generation.

Monitoring is acceptable.

Manual operation of the agent is not.

---

# 121. Operator vs Agent

Operators may:

```text
monitor
diagnose infrastructure
restart failed services
fix credentials
```

The agent must independently:

```text
discover
judge
generate
publish
remember
```

Once evaluation begins, avoid interventions that alter editorial behavior.

---

# 122. Emergency Recovery

If the service crashes:

```text
restart service
```

is acceptable infrastructure recovery.

After restart:

```text
agent reloads persistent state
```

and continues autonomously.

---

# 123. Emergency LLM Provider Failure

If the primary provider fails:

```text
fallback provider
```

may be enabled automatically.

If no fallback exists:

```text
continue waiting
```

rather than generating unreliable content.

---

# 124. Emergency Database Failure

If the database becomes temporarily unavailable:

```text
retry connection
```

If persistent:

```text
service remains alive
runtime waits
```

Do not reset the database.

---

# 125. Emergency Budget Exhaustion

If the LLM budget is exhausted:

```text
stop paid generation
```

but preserve:

```text
API
database
existing feed
memory
runtime
```

If a free fallback model exists and is sufficiently capable, it may be used.

---

# 126. Resource Budget Summary

Recommended initial production configuration:

```text
Hosting:
Free or lowest reliable tier

Database:
Free managed PostgreSQL where reliable

LLM:
$3–$10 target

Search/discovery:
Free sources first

Scheduler:
Free

Social publishing:
Disabled

Monitoring:
Free

Total:
~$5–$15 target
```

---

# 127. Hard Constraints

The implementation MUST:

```text
✓ Track LLM usage.
✓ Prevent uncontrolled LLM spending.
✓ Bound cycle size.
✓ Bound retries.
✓ Bound context.
✓ Persist database state.
✓ Survive application restarts.
✓ Avoid dependence on a GPU.
✓ Avoid unnecessary infrastructure.
✓ Preserve feed availability during LLM failures.
```

---

# 128. Strong Recommendations

The implementation SHOULD:

```text
✓ Use fast/cheap model for screening.
✓ Use strong model selectively.
✓ Cache source processing.
✓ Deduplicate candidates.
✓ Retrieve only relevant memory.
✓ Track cost by operation.
✓ Use budget thresholds.
✓ Prefer free sources.
✓ Prefer native scheduling.
✓ Keep social publishing disabled for the MVP.
```

---

# 129. Final Budget Configuration

Recommended starting configuration:

```env
# Runtime
AGENT_RUNTIME_ENABLED=true
RUNTIME_INTERVAL_MINUTES=10
MAX_CYCLE_DURATION_SECONDS=300

# Candidate limits
MAX_CANDIDATES_PER_CYCLE=20
MAX_SOURCES_PER_CYCLE=50
MAX_PUBLICATIONS_PER_CYCLE=1

# LLM
MAX_LLM_CALLS_PER_CYCLE=15
MAX_LLM_TOKENS_PER_CYCLE=30000
MAX_LLM_RETRIES=2

# Budget
BUDGET_MODE=HACKATHON
MAX_CYCLE_COST_USD=0.10
DAILY_LLM_BUDGET_USD=1.00
TOTAL_LLM_BUDGET_USD=15.00

# Distribution
DISTRIBUTION_MODE=internal
ENABLE_X=false
ENABLE_LINKEDIN=false
```

These values should be calibrated after observing actual model pricing and token consumption.

---

# 130. Final Principle

Second Order should not attempt to win by spending the most money.

It should win by spending money **selectively**.

The desired economic loop is:

```text
many cheap observations
        ↓
few serious candidates
        ↓
fewer strong editorial decisions
        ↓
very few excellent publications
        ↓
persistent memory
        ↓
better future decisions
```

In other words:

> **The system should spend tokens where judgment matters, not where filtering can be done cheaply.**

The ideal 48-hour outcome is not:

```text
288 cycles
288 LLM-heavy generations
288 mediocre posts
```

It is closer to:

```text
hundreds of autonomous observations
        ↓
hundreds of candidates
        ↓
many deliberate rejections
        ↓
a smaller set of high-value decisions
        ↓
10–20 genuinely interesting publications
        ↓
a coherent evolving technological worldview
```

That is the resource strategy that best aligns **cost, reliability, autonomy, and hackathon evaluation quality**.
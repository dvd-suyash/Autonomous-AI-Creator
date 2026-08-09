# 10_DISTRIBUTION_ARCHITECTURE.md

# Second Order — Distribution Architecture

## 1. Purpose

This document defines how Second Order distributes content after it has been approved for publication.

The primary objective is to ensure that the autonomous agent can:

- publish content continuously,
- preserve previously published content,
- expose new posts through the required API,
- remain operational during the 48-hour evaluation,
- and remain independent of any particular social-media platform.

The central architectural decision is:

> **The internal feed is the canonical publishing destination. External social platforms are optional distribution adapters.**

---

# 2. Core Principle

The hackathon requires an autonomous publishing system.

It does **not** require:

- X integration,
- LinkedIn integration,
- real social accounts,
- follower management,
- engagement analytics,
- or multi-platform publishing.

Therefore, Second Order should not make external social media a dependency for its core operation.

The system should work completely with:

```text
Autonomous Agent
      ↓
Publication Pipeline
      ↓
Persistent Feed
      ↓
GET /api/agent/feed
```

External platforms, if added, sit beside this pipeline:

```text
                    ┌→ X
                    │
Agent → Publisher ──┼→ LinkedIn
                    │
                    └→ Internal Feed
```

The internal feed remains authoritative.

---

# 3. Distribution Objectives

The distribution layer should optimize for:

1. Reliability
2. Persistence
3. Low operational complexity
4. Autonomous execution
5. Fast feed retrieval
6. Idempotent publishing
7. Platform independence
8. Easy debugging
9. Hackathon compliance

Social-media reach is secondary.

---

# 4. Canonical Publication Flow

The complete flow is:

```text
DISCOVERY
    ↓
EDITORIAL DECISION
    ↓
CONTENT GENERATION
    ↓
CRITIQUE
    ↓
VALIDATION
    ↓
PUBLICATION SERVICE
    ↓
DATABASE
    ↓
INTERNAL FEED
    ↓
OPTIONAL EXTERNAL ADAPTERS
```

The publication service is the boundary between content creation and distribution.

---

# 5. Publication Service

Create a dedicated application component:

```text
PublicationService
```

Its responsibility is to turn a validated content object into a durable publication.

Conceptually:

```typescript
publish(post: CanonicalPost): Promise<PublishedPost>
```

The service should:

1. validate the post,
2. generate/verify the post ID,
3. persist it,
4. update publication metadata,
5. update memory,
6. optionally enqueue external distribution.

---

# 6. Canonical Post

The internal canonical post should contain more information than the public API requires.

Example:

```json
{
  "id": "p7",
  "createdAt": "2026-08-08T10:30:00Z",
  "text": "...",
  "rationale": "...",
  "sources": [
    "https://example.com/source"
  ],
  "candidateId": "candidate_123",
  "thesisId": "thesis_004",
  "format": "THESIS_POST",
  "editorialScore": 88,
  "confidence": 0.87,
  "model": "provider/model",
  "promptVersion": "WRITER_V4"
}
```

Only required fields should be returned publicly.

---

# 7. Public Feed Contract

The evaluator interacts with:

```text
GET /api/agent/feed?agentId=abc-123
```

The response must be:

```json
{
  "posts": [
    {
      "id": "p7",
      "createdAt": "2026-08-08T10:30:00Z",
      "text": "...",
      "rationale": "...",
      "sources": [
        "https://example.com/source"
      ]
    }
  ]
}
```

---

# 8. Feed Is the Source of Truth

The evaluator should never need to query:

- X,
- LinkedIn,
- the LLM provider,
- the scheduler,
- or the database directly.

The feed endpoint is the authoritative public representation of the agent's publishing history.

---

# 9. Feed Persistence

Previously returned posts must remain available.

Therefore:

```text
POST published
      ↓
DATABASE
      ↓
GET feed
```

must never depend on in-memory process state.

Do not store the feed only in:

```text
let posts = []
```

because the deployment may restart or sleep.

---

# 10. Database Requirement

Use persistent storage.

A relational database such as PostgreSQL is recommended.

Suggested logical entities:

```text
agents
posts
candidates
sources
theses
memory
publication_events
distribution_events
```

The exact schema may vary.

---

# 11. Feed Ordering

The API must return posts in:

```text
newest → oldest
```

using:

```text
createdAt DESC
```

Do not rely on insertion order.

---

# 12. Unique Post IDs

Every published post must have a unique ID.

Recommended options include:

- UUID,
- UUIDv7,
- ULID,
- or a database-generated identifier.

The ID must remain stable across repeated feed requests.

---

# 13. Timestamp Requirements

All public timestamps must be:

```text
ISO 8601
UTC
```

Example:

```text
2026-08-08T10:30:00Z
```

Do not expose local server time.

---

# 14. Publication Atomicity

Publishing should be transactional where possible.

Conceptually:

```text
BEGIN TRANSACTION

insert post
insert publication event
update candidate state
update relevant memory

COMMIT
```

If a critical operation fails:

```text
ROLLBACK
```

This prevents partially published state.

---

# 15. Idempotent Publishing

A publication operation should be safe to retry.

If the same content is submitted twice because of a timeout:

```text
attempt 1 → published
attempt 2 → recognized as duplicate
```

It should not create two identical posts.

---

# 16. Idempotency Key

Use an internal publication key such as:

```text
candidateId + generationVersion
```

or a dedicated:

```text
publicationId
```

This allows retries without duplicate feed entries.

---

# 17. Publication States

A post may progress through:

```text
DRAFT
VALIDATED
QUEUED
PUBLISHING
PUBLISHED
FAILED
```

For the MVP, fewer states are acceptable.

Recommended minimum:

```text
VALIDATED
PUBLISHED
FAILED
```

---

# 18. Internal vs External Publication

The internal feed publication is mandatory.

External publishing is optional.

Therefore:

```text
Internal publication
        ↓
success
        ↓
feed available
```

must not depend on:

```text
X API
LinkedIn API
```

---

# 19. External Distribution Adapters

If external platforms are implemented, use adapters.

Conceptually:

```typescript
interface DistributionAdapter {
    publish(post: CanonicalPost): Promise<DistributionResult>;
}
```

Implementations might include:

```text
InternalFeedAdapter
XAdapter
LinkedInAdapter
```

---

# 20. Internal Feed Adapter

The internal feed is effectively the first and most important adapter.

```text
CanonicalPost
      ↓
InternalFeedAdapter
      ↓
Database
```

This adapter is always enabled.

---

# 21. X Adapter

If X integration is eventually added:

```text
CanonicalPost
      ↓
XAdapter
      ↓
X API
```

The adapter should:

- authenticate separately,
- publish platform-compatible text,
- record the external post ID,
- handle API failures,
- and never affect internal feed availability.

---

# 22. LinkedIn Adapter

Similarly:

```text
CanonicalPost
      ↓
LinkedInAdapter
      ↓
LinkedIn API
```

It should have its own:

- credentials,
- formatting rules,
- retry logic,
- rate limits,
- and publication records.

---

# 23. External Distribution Must Be Asynchronous

Do not block the core publication path waiting for social platforms.

Bad:

```text
Generate
 ↓
publish to X
 ↓
wait
 ↓
publish LinkedIn
 ↓
wait
 ↓
save internal post
```

Better:

```text
Generate
 ↓
validate
 ↓
publish internal feed
 ↓
queue external distribution
 ↓
X / LinkedIn workers
```

---

# 24. Why Internal Feed Comes First

The hackathon evaluator only needs:

```text
GET /api/agent/feed
```

Therefore, the feed should become available immediately after internal publication.

If X fails:

```text
feed still works
```

If LinkedIn fails:

```text
feed still works
```

If both fail:

```text
feed still works
```

---

# 25. Distribution Queue

Optional external distribution can use a persistent queue.

Conceptually:

```text
publication_events
       ↓
distribution queue
       ↓
adapter worker
       ↓
external platform
```

For the hackathon MVP, a database-backed queue may be sufficient.

A separate message broker is not required.

---

# 26. Avoid Unnecessary Infrastructure

Do not introduce:

- Kafka,
- RabbitMQ,
- Redis Streams,
- Kubernetes,
- complex event buses,

unless the actual implementation requires them.

The project is being evaluated over roughly 48 hours.

Simplicity improves reliability.

---

# 27. Lightweight Distribution Architecture

Recommended MVP:

```text
                    ┌──────────────┐
                    │  Scheduler   │
                    └──────┬───────┘
                           ↓
                    Autonomous Cycle
                           ↓
                    PublicationService
                           ↓
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────┬───────┘
                           ↓
                    GET /feed
```

Optional:

```text
                           ↓
                    Distribution Queue
                       ↙          ↘
                     X          LinkedIn
```

---

# 28. Feed Retrieval Must Be Cheap

The evaluator may call:

```text
GET /api/agent/feed
```

many times.

This endpoint should not invoke:

- the LLM,
- discovery,
- research,
- content generation,
- or external APIs.

It should simply read persisted posts.

---

# 29. Feed Endpoint Behavior

The feed endpoint should:

1. validate `agentId`,
2. query published posts,
3. sort newest first,
4. serialize the required fields,
5. return JSON.

No autonomous work should happen inside the GET request.

---

# 30. Feed Endpoint Must Be Deterministic

If no new post has been generated:

```text
GET feed
```

should return the same persisted posts.

It should not:

```text
generate a new post
```

just because the evaluator asked for the feed.

---

# 31. Autonomous Generation Must Be Independent

The key hackathon requirement is:

> New posts must appear without additional evaluator prompts.

Therefore:

```text
scheduler
     ↓
autonomous cycle
     ↓
publication
```

must operate independently of:

```text
GET /feed
```

---

# 32. Do Not Use GET as a Trigger

Never implement:

```text
GET /feed
    ↓
if no new posts:
    generate one
```

This violates the spirit of autonomous publishing and creates unpredictable evaluator behavior.

The feed endpoint is read-only.

---

# 33. Initialization

The evaluator calls:

```text
POST /api/agent/init
```

exactly once.

The endpoint should:

1. validate persona configuration,
2. create the agent record,
3. initialize state,
4. initialize memory,
5. initialize scheduler metadata,
6. return the `agentId`.

---

# 34. Initialization Must Be Lightweight

Do not generate a post during initialization simply because initialization happened.

Initialization should establish the agent.

The autonomous runtime then begins its own cycles.

---

# 35. Initialization State

Example:

```json
{
  "agentId": "abc-123",
  "status": "ACTIVE"
}
```

Internally:

```text
agent
 ↓
ACTIVE
 ↓
scheduler begins
```

---

# 36. First Autonomous Cycle

After initialization, the agent should:

```text
load state
 ↓
discover current information
 ↓
evaluate candidates
 ↓
publish if worthwhile
```

The first cycle should not necessarily produce a post.

If the information quality is poor:

```text
no publication
```

is valid.

---

# 37. Publication Cadence

There should be no requirement such as:

```text
every 10 minutes = one post
```

Instead:

```text
every cycle = evaluate whether publication is warranted
```

This preserves editorial judgment.

---

# 38. Scheduler vs Distribution

The scheduler answers:

> **When should the agent think?**

The distribution layer answers:

> **How should approved content become available?**

Keep these responsibilities separate.

---

# 39. Wake-Up Model

Because the project may be deployed on infrastructure that sleeps, the architecture should support:

```text
process starts
     ↓
load persistent state
     ↓
check whether work is due
     ↓
run autonomous cycle
     ↓
persist results
```

The agent does not depend on a process remaining alive indefinitely.

---

# 40. External Ping Service

A periodic external request may be used to keep a deployment awake if the hosting provider permits it.

However:

> **The external pinger is infrastructure support, not the autonomous brain.**

The agent should remain correct even if the pinger misses an interval.

---

# 41. Recommended Wake Strategy

For the hackathon:

```text
External scheduler / uptime mechanism
          ↓
HTTP wake request
          ↓
Application
          ↓
Autonomous cycle
          ↓
Persist state
```

If the deployment platform offers a native scheduled job or cron facility, prefer that over building a custom ping service.

---

# 42. Wake Request

A wake endpoint may be internal/private.

Example conceptual endpoint:

```text
POST /internal/runtime/wake
```

It should:

- authenticate the request,
- check whether work is due,
- run a bounded cycle,
- return status.

It should not expose autonomous controls publicly without protection.

---

# 43. Preventing Duplicate Wake Cycles

Two wake requests could arrive simultaneously.

The system must prevent:

```text
Cycle A
Cycle B
```

from both processing the same candidate.

Use a lock.

Possible mechanisms:

- database advisory lock,
- row-level lock,
- lease,
- or an atomic database flag.

---

# 44. Runtime Lease

A simple pattern:

```text
agent_runtime
-----------------------
agent_id
locked_until
last_cycle_at
```

Before starting:

```text
if locked_until > now:
    skip
```

Otherwise:

```text
acquire lease
run cycle
release lease
```

---

# 45. Crash Recovery

If the process crashes while holding a lease:

```text
locked_until expires
```

Another cycle can eventually resume.

Do not use permanent locks.

---

# 46. Distribution Failure

External publication can fail independently.

Example:

```text
Internal feed:
SUCCESS

X:
FAILED

LinkedIn:
SUCCESS
```

The internal post remains published.

The system records:

```text
X → RETRY
```

---

# 47. External Distribution Event

Maintain a record such as:

```json
{
  "postId": "p7",
  "platform": "x",
  "status": "FAILED",
  "attempts": 2,
  "externalId": null,
  "lastError": "Rate limited"
}
```

This makes external publishing observable.

---

# 48. Platform Independence

The canonical content should never contain:

```text
"this is an X post"
```

or:

```text
"this is a LinkedIn post"
```

unless the format specifically requires platform adaptation.

The core content remains platform-neutral.

---

# 49. Platform Formatting

Adapters may transform:

```text
canonical content
```

into:

```text
platform content
```

Examples:

### X

Potentially:

- shorter formatting,
- thread segmentation,
- concise paragraphs.

### LinkedIn

Potentially:

- slightly longer structure,
- professional formatting,
- paragraph spacing.

The underlying thesis remains unchanged.

---

# 50. Canonical Content Must Remain Immutable

Once a post is published internally, its canonical content should generally be immutable.

Platform adapters may create transformed versions.

Example:

```text
Canonical Post P7
      │
      ├── X Version P7-X
      └── LinkedIn Version P7-L
```

Do not mutate the canonical post simply to satisfy one platform.

---

# 51. Distribution Metadata

Track:

```text
postId
platform
status
externalId
publishedAt
attemptCount
lastAttemptAt
error
```

---

# 52. Retry Policy

For external platforms:

```text
temporary error
→ retry

rate limit
→ backoff

authentication failure
→ stop and alert/log

invalid content
→ mark failed

permanent rejection
→ mark failed
```

Do not retry permanent errors indefinitely.

---

# 53. External API Credentials

Credentials must never be:

- committed to Git,
- placed in source code,
- included in prompts,
- exposed in API responses,
- or written to public logs.

Use environment variables or the deployment platform's secret store.

---

# 54. Social Platforms Are Optional

The project should remain fully functional if:

```text
X credentials = absent
LinkedIn credentials = absent
```

In that case:

```text
internal feed = operational
```

---

# 55. Hackathon Mode

The system should support:

```text
DISTRIBUTION_MODE=internal
```

as the default hackathon configuration.

Optional:

```text
DISTRIBUTION_MODE=internal+x
DISTRIBUTION_MODE=internal+linkedin
DISTRIBUTION_MODE=all
```

---

# 56. Recommended Hackathon Mode

Use:

```text
INTERNAL_FEED_ONLY
```

unless external publishing has a specific strategic benefit.

The evaluator does not require external accounts.

Adding external integrations introduces:

- authentication risk,
- rate limits,
- API changes,
- deployment complexity,
- and potential failure modes.

---

# 57. External Publishing Should Never Affect Evaluation

Even if X or LinkedIn is configured:

```text
X failure
```

must not cause:

```text
agent failure
```

The internal feed must remain operational.

---

# 58. Distribution Observability

The system should track:

```text
posts published
posts failed
external publications
retry counts
last publication
last distribution attempt
```

This helps diagnose issues during the 48-hour evaluation.

---

# 59. Feed Health

Useful internal health indicators:

```text
lastPostAt
postCount
lastCycleAt
lastSuccessfulCycleAt
lastDiscoveryAt
lastLLMSuccessAt
lastPublicationFailureAt
```

---

# 60. No Artificial Activity

Do not generate placeholder posts simply to make the feed appear alive.

Never publish:

> "Nothing interesting happened today."

The agent should publish only when editorial criteria are met.

---

# 61. Publication Frequency as a Signal

A feed with:

```text
20 mediocre posts
```

is worse than:

```text
5 strong posts
```

for this project.

The evaluator is expected to judge:

- quality,
- coherence,
- autonomy,
- memory,
- and editorial judgment.

---

# 62. Content Backlog

The distribution layer may receive multiple approved posts.

The system should decide whether to:

```text
publish immediately
queue
defer
```

based on:

- freshness,
- importance,
- cadence,
- and current feed density.

---

# 63. Avoid Feed Flooding

If several candidates are approved simultaneously:

```text
Post A
Post B
Post C
Post D
```

do not necessarily publish all four immediately.

Potential strategy:

```text
highest-value → publish
others → remain queued
```

This creates a natural editorial cadence.

---

# 64. Queue Prioritization

Queue priority may consider:

```text
editorial score
timeliness
freshness
confidence
story expiration
```

A breaking development may outrank an evergreen analysis.

---

# 65. Story Expiration

Some queued content becomes stale.

Each candidate may have:

```text
expiresAt
```

or a freshness policy.

If expired:

```text
discard / re-research
```

Do not publish stale content merely because it was previously approved.

---

# 66. Follow-Up Priority

If a new event materially updates an existing thesis, it may receive priority over unrelated candidates.

This supports narrative continuity.

---

# 67. Distribution and Memory

Successful internal publication should trigger memory updates.

Example:

```text
Post published
      ↓
episodic memory
      ↓
entity relationship
      ↓
thesis evidence
      ↓
future editorial context
```

This is how distribution contributes to autonomous continuity.

---

# 68. Distribution Event as Memory

The system should remember:

```text
what was published
when
about what
under which thesis
with which sources
```

This prevents future repetition.

---

# 69. Feed Retrieval and Memory

The feed endpoint should not itself perform memory retrieval.

Memory is updated at publication time.

Therefore:

```text
publish
 ↓
memory update
```

rather than:

```text
GET feed
 ↓
reconstruct memory
```

---

# 70. API Isolation

Public endpoints:

```text
POST /api/agent/init
GET /api/agent/feed
```

Internal runtime endpoints, if needed:

```text
POST /internal/runtime/wake
```

should be separately authenticated.

---

# 71. Agent Isolation

Each `agentId` should have its own:

- posts,
- candidates,
- memory,
- configuration,
- state,
- and distribution events.

Even if the hackathon only initializes one agent, do not hard-code the database around one global agent.

---

# 72. Multi-Agent Readiness

The architecture should permit:

```text
agent A
agent B
agent C
```

without major redesign.

However, the MVP only needs to operate one initialized persona.

---

# 73. Feed Query

Conceptually:

```sql
SELECT id, created_at, text, rationale, sources
FROM posts
WHERE agent_id = ?
  AND status = 'PUBLISHED'
ORDER BY created_at DESC;
```

The exact database implementation may differ.

---

# 74. Pagination

The hackathon feed contract does not require pagination.

For the expected number of posts over 48 hours, returning the complete feed is acceptable.

If pagination is added later, the required default response should remain compatible with the evaluator.

---

# 75. Feed Size

Because the evaluator may repeatedly fetch the feed, the response should remain reasonably small.

Do not include:

- raw research,
- model traces,
- internal memory,
- token counts,
- or full source content.

Only return the required public fields.

---

# 76. Internal vs Public Data

### Public

```text
id
createdAt
text
rationale
sources
```

### Internal

```text
candidateId
thesisId
scores
model
promptVersion
claims
memory references
distribution events
cost
```

---

# 77. Security Boundary

The feed endpoint should never expose:

- API keys,
- provider credentials,
- internal prompts,
- hidden chain-of-thought,
- private memory,
- database credentials,
- internal errors containing secrets.

---

# 78. Error Handling

If feed retrieval fails:

Return a proper HTTP error.

Do not expose raw database errors.

For example:

```json
{
  "error": "Unable to retrieve feed"
}
```

The exact error schema may be standardized during implementation.

---

# 79. Initialization Idempotency

The evaluator promises to call initialization once.

Nevertheless, the implementation should avoid accidentally creating multiple agents if initialization is retried due to a network timeout.

Possible approaches:

- idempotency key,
- deterministic initialization transaction,
- or a guard against duplicate active agents.

---

# 80. Agent Lifecycle

The basic lifecycle is:

```text
UNINITIALIZED
      ↓
INITIALIZED
      ↓
ACTIVE
      ↓
AUTONOMOUS
      ↓
EVALUATION
```

The agent should remain active for the evaluation window.

---

# 81. Evaluation Window

The expected evaluation period is approximately:

```text
48 hours
```

The system should not depend on:

```text
one long-running process
```

for that entire period.

Instead, persistence + scheduled execution should provide continuity.

---

# 82. Deployment Model

Recommended conceptual deployment:

```text
                  ┌─────────────────────┐
                  │      Render / Host   │
                  │                     │
                  │  API + Worker       │
                  │       │             │
                  │       ▼             │
                  │   PostgreSQL        │
                  └─────────┬───────────┘
                            │
                            ▼
                  External Scheduler
```

The exact hosting provider can change.

---

# 83. Wake Mechanism

The system may be kept active through:

### Option A — Native scheduler

Preferred when available.

### Option B — External scheduler

A service periodically triggers the application.

### Option C — Platform-native worker

Use a background worker if economically and technically practical.

The application should not rely on an external pinger for correctness.

---

# 84. Ten-Minute Wake Interval

A roughly 10-minute wake interval is acceptable for the hackathon if:

- the host permits it,
- the scheduler is reliable,
- and the application runs a bounded cycle.

However:

> **A 10-minute wake does not imply a 10-minute publication cadence.**

Most cycles should simply evaluate the current information landscape.

---

# 85. Better Than Artificial Keepalive

If the deployment platform provides a persistent worker or scheduled job within the project's budget, that is preferable to artificially keeping a web process awake.

But the architecture should support either.

---

# 86. Scheduler Responsibility

The scheduler should answer:

```text
Is the agent due to run?
```

Then:

```text
run bounded autonomous cycle
```

It should not contain editorial logic.

---

# 87. Distribution Responsibility

The distribution layer should answer:

```text
Has this approved content been published?
Where?
When?
With what external status?
```

It should not decide whether the content was worth writing.

---

# 88. Editorial Responsibility

The Editorial Engine answers:

```text
Should this exist?
```

Content Generation answers:

```text
What should it say?
```

Distribution answers:

```text
Where and how should it appear?
```

This separation is fundamental.

---

# 89. Full System Boundary

The architecture should therefore be:

```text
                 SECOND ORDER

        ┌─────────────────────────────┐
        │        DISCOVERY            │
        └──────────────┬──────────────┘
                       ↓
        ┌─────────────────────────────┐
        │      EDITORIAL ENGINE       │
        └──────────────┬──────────────┘
                       ↓
        ┌─────────────────────────────┐
        │     CONTENT GENERATION      │
        └──────────────┬──────────────┘
                       ↓
        ┌─────────────────────────────┐
        │      PUBLICATION SERVICE    │
        └──────────────┬──────────────┘
                       ↓
                 ┌───────────┐
                 │ DATABASE  │
                 └─────┬─────┘
                       ↓
                 INTERNAL FEED
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
            X                  LinkedIn
          optional             optional
```

---

# 90. What the Evaluator Sees

The evaluator should experience:

```text
Initialize
   ↓
receive agentId
   ↓
wait
   ↓
GET feed
   ↓
see post
   ↓
wait
   ↓
GET feed again
   ↓
see previous post
+
new post
   ↓
repeat
```

This is the core demonstration of autonomy.

---

# 91. What the Evaluator Should Not Need

The evaluator should not need to:

- send prompts,
- press "generate",
- trigger discovery,
- approve posts,
- log into X,
- log into LinkedIn,
- manually wake the system,
- or call a hidden endpoint.

After initialization:

> **The system owns the process.**

---

# 92. Demonstrating Autonomy

The strongest demonstration is temporal.

For example:

```text
T+0
Agent initialized.

T+20m
Post A appears.

T+70m
Post B appears.

T+4h
Post C appears.

T+10h
Post D updates an earlier thesis.

T+24h
Feed contains A–D.

T+48h
New information continues to produce selective posts.
```

The exact timing is not prescribed.

The important property is:

```text
new information
→ autonomous reasoning
→ new publication
```

---

# 93. Demonstrating Memory

The feed should ideally contain evidence of continuity.

For example:

### Post 1

> AI inference economics is becoming strategically important.

### Later development

New infrastructure pricing changes.

### Post 2

> A week ago we argued that inference economics was becoming a competitive variable. The latest pricing data is the first real evidence that the market is acting on it.

This demonstrates:

```text
memory
+
continuity
+
thesis evolution
```

---

# 94. Distribution Should Preserve Continuity

The feed should never appear as:

```text
random topic
random topic
random topic
random topic
```

It should feel like:

```text
technology world
      ↓
persona observes
      ↓
forms thesis
      ↓
new evidence
      ↓
updates thesis
```

---

# 95. No Social-Media Dependency

The project should be fully evaluable without:

```text
X
LinkedIn
```

This is deliberate.

Social integrations can be added later as distribution adapters.

---

# 96. Why This Is the Right Hackathon Strategy

External social integration creates additional failure modes:

```text
API credentials
rate limits
OAuth
permissions
platform restrictions
account verification
format limits
policy changes
```

None of these contribute directly to the required evaluation criteria.

The internal feed does.

---

# 97. Optional Post-Hackathon Architecture

After the hackathon:

```text
Internal Feed
      │
      ├── X
      ├── LinkedIn
      ├── Website
      ├── Newsletter
      ├── RSS
      └── Discord/Telegram/etc.
```

All should consume the canonical publication layer.

---

# 98. Distribution Configuration

Recommended environment configuration:

```env
DISTRIBUTION_MODE=internal

ENABLE_X=false
ENABLE_LINKEDIN=false
```

If integrations are later enabled:

```env
ENABLE_X=true
ENABLE_LINKEDIN=true
```

No code changes should be necessary for basic activation.

---

# 99. Final Distribution Contract

The distribution subsystem guarantees:

```text
1. Approved posts can become persistent publications.
2. Publications survive process restarts.
3. Feed retrieval is independent of generation.
4. Feed returns newest posts first.
5. Previously published posts remain available.
6. Publication is idempotent.
7. External platforms cannot break the internal feed.
8. Autonomous cycles do not depend on evaluator requests.
9. Distribution failures are isolated and recoverable.
10. The architecture remains platform-independent.
```

---

# 100. Final Principle

The project should not be thought of as:

> **"An AI that posts to social media."**

It should be thought of as:

> **"An autonomous editorial intelligence with a persistent publication feed."**

X and LinkedIn are merely possible outlets.

The important loop is:

```text
WORLD
  ↓
DISCOVERY
  ↓
JUDGMENT
  ↓
INSIGHT
  ↓
CONTENT
  ↓
PUBLICATION
  ↓
MEMORY
  ↓
WORLD
```

That loop is the actual product.

The evaluator does not need to see a social-media API to believe the agent is autonomous.

They need to see that, after initialization:

> **the system continues observing, deciding, writing, remembering, and publishing without being told what to do next.**
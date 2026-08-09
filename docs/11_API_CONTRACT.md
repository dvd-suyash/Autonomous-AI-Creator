# 11_API_CONTRACT.md

# Second Order — API Contract

## 1. Purpose

This document defines the HTTP API contract for **Second Order**.

The API is intentionally minimal.

The hackathon requires exactly two externally relevant capabilities:

```text
POST /api/agent/init
GET  /api/agent/feed?agentId=<agentId>
```

The evaluator will:

1. initialize the agent exactly once,
2. receive an `agentId`,
3. periodically request the feed,
4. observe whether new posts appear autonomously.

No further instructions will be provided after initialization.

Therefore:

> **The public API must be extremely reliable, deterministic, and independent of the internal implementation.**

---

# 2. API Design Principles

The API must be:

- simple,
- stateless at the HTTP layer,
- backed by persistent state,
- deterministic,
- idempotent where practical,
- JSON-based,
- easy to test,
- independent of the LLM provider,
- independent of X/LinkedIn,
- and stable throughout the 48-hour evaluation.

The evaluator should never need to know:

- which LLM is being used,
- how discovery works,
- how memory works,
- how scheduling works,
- or where content is hosted.

---

# 3. Public API Surface

The required public endpoints are:

```text
POST /api/agent/init

GET /api/agent/feed?agentId=<agentId>
```

These are the only endpoints the evaluator needs.

---

# 4. Endpoint 1 — Initialize Agent

## Method

```http
POST
```

## Path

```text
/api/agent/init
```

## Purpose

Creates and initializes the autonomous agent.

The evaluator calls this endpoint exactly once before evaluation begins.

---

# 5. Initialization Request

Content-Type:

```http
application/json
```

Request body:

```json
{
  "persona": {
    "name": "Ada",
    "domain": "AI Security"
  }
}
```

---

# 6. Initialization Request Schema

```typescript
interface InitRequest {
    persona: {
        name: string;
        domain: string;
    };
}
```

---

# 7. Required Fields

### `persona`

Required.

Must be an object.

### `persona.name`

Required.

Must be a non-empty string.

Example:

```text
Second Order
```

### `persona.domain`

Required.

Must be a non-empty string.

Example:

```text
AI and Technology
```

---

# 8. Persona Handling

The provided persona should initialize the agent identity.

The implementation must not silently ignore it.

The persona configuration should influence:

- editorial relevance,
- worldview,
- content generation,
- and feed identity.

For the intended project configuration, the persona should represent the Second Order identity defined in:

```text
01_PERSONA_WORLDVIEW.md
```

---

# 9. Initialization Response

On success:

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

Response:

```json
{
  "agentId": "abc-123"
}
```

---

# 10. Agent ID

The `agentId` must:

- uniquely identify the initialized agent,
- remain stable,
- be persisted,
- be accepted by subsequent feed requests.

Recommended:

```text
UUID
UUIDv7
ULID
```

Do not use an in-memory random value that disappears after restart.

---

# 11. Initialization Persistence

After successful initialization, the following should be persisted:

```text
agent
persona
domain
configuration
state
createdAt
lastCycleAt
runtime metadata
```

The system must be able to restart and reconstruct the agent.

---

# 12. Initialization Side Effects

Initialization may:

- create database records,
- initialize memory,
- initialize runtime state,
- start or schedule autonomous processing.

Initialization should not depend on the evaluator subsequently calling another endpoint.

---

# 13. Initialization Should Not Generate the Entire Feed

Do not generate a batch of posts during:

```text
POST /api/agent/init
```

For example, this is incorrect:

```text
init
 ↓
generate 20 posts
 ↓
return agentId
```

The evaluator must observe genuinely autonomous publication over time.

---

# 14. Initial Autonomous Cycle

After initialization, the runtime may begin its first autonomous cycle.

Conceptually:

```text
POST /init
    ↓
agent ACTIVE
    ↓
scheduler/runtime
    ↓
discovery
    ↓
editorial judgment
    ↓
content generation
    ↓
publication
```

The HTTP request itself does not need to remain open until the first post exists.

---

# 15. Initialization Response Timing

The endpoint should return quickly.

Do not block the initialization HTTP request on:

- web research,
- LLM generation,
- post generation,
- publishing,
- or long-running autonomous execution.

Recommended:

```text
initialize state
→ persist
→ trigger/schedule runtime
→ return agentId
```

---

# 16. Initialization Errors

Possible errors include:

```text
400 Bad Request
```

for malformed input.

Example:

```json
{
  "error": "Invalid persona configuration"
}
```

---

# 17. Missing Persona

Request:

```json
{}
```

should result in:

```http
400 Bad Request
```

The system should not silently invent an identity.

---

# 18. Invalid Persona Name

Request:

```json
{
  "persona": {
    "name": "",
    "domain": "AI"
  }
}
```

should be rejected.

---

# 19. Invalid Persona Domain

Request:

```json
{
  "persona": {
    "name": "Ada",
    "domain": ""
  }
}
```

should be rejected.

---

# 20. Duplicate Initialization

The evaluator promises to call initialization once.

Nevertheless, the application should guard against accidental duplicate creation.

If initialization is repeated because of a network retry, the system should avoid creating multiple active autonomous agents unintentionally.

Possible approaches:

- initialization idempotency key,
- one active agent per evaluation environment,
- database constraint,
- deterministic initialization record.

---

# 21. Recommended Initialization Guard

Conceptually:

```text
if active evaluation agent already exists:
    return existing agentId
```

Only use this if it does not conflict with the expected evaluator behavior.

---

# 22. Endpoint 2 — Retrieve Feed

## Method

```http
GET
```

## Path

```text
/api/agent/feed
```

## Query parameter

```text
agentId
```

Example:

```http
GET /api/agent/feed?agentId=abc-123
```

---

# 23. Feed Purpose

The feed endpoint returns all published posts for the requested agent.

It is a **read-only endpoint**.

It must not:

- generate posts,
- discover topics,
- call the LLM,
- trigger autonomous execution,
- mutate editorial state,
- or publish content.

---

# 24. Feed Request

Example:

```http
GET /api/agent/feed?agentId=abc-123
```

No request body is required.

---

# 25. Feed Success Response

Content-Type:

```http
application/json
```

Response:

```json
{
  "posts": [
    {
      "id": "p7",
      "createdAt": "2026-08-07T10:30:00Z",
      "text": "...",
      "rationale": "Why the topic was selected, why it is relevant now, and why it was chosen over other candidates.",
      "sources": [
        "https://example.com/source"
      ]
    }
  ]
}
```

---

# 26. Empty Feed

If no posts have been published:

```json
{
  "posts": []
}
```

This is a valid response.

Do not return:

```json
null
```

or:

```json
{
  "posts": null
}
```

---

# 27. Feed Ordering

Posts must be returned:

```text
newest first
```

Use:

```text
createdAt DESC
```

as the primary ordering rule.

Example:

```text
10:30
09:45
08:20
07:05
```

---

# 28. Stable Ordering

If two posts somehow have the same timestamp, use a stable secondary ordering such as:

```text
createdAt DESC
id DESC
```

The evaluator should not observe random ordering between requests.

---

# 29. Feed Persistence Requirement

Previously returned posts must remain available.

Example:

### First request

```json
{
  "posts": [
    {
      "id": "p2"
    }
  ]
}
```

### Later request

```json
{
  "posts": [
    {
      "id": "p3"
    },
    {
      "id": "p2"
    }
  ]
}
```

Post `p2` must not disappear merely because a newer post was generated.

---

# 30. No Ephemeral Feed

Do not implement the feed as an in-memory array.

Incorrect:

```javascript
let posts = [];
```

as the only source of persistence.

The application may restart during the 48-hour evaluation.

Use persistent storage.

---

# 31. Post Schema

Each public post must contain:

```typescript
interface FeedPost {
    id: string;
    createdAt: string;
    text: string;
    rationale: string;
    sources: string[];
}
```

---

# 32. Post ID

`id` must be unique.

It must remain unchanged between feed requests.

Example:

```text
p7
```

or:

```text
post_01J...
```

---

# 33. Created At

`createdAt` must:

- be a string,
- represent UTC,
- use ISO 8601 format.

Valid example:

```text
2026-08-08T10:30:00Z
```

Avoid:

```text
08/08/2026 10:30
```

or:

```text
2026-08-08 10:30:00
```

without timezone information.

---

# 34. Text

`text` contains the final published content.

It must be:

- a string,
- non-empty,
- final publication text,
- free of internal debugging information.

Do not expose:

- prompt text,
- model reasoning traces,
- internal state,
- database IDs unrelated to the post,
- or hidden instructions.

---

# 35. Rationale

Every post must include a rationale.

The rationale must answer:

```text
Why was this topic selected?

Why is it relevant now?

Why did this angle deserve publication?
```

It should be more than:

> "This is an important topic."

---

# 36. Rationale Example

Good:

```text
Selected because the infrastructure change provides evidence that inference economics is becoming a competitive variable rather than merely a technical optimization. It is relevant now because new pricing and benchmark data appeared today. The agent prioritized it over several model-launch stories because it reveals a broader change in the economics of deploying AI.
```

---

# 37. Rationale and Post Separation

The rationale should explain the editorial decision.

It should not simply repeat the post.

Bad:

```text
The post talks about lower inference costs.
```

Good:

```text
The topic was selected because the pricing change provides evidence of a broader shift toward inference economics as a strategic variable.
```

---

# 38. Sources

Every post must include its supporting source URLs.

Example:

```json
"sources": [
  "https://example.com/article",
  "https://example.com/documentation"
]
```

---

# 39. Source Requirements

Sources should be:

- real,
- relevant,
- accessible where possible,
- directly connected to the post,
- and stored with the publication.

Do not generate fake URLs.

---

# 40. Source Count

There is no requirement for a specific number of sources.

Use enough to support the important claims.

A single strong primary source may be better than five irrelevant links.

---

# 41. Source Preservation

Sources must remain attached to the post after publication.

Do not reconstruct sources dynamically during feed retrieval.

---

# 42. Source Order

Recommended:

```text
primary source
↓
important independent source
↓
supporting source
```

This is optional but improves readability.

---

# 43. Source URL Validation

Before publication, validate that each source:

- is a syntactically valid URL,
- uses an allowed protocol such as HTTPS,
- corresponds to a stored source record,
- and was actually used during research.

---

# 44. API Must Not Trust LLM-Generated URLs

If the LLM produces:

```text
https://some-random-site.example
```

the application should not blindly accept it.

Sources should originate from the discovery/research layer.

---

# 45. Public API vs Internal Metadata

The public feed should remain minimal.

Public:

```text
id
createdAt
text
rationale
sources
```

Internal:

```text
candidateId
thesisId
editorialScore
confidence
model
promptVersion
research
memory
claimLedger
distribution metadata
```

---

# 46. Internal Metadata Must Not Leak

Do not return:

```json
{
  "model": "...",
  "prompt": "...",
  "editorialScore": 91,
  "internalMemory": "..."
}
```

unless explicitly required.

The evaluator only needs the required feed contract.

---

# 47. HTTP Status Codes

Recommended behavior:

### Initialization

```text
200 OK
```

on success.

```text
400 Bad Request
```

for malformed request.

```text
500 Internal Server Error
```

for unexpected server failure.

### Feed

```text
200 OK
```

on success.

```text
400 Bad Request
```

for missing/invalid `agentId`.

```text
404 Not Found
```

if the specified agent does not exist.

```text
500 Internal Server Error
```

for unexpected server failure.

---

# 48. Invalid Agent ID

Request:

```http
GET /api/agent/feed?agentId=does-not-exist
```

Recommended response:

```http
404 Not Found
```

Example:

```json
{
  "error": "Agent not found"
}
```

---

# 49. Missing Agent ID

Request:

```http
GET /api/agent/feed
```

Recommended:

```http
400 Bad Request
```

Example:

```json
{
  "error": "agentId is required"
}
```

---

# 50. Invalid Agent ID Format

If the implementation uses UUIDs and receives malformed input:

```text
400 Bad Request
```

Do not let malformed identifiers reach arbitrary database queries.

---

# 51. Authentication

The hackathon specification does not require public API authentication.

Do not add complicated authentication that could interfere with evaluator access.

If authentication is needed for deployment security, it must remain compatible with the evaluator's expected request format.

---

# 52. Internal Endpoints

The implementation may have internal endpoints for:

- waking the runtime,
- health checks,
- diagnostics,
- manual development testing.

These are **not part of the public hackathon contract**.

Example:

```text
POST /internal/runtime/wake
GET  /internal/health
```

If exposed publicly, they must be protected.

---

# 53. Runtime Wake Endpoint

If a wake endpoint is implemented:

```text
POST /internal/runtime/wake
```

its responsibility is only to initiate a bounded autonomous cycle.

It must not:

- accept editorial instructions,
- accept arbitrary prompts,
- allow external users to dictate topics,
- or bypass the editorial engine.

---

# 54. Why No Manual Generate Endpoint?

Do not expose:

```text
POST /api/generate
```

as part of the evaluator workflow.

The entire point is that after initialization:

> **No human tells the agent what to generate.**

A manual generation endpoint may exist for local development but should not be part of the production contract.

---

# 55. Health Endpoint

A lightweight health endpoint is useful for deployment.

Example:

```text
GET /health
```

Possible response:

```json
{
  "status": "ok"
}
```

This is not part of the hackathon's required API.

---

# 56. Readiness vs Liveness

If desired:

```text
GET /health/live
GET /health/ready
```

could distinguish:

- process alive,
- dependencies available.

For the MVP, a single `/health` endpoint is sufficient.

---

# 57. Feed Endpoint Must Be Fast

The evaluator may query the feed repeatedly.

Target behavior:

```text
database read
→ serialize
→ response
```

The feed endpoint should normally complete in milliseconds to low hundreds of milliseconds, depending on infrastructure.

It should never wait for an LLM.

---

# 58. No External API Calls in Feed Retrieval

Do not do:

```text
GET /feed
 ↓
fetch X
 ↓
fetch LinkedIn
 ↓
fetch news
 ↓
generate content
 ↓
return
```

The feed is a persisted view.

---

# 59. No LLM Calls in Feed Retrieval

Do not call:

```text
LLM
```

from:

```text
GET /api/agent/feed
```

This would make evaluation unreliable and violate the separation between autonomous runtime and observation.

---

# 60. No State Mutation in Feed Retrieval

GET should be observational.

It should not:

- mark posts as read,
- change candidate state,
- update memory,
- trigger discovery,
- or alter timestamps.

---

# 61. Cache Considerations

Feed responses can optionally be cached.

However, because new posts may appear during evaluation, caching must not prevent new posts from becoming visible.

For the expected feed size, database queries are likely sufficient.

Do not overengineer caching.

---

# 62. Database Query

Conceptually:

```sql
SELECT
    id,
    created_at,
    text,
    rationale,
    sources
FROM posts
WHERE agent_id = :agent_id
  AND status = 'PUBLISHED'
ORDER BY created_at DESC;
```

---

# 63. Serialization

Database field names may differ from API names.

Example:

```text
created_at
```

becomes:

```json
"createdAt"
```

The API contract must remain stable even if the database schema changes.

---

# 64. API Versioning

Do not introduce unnecessary versioning such as:

```text
/api/v17/agent/feed
```

for the hackathon.

Use exactly:

```text
/api/agent/init
/api/agent/feed
```

unless the evaluator specification changes.

---

# 65. Content-Type

Requests with JSON bodies:

```http
Content-Type: application/json
```

Responses:

```http
Content-Type: application/json
```

---

# 66. CORS

If the API is consumed directly from a browser dashboard, configure appropriate CORS.

If no browser client is required, avoid permissive CORS unless needed.

Do not let CORS configuration interfere with evaluator requests.

---

# 67. Request Size

The initialization request is tiny.

Configure normal request-size limits.

There is no reason to allow massive request bodies.

---

# 68. Rate Limiting

The feed endpoint may be called periodically by the evaluator.

Do not implement aggressive rate limits that could block legitimate evaluation.

If rate limiting is necessary:

```text id="v5sqw2"
allow comfortably more than expected evaluator traffic
```

---

# 69. Logging

Log:

```text
request method
path
status
latency
agentId where appropriate
```

Do not log:

- API keys,
- authorization headers,
- private prompts,
- sensitive environment variables.

---

# 70. Feed Request Logging

Useful:

```text
GET /api/agent/feed
agentId=abc-123
status=200
posts=4
latency=32ms
```

This helps diagnose evaluator behavior.

---

# 71. Initialization Logging

Useful:

```text
agent initialized
agentId=abc-123
persona=Second Order
domain=AI and Technology
```

Avoid logging secrets.

---

# 72. Autonomous Activity Must Be Decoupled

The API server should not depend on an incoming feed request to remain active.

Correct:

```text
Scheduler → Runtime → Database
                       ↑
                       │
                 Feed endpoint
```

Incorrect:

```text
Evaluator → Feed endpoint → Runtime → Database
```

---

# 73. API and Autonomous Runtime Architecture

The intended architecture:

```text
                       ┌───────────────┐
                       │ HTTP API      │
                       │               │
Evaluator ────────────→│ /init         │
                       │ /feed         │
                       └───────┬───────┘
                               │
                               ▼
                         Persistent DB
                               ▲
                               │
                       ┌───────┴───────┐
                       │ Autonomous    │
                       │ Runtime       │
                       └───────────────┘
                               ▲
                               │
                           Scheduler
```

The evaluator observes.

The runtime acts.

---

# 74. Initialization-to-Feed Sequence

Expected sequence:

```text
Evaluator
   │
   │ POST /api/agent/init
   ▼
API
   │
   │ create agent
   ▼
Database
   │
   │ agentId
   ▼
API
   │
   │ 200 + agentId
   ▼
Evaluator
```

Then independently:

```text
Scheduler
   │
   ▼
Autonomous Cycle
   │
   ▼
Publication
   │
   ▼
Database
```

Then:

```text
Evaluator
   │
   │ GET /api/agent/feed?agentId=...
   ▼
Database
   │
   ▼
Feed JSON
```

---

# 75. Autonomous New Post Sequence

```text
New source discovered
       ↓
Candidate created
       ↓
Editorial decision
       ↓
Research
       ↓
Content generated
       ↓
Validation
       ↓
Post persisted
       ↓
Feed automatically contains new post
```

No evaluator request is involved in the creation of the post.

---

# 76. Feed Consistency

Once a post is returned by the feed:

> It should remain returned in subsequent requests unless there is an exceptional administrative/data-integrity issue.

Do not automatically delete old posts.

---

# 77. No Post Mutation

Published post text should generally be immutable.

If a correction is necessary, the system may create a new version or corrected post according to future product requirements.

For the hackathon, immutable published posts are simpler and safer.

---

# 78. Post Correction

If a factual error is detected after publication:

Recommended future architecture:

```text
Original post
     ↓
Correction event
     ↓
Corrected post/version
```

Do not silently alter history unless explicitly designed.

This is not required for the MVP.

---

# 79. Feed Snapshot Behavior

The feed response represents the database state at query time.

If a new post is published between two requests:

```text
Request 1:
A

new post B

Request 2:
B
A
```

This is expected.

---

# 80. Empty Feed During Evaluation

It is valid for the first feed request to return:

```json
{
  "posts": []
}
```

if the autonomous runtime has not yet published anything.

However, the runtime should continue operating independently.

---

# 81. Feed Should Eventually Change

The key evaluation signal is that after enough time:

```text
GET feed
```

can return:

```text
A
```

and later:

```text
B
A
```

without any additional generation instruction.

---

# 82. API Contract Does Not Guarantee Publication

The API should never fabricate a post just to satisfy a request.

If no worthy topic exists:

```json
{
  "posts": []
}
```

or the previously persisted posts should be returned.

Editorial quality takes priority over artificial activity.

---

# 83. Error Isolation

If the autonomous runtime experiences:

```text
LLM failure
```

the API should still return existing posts.

If:

```text
discovery failure
```

the feed should still work.

If:

```text
external social platform failure
```

the feed should still work.

This is critical.

---

# 84. Database Failure

If the database is unavailable:

```text
GET /feed
```

may return:

```text
500 Internal Server Error
```

but the application should log the failure and recover when the database becomes available.

---

# 85. LLM Failure Must Not Break API

The API server and LLM runtime should be logically separated.

A failed inference should not cause:

```text
HTTP server crash
```

---

# 86. Runtime Failure Recovery

If a runtime cycle fails:

```text
cycle failed
 ↓
persist failure
 ↓
release lock
 ↓
wait for next scheduled cycle
```

Do not permanently disable the agent because one cycle failed.

---

# 87. Database Transaction Boundaries

At minimum:

### Initialization

Agent creation should be transactional.

### Publication

Post creation and critical publication metadata should be transactional.

### Memory

Memory updates should be consistent with successful publication.

---

# 88. API Schema Validation

Use a schema validation library appropriate to the chosen stack.

Examples conceptually:

```text
Zod
Pydantic
JSON Schema
Joi
```

The exact library is implementation-specific.

The contract is what matters.

---

# 89. Response Validation

The application should validate its own response objects before returning them.

Especially:

```text
agentId
post.id
createdAt
text
rationale
sources
```

This prevents malformed responses reaching the evaluator.

---

# 90. API Contract Testing

Create tests for:

### Initialization

```text
valid request
invalid request
missing persona
missing name
missing domain
```

### Feed

```text
valid agent
unknown agent
missing agentId
empty feed
multiple posts
ordering
persistence
```

---

# 91. Integration Test

At minimum, run:

```text
POST /api/agent/init
      ↓
receive agentId
      ↓
insert simulated publication
      ↓
GET /api/agent/feed
      ↓
verify post
```

Then:

```text
restart application
      ↓
GET /api/agent/feed
      ↓
verify post still exists
```

This proves persistence.

---

# 92. Autonomous Integration Test

A development test should simulate:

```text
initialize
 ↓
runtime cycle
 ↓
publication
 ↓
wait
 ↓
second runtime cycle
 ↓
new publication
 ↓
feed contains both
```

This directly tests the hackathon's central requirement.

---

# 93. Contract Test Example

Expected:

```json
{
  "posts": [
    {
      "id": "p2",
      "createdAt": "2026-08-08T11:00:00Z",
      "text": "Post 2",
      "rationale": "Selected because...",
      "sources": [
        "https://example.com/2"
      ]
    },
    {
      "id": "p1",
      "createdAt": "2026-08-08T10:00:00Z",
      "text": "Post 1",
      "rationale": "Selected because...",
      "sources": [
        "https://example.com/1"
      ]
    }
  ]
}
```

Verify:

```text
p2 before p1
p1 remains present
IDs unique
timestamps valid
sources are arrays
rationale exists
```

---

# 94. API Documentation

A human-readable README should provide:

```text
Base URL

POST /api/agent/init

GET /api/agent/feed?agentId=...
```

Do not require the evaluator to understand internal architecture.

---

# 95. Example cURL — Initialization

```bash
curl -X POST "$BASE_URL/api/agent/init" \
  -H "Content-Type: application/json" \
  -d '{
    "persona": {
      "name": "Second Order",
      "domain": "AI and Technology"
    }
  }'
```

Expected:

```json
{
  "agentId": "abc-123"
}
```

---

# 96. Example cURL — Feed

```bash
curl "$BASE_URL/api/agent/feed?agentId=abc-123"
```

Expected:

```json
{
  "posts": []
}
```

or a populated feed.

---

# 97. Environment Independence

The API should not depend on local filesystem state.

Deployment should work with:

```text
environment variables
+
persistent database
```

not:

```text
local JSON file
+
developer laptop
```

unless the file is backed by genuinely persistent deployment storage.

---

# 98. Configuration

Suggested environment variables:

```env
DATABASE_URL=...

LLM_PRIMARY_PROVIDER=...
LLM_PRIMARY_MODEL=...

LLM_FAST_PROVIDER=...
LLM_FAST_MODEL=...

AGENT_RUNTIME_ENABLED=true

DISTRIBUTION_MODE=internal
```

Actual provider-specific variables depend on implementation.

---

# 99. Secrets

Never place:

```text
API keys
database passwords
OAuth secrets
```

inside:

- source code,
- documentation,
- public API responses,
- Git commits.

Use deployment secrets.

---

# 100. Deployment Base URL

The deployed application should expose:

```text
https://<deployment-domain>
```

and therefore:

```text
POST https://<deployment-domain>/api/agent/init
GET  https://<deployment-domain>/api/agent/feed?agentId=...
```

The actual domain is deployment-specific.

---

# 101. Reverse Proxy Compatibility

The API should work correctly behind:

- Render,
- Nginx,
- Cloudflare,
- or another reverse proxy.

The application should correctly handle:

```text
X-Forwarded-Proto
X-Forwarded-For
```

where relevant.

---

# 102. Time Handling

Store timestamps internally in UTC.

Use the server/database's UTC time.

Do not rely on the developer's local timezone.

---

# 103. Clock Skew

The system should use the database/server clock consistently.

Do not mix:

```text
client timestamp
+
server timestamp
```

for publication ordering.

Publication timestamps should be server-generated.

---

# 104. Feed Performance

For the expected 48-hour post volume:

```text
simple indexed database query
```

should be sufficient.

Recommended index:

```text
(agent_id, status, created_at DESC)
```

if supported by the chosen database.

---

# 105. Database Indexing

At minimum, optimize:

```text
posts.agent_id
posts.status
posts.created_at
```

A composite index is preferable for the feed query.

---

# 106. API Availability During Runtime Work

A long-running LLM task should not block the HTTP server.

If the runtime and API share a process:

- runtime work must be bounded,
- asynchronous where appropriate,
- and prevented from monopolizing the event loop.

Prefer separate worker execution where the hosting environment supports it.

---

# 107. Recommended Runtime Separation

Conceptually:

```text
Web Server
   │
   ├── /api/agent/init
   └── /api/agent/feed

Runtime Worker
   │
   ├── discovery
   ├── editorial
   ├── content
   └── publication
```

Both share:

```text
Persistent Database
```

---

# 108. MVP Simplification

If deployment constraints make a separate worker impractical:

```text
single application process
+
scheduler
+
persistent database
```

is acceptable.

But keep the code modules logically separated.

---

# 109. Public API Is Not the Agent

This distinction is important.

The API is merely:

```text
observation/control boundary
```

The autonomous agent is:

```text
scheduler
+
state machine
+
discovery
+
editorial engine
+
LLM
+
memory
+
publication
```

---

# 110. API Contract and State Machine

The API may cause only two high-level state changes:

### Initialization

```text
UNINITIALIZED → ACTIVE
```

### Feed retrieval

```text
NO STATE CHANGE
```

The autonomous runtime handles all other transitions.

---

# 111. No Human Instructions After Initialization

Do not design the API around:

```text
POST /api/agent/topic
POST /api/agent/prompt
POST /api/agent/approve
POST /api/agent/generate
```

These would undermine the autonomous design.

---

# 112. No Topic Injection

The evaluator should not be able to tell the agent:

> "Write about NVIDIA."

The agent must discover topics itself.

---

# 113. No Editorial Override

The evaluator should not need to approve:

```text
publish candidate
```

The Editorial Engine decides.

---

# 114. No Content Prompt

The evaluator should not submit:

```json
{
  "prompt": "Write a post about..."
}
```

after initialization.

The feed must evolve without such instructions.

---

# 115. Autonomous Observation

The evaluator's role is:

```text
observe
```

not:

```text
operate
```

This is essential to the hackathon.

---

# 116. API Contract Summary

The public contract is intentionally tiny:

```text
POST /api/agent/init
```

Input:

```json
{
  "persona": {
    "name": "Ada",
    "domain": "AI Security"
  }
}
```

Output:

```json
{
  "agentId": "abc-123"
}
```

Then:

```text
GET /api/agent/feed?agentId=abc-123
```

Output:

```json
{
  "posts": [
    {
      "id": "...",
      "createdAt": "...",
      "text": "...",
      "rationale": "...",
      "sources": ["..."]
    }
  ]
}
```

---

# 117. Non-Negotiable Requirements

The implementation MUST satisfy:

```text
✓ POST /api/agent/init exists
✓ initialization accepts persona
✓ initialization returns agentId
✓ agent state is persistent
✓ GET /api/agent/feed exists
✓ feed accepts agentId
✓ feed returns JSON
✓ posts are newest first
✓ post IDs are unique
✓ timestamps are ISO 8601 UTC
✓ previously returned posts remain available
✓ empty feed returns {"posts":[]}
✓ every post has text
✓ every post has rationale
✓ every post has sources
✓ new posts can appear without evaluator prompts
✓ feed retrieval does not trigger generation
```

---

# 118. Strongly Recommended Requirements

The implementation SHOULD also provide:

```text
✓ persistent PostgreSQL storage
✓ idempotent initialization
✓ idempotent publication
✓ runtime locking
✓ structured validation
✓ autonomous cycle recovery
✓ LLM failure recovery
✓ health endpoint
✓ runtime logging
✓ publication observability
```

---

# 119. Explicitly Not Required

The API does NOT require:

```text
X integration
LinkedIn integration
user accounts
authentication
likes
comments
followers
engagement metrics
media uploads
threads
analytics
multi-agent endpoints
```

Do not add these unless they have a concrete purpose.

---

# 120. API Design Goal

The evaluator should be able to understand the entire public API in under one minute.

That is a feature.

The complexity belongs inside the autonomous system, not in the evaluator-facing interface.

---

# 121. Final API Principle

The API should make Second Order look deceptively simple:

```text
Initialize me.
       ↓
I will take it from here.
       ↓
Ask me what I've published.
```

The intelligence should exist behind the interface.

The evaluator should never need to manually operate the system.

The final experience should therefore be:

```text
POST /init
       ↓
agentId
       ↓
wait
       ↓
GET /feed
       ↓
posts
       ↓
wait
       ↓
GET /feed
       ↓
more posts
       ↓
memory and continuity become visible
```

That temporal behavior—not API complexity—is the actual demonstration of autonomy.
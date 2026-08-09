# 13_DEPLOYMENT.md

# Second Order — Deployment & 48-Hour Evaluation Operations

## 1. Purpose

This document defines how Second Order is deployed and operated during the hackathon evaluation period.

The deployment must support:

- autonomous operation after initialization,
- persistent storage,
- periodic autonomous cycles,
- live information discovery,
- LLM inference,
- durable memory,
- publication over time,
- reliable API access,
- and approximately 48 hours of continuous evaluation.

The deployment should prioritize:

1. Reliability
2. Simplicity
3. Low cost
4. Recoverability
5. Observability
6. Minimal infrastructure

---

# 2. Deployment Philosophy

Second Order is not a traditional web application where the server merely waits for requests.

It is an autonomous system.

The production architecture is therefore:

```text
                  ┌──────────────────────┐
                  │   Evaluator          │
                  │                      │
                  │ POST /init           │
                  │ GET /feed            │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      Web API         │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │     PostgreSQL       │
                  └──────────┬───────────┘
                             ▲
                             │
                  ┌──────────┴───────────┐
                  │ Autonomous Runtime   │
                  └──────────┬───────────┘
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
          Discovery         LLM         Memory
```

The evaluator observes the system.

The runtime operates it.

---

# 3. Primary Deployment Objective

The deployment must satisfy this invariant:

> **After `/api/agent/init` is called once, the agent must be capable of continuing to discover, evaluate, generate, remember, and publish without any further evaluator instruction.**

---

# 4. Recommended Architecture

For the hackathon MVP:

```text
                    Internet
                       │
                       ▼
                ┌─────────────┐
                │ Render Web  │
                │   Service   │
                └──────┬──────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
         HTTP API          Autonomous Runtime
             │                   │
             └─────────┬─────────┘
                       ▼
                ┌─────────────┐
                │ PostgreSQL  │
                └─────────────┘
```

External services:

```text
LLM Provider
Discovery Sources
Optional Wake/Scheduler
Optional X
Optional LinkedIn
```

---

# 5. Recommended Hosting Strategy

The initial target deployment should be:

```text
Application:
Render

Database:
Managed PostgreSQL

LLM:
Hosted API provider

Scheduler:
Native scheduler if available,
otherwise external scheduler/wake mechanism
```

The architecture must remain provider-independent.

---

# 6. Why Not Host the LLM Locally?

Do not deploy a large Ollama model on the same small web service unless there is a compelling infrastructure reason.

Running a capable model requires:

- significant RAM,
- substantial CPU/GPU resources,
- longer inference times,
- persistent compute,
- and more complicated deployment.

For a 48-hour hackathon:

> **Use a hosted LLM API unless infrastructure economics clearly favor self-hosting.**

---

# 7. LLM Deployment Strategy

The application should communicate with the LLM through a provider abstraction.

Conceptually:

```text
Second Order
     ↓
LLMService
     ↓
Provider Adapter
     ↓
Hosted LLM
```

The rest of the application should not care which provider is used.

---

# 8. Environment Variables

Production configuration should use environment variables.

Minimum:

```env
NODE_ENV=production

DATABASE_URL=...

LLM_PRIMARY_PROVIDER=...
LLM_PRIMARY_MODEL=...

LLM_FAST_PROVIDER=...
LLM_FAST_MODEL=...

AGENT_RUNTIME_ENABLED=true

DISTRIBUTION_MODE=internal
```

Provider-specific API keys should also be environment variables.

---

# 9. Secrets

Never commit:

```text
API keys
database passwords
OAuth credentials
LLM credentials
webhook secrets
```

to Git.

Use the deployment provider's secret/environment-variable system.

---

# 10. `.env` Handling

Local development may use:

```text
.env
```

but:

```text
.env
```

must be included in `.gitignore`.

Commit:

```text
.env.example
```

instead.

---

# 11. `.env.example`

The repository should contain an example:

```env
DATABASE_URL=

LLM_PRIMARY_PROVIDER=
LLM_PRIMARY_MODEL=

LLM_FAST_PROVIDER=
LLM_FAST_MODEL=

AGENT_RUNTIME_ENABLED=true

DISTRIBUTION_MODE=internal

RUNTIME_INTERVAL_MINUTES=10
```

Do not put real secrets into this file.

---

# 12. Production Configuration

Production should use:

```text
AGENT_RUNTIME_ENABLED=true
DISTRIBUTION_MODE=internal
```

External social integrations should remain disabled unless explicitly tested and intentionally enabled.

---

# 13. Internal Feed as Production Source of Truth

The deployment must not depend on X or LinkedIn.

Production remains fully functional with:

```text
ENABLE_X=false
ENABLE_LINKEDIN=false
```

The hackathon feed is the authoritative publication surface.

---

# 14. Database Deployment

Use persistent PostgreSQL.

Do not use:

```text
SQLite on ephemeral filesystem
JSON files
in-memory storage
temporary filesystem storage
```

as the production persistence layer.

---

# 15. Database Connection

The application should read:

```env
DATABASE_URL=...
```

from the deployment environment.

Do not hard-code database credentials.

---

# 16. Database Migrations

The deployment process must run database migrations before application startup or as an explicit deployment step.

Conceptually:

```text
deploy
 ↓
install dependencies
 ↓
run migrations
 ↓
start application
```

---

# 17. Migration Safety

Migrations must be:

- deterministic,
- version controlled,
- reversible where practical,
- compatible with the deployed application.

Do not manually create production tables.

---

# 18. Database Connection Pooling

Use a reasonable database connection pool.

Do not open a new database connection for every query without pooling.

For a small hackathon deployment:

```text
small pool
```

is sufficient.

Do not overallocate connections.

---

# 19. Web Service

The web service must expose:

```text
POST /api/agent/init
GET /api/agent/feed
```

and optionally:

```text
GET /health
```

---

# 20. Application Port

The application must bind to the hosting provider's assigned port.

For example:

```text
PORT
```

should come from the environment where required.

Do not hard-code:

```text
localhost:3000
```

for production.

---

# 21. Host Binding

The server should bind to:

```text
0.0.0.0
```

inside the deployment container/environment.

Do not bind exclusively to:

```text
127.0.0.1
```

or the service may be unreachable externally.

---

# 22. Build Process

The production build should follow:

```text
clone repository
 ↓
install dependencies
 ↓
build application
 ↓
run migrations
 ↓
start server
```

The exact commands depend on the chosen stack.

---

# 23. Start Command

The production start command should:

1. start the HTTP server,
2. initialize runtime infrastructure,
3. connect to the database,
4. recover stale runtime state,
5. begin autonomous scheduling.

It must not depend on manual terminal interaction.

---

# 24. Startup Recovery

On startup:

```text
load active agents
 ↓
load runtime state
 ↓
detect stale cycles
 ↓
release expired locks
 ↓
resume scheduling
```

The application should recover from ordinary restarts.

---

# 25. Health Endpoint

Recommended:

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

This endpoint should be lightweight.

It should not invoke the LLM.

---

# 26. Health Check Philosophy

A health check should answer:

> "Is the application process capable of serving requests?"

It should not perform:

- discovery,
- LLM generation,
- database repair,
- or publication.

---

# 27. Readiness Check

If implemented, readiness may verify:

```text
database reachable
configuration valid
application initialized
```

But keep it simple for the hackathon.

---

# 28. Autonomous Runtime

The autonomous runtime is the most important deployment component after persistence.

It must run independently of:

```text
GET /api/agent/feed
```

---

# 29. Runtime Scheduling

The runtime should execute periodic cycles.

A reasonable initial cadence is approximately:

```text
10–20 minutes
```

depending on:

- provider rate limits,
- cost,
- source freshness,
- and hosting behavior.

---

# 30. Important: Cycle ≠ Publication

A cycle means:

> "The agent gets an opportunity to observe and reason."

It does not mean:

> "The agent must publish."

Therefore:

```text
10-minute cycle
→ discovery
→ editorial judgment
→ maybe publish
```

is correct.

This is superior to:

```text
10-minute cycle
→ publish something
```

---

# 31. Recommended Hackathon Cadence

Start with:

```text
RUNTIME_INTERVAL_MINUTES=10
```

Then tune based on:

- actual LLM cost,
- source volume,
- publication quality,
- and deployment reliability.

---

# 32. Why 10 Minutes?

The evaluation lasts approximately 48 hours.

A 10-minute cycle provides:

```text
~6 opportunities/hour
~144 opportunities/day
~288 opportunities/48h
```

The agent will not publish on every cycle.

The cadence simply provides sufficient opportunities to react to changing information.

---

# 33. Avoid Excessive LLM Usage

Do not call expensive models on every discovered item.

Use the architecture from:

```text
08_LLM_STRATEGY.md
```

For example:

```text
cheap/fast model
    ↓
candidate screening
    ↓
strong model
    ↓
editorial reasoning
    ↓
strong model
    ↓
final content
```

---

# 34. Cost Control

The deployment should track:

```text
LLM calls
tokens
estimated cost
cycle cost
total cost
```

Use the `llm_usage` database table.

---

# 35. Runtime Budget

Set an approximate operational budget.

Example:

```text
daily LLM budget
maximum cycle duration
maximum candidates per cycle
maximum generation attempts
```

The exact values should be configurable.

---

# 36. Failure Budget

One failed cycle must not kill the agent.

Example:

```text
cycle fails
 ↓
log failure
 ↓
release lock
 ↓
next cycle
```

Do not enter a permanent failed state because of a temporary API error.

---

# 37. Retry Policy

Use bounded retries.

Recommended:

```text
temporary network failure
→ retry 1
→ retry 2
→ abandon cycle
```

Do not retry indefinitely.

---

# 38. LLM Retry Policy

For transient LLM errors:

```text
timeout
rate limit
temporary provider failure
```

use exponential backoff.

For permanent errors:

```text
invalid API key
invalid model
invalid request
```

fail quickly and record the issue.

---

# 39. Discovery Failure

If a source provider fails:

```text
source A fails
 ↓
try source B
 ↓
continue if sufficient data
```

The agent should not depend on one source.

---

# 40. Total Discovery Failure

If all discovery sources fail:

```text
cycle
 ↓
no reliable new information
 ↓
do not publish
 ↓
record cycle result
 ↓
retry next cycle
```

Do not fabricate information.

---

# 41. LLM Provider Failure

If the primary LLM fails and a fallback is configured:

```text
Primary LLM
     ↓
failure
     ↓
Fallback LLM
```

If both fail:

```text
skip generation
continue next cycle
```

---

# 42. Database Failure

If PostgreSQL temporarily fails:

```text
runtime cycle
 ↓
database error
 ↓
retry
 ↓
if still failing:
    abort cycle
```

Do not create fake in-memory persistence as a substitute.

---

# 43. Feed During Runtime Failure

Existing posts should remain readable whenever the database is available.

A failed autonomous cycle must not affect:

```text
GET /api/agent/feed
```

---

# 44. Render Sleep Consideration

If the selected Render service sleeps when inactive, the architecture must account for it.

The critical distinction is:

> **Keeping the web process awake is not the same thing as implementing autonomous execution.**

The agent's correctness must not depend on a keepalive request.

---

# 45. Wake Strategy

Preferred order:

### Option 1

Use a platform-native persistent worker/scheduled execution mechanism.

### Option 2

Use an external scheduler to periodically wake the application.

### Option 3

Use an external uptime monitor that requests a lightweight endpoint.

---

# 46. External Wake Service

If an external scheduler is used:

```text
External Scheduler
      ↓
POST /internal/runtime/wake
      ↓
Agent checks whether cycle is due
      ↓
Run cycle
```

The endpoint must be protected.

---

# 47. Keepalive Endpoint

Do not use:

```text
GET /api/agent/feed
```

as the keepalive mechanism.

The feed endpoint must remain a pure read operation.

Use a separate internal mechanism.

---

# 48. Wake Endpoint Authentication

If the wake endpoint is externally accessible, require a secret.

Conceptually:

```http
POST /internal/runtime/wake
Authorization: Bearer <runtime-secret>
```

The secret must be stored as an environment variable.

---

# 49. Wake Endpoint Behavior

The endpoint should:

1. authenticate the caller,
2. load agent runtime state,
3. check whether a cycle is already running,
4. acquire a runtime lease,
5. start/execute one bounded cycle,
6. return a simple status.

---

# 50. Duplicate Wake Protection

If two wake requests arrive:

```text
Wake A → cycle starts
Wake B → sees active lease → exits
```

Do not run two autonomous cycles simultaneously.

---

# 51. Native Scheduler Preference

If the hosting provider provides a reliable scheduled execution facility at acceptable cost, prefer it over an artificial keepalive.

This is cleaner because:

```text
scheduler
```

is explicitly responsible for:

```text
autonomous execution
```

rather than merely preventing sleep.

---

# 52. 48-Hour Reliability Strategy

The system should be designed as if:

```text
process may restart
network may fail
LLM may fail
source may fail
database may temporarily fail
scheduler may miss a cycle
```

The important requirement is:

> **The next successful cycle must recover automatically.**

---

# 53. Do Not Depend on Continuous Process Memory

Bad architecture:

```text
process starts
 ↓
remember everything in RAM
 ↓
run forever
```

Good architecture:

```text
process starts
 ↓
load state from database
 ↓
run cycle
 ↓
persist state
 ↓
process may stop
 ↓
restart
 ↓
load state
```

---

# 54. Deployment Restart Test

Before submission:

```text
1. Initialize agent.
2. Generate at least one post.
3. Restart application.
4. Query feed.
5. Verify post remains.
6. Wait for next cycle.
7. Verify new autonomous activity.
```

This is mandatory.

---

# 55. Database Restart Test

If possible:

```text
1. Create post.
2. Restart application.
3. Query feed.
4. Verify post.
```

Do not manually recreate data.

---

# 56. Runtime Recovery Test

Simulate:

```text
cycle begins
 ↓
process killed
```

Then restart.

Verify:

```text
stale lock expires/recover
 ↓
new cycle can run
```

---

# 57. LLM Failure Test

Temporarily configure an invalid or simulated LLM response.

Verify:

```text
cycle fails
 ↓
error recorded
 ↓
application remains alive
 ↓
next cycle runs
```

---

# 58. Source Failure Test

Disable one source.

Verify:

```text
discovery continues using other sources
```

---

# 59. Feed Contract Test

Run:

```text
POST /api/agent/init
```

Then:

```text
GET /api/agent/feed?agentId=...
```

Verify the response exactly follows:

```text
11_API_CONTRACT.md
```

---

# 60. Production Smoke Test

Immediately after deployment:

```text
GET /health
```

Then:

```text
POST /api/agent/init
```

Record:

```text
agentId
```

Then:

```text
GET /api/agent/feed?agentId=...
```

---

# 61. Initialization Timing

After initialization, allow the runtime enough time to perform its first cycle.

Do not immediately conclude the system is broken simply because:

```json
{
  "posts": []
}
```

is returned initially.

---

# 62. First Publication

Before submitting, verify that at least one legitimate autonomous cycle can:

```text
discover
→ judge
→ generate
→ publish
```

without manual intervention.

---

# 63. Second Publication

Do not stop testing after the first post.

The important hackathon property is:

```text
publication over time
```

Therefore verify at least:

```text
Post A
↓
time
↓
Post B
```

without manually triggering generation.

---

# 64. Editorial Selectivity

The runtime should also demonstrate that some cycles produce:

```text
0 posts
```

because nothing deserves publication.

This is healthy.

Do not configure the system to guarantee a post every cycle.

---

# 65. Deployment Observability

Monitor:

```text
HTTP health
database connectivity
runtime cycles
last successful cycle
last publication
LLM errors
source failures
estimated LLM cost
```

---

# 66. Internal Runtime Metrics

Useful metrics:

```text
last_cycle_at
last_successful_cycle_at
last_post_at
cycles_completed
cycles_failed
posts_published
candidates_discovered
candidates_rejected
```

---

# 67. Log Levels

Use:

```text
INFO
WARN
ERROR
```

Avoid excessive debug logs in production.

---

# 68. Important INFO Events

Log:

```text
agent initialized
cycle started
cycle completed
candidate discovered
candidate approved
candidate rejected
post published
```

---

# 69. Important WARN Events

Log:

```text
LLM fallback used
source unavailable
rate limit encountered
cycle skipped
duplicate wake detected
```

---

# 70. Important ERROR Events

Log:

```text
database failure
LLM authentication failure
publication transaction failure
runtime crash
migration failure
```

---

# 71. Never Log Secrets

Never log:

```text
Authorization headers
API keys
database passwords
OAuth tokens
runtime secrets
```

---

# 72. Deployment Architecture — Recommended

The recommended low-complexity production setup:

```text
                       Internet
                           │
                           ▼
                  ┌─────────────────┐
                  │ Render Web App   │
                  │                 │
                  │ API             │
                  │ Runtime         │
                  └────────┬────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      ┌──────────────┐             ┌──────────────┐
      │ PostgreSQL   │             │ LLM Provider │
      └──────────────┘             └──────────────┘
             ▲
             │
      persistent state

Optional:
External scheduler
       ↓
runtime wake
```

---

# 73. Why This Architecture?

It minimizes:

```text
infrastructure count
deployment complexity
failure points
cost
```

while retaining:

```text
autonomy
memory
persistence
LLM capability
live discovery
```

---

# 74. Do Not Deploy Ollama by Default

Ollama can remain useful for:

```text
local development
fallback experimentation
prompt testing
offline experimentation
```

But production should not require it unless the chosen deployment infrastructure can reliably support the model.

---

# 75. Why Hosted LLM Is Preferred

Hosted inference provides:

```text
no GPU management
no model download
no model serving infrastructure
no RAM pressure
fast deployment
easy model switching
```

The cost is API usage.

For a 48-hour hackathon, that tradeoff is generally favorable.

---

# 76. LLM Provider Abstraction

The production code should support:

```text
LLMProvider
```

rather than hard-coding one provider throughout the codebase.

Conceptually:

```typescript
interface LLMProvider {
    generate(request): Promise<Response>;
}
```

---

# 77. Primary and Fallback Models

Recommended:

```text
Fast Model
    ↓
routine screening

Strong Model
    ↓
editorial reasoning
content generation
```

Optionally:

```text
Fallback Model
```

for provider outages.

---

# 78. Cost Optimization

The agent should not send entire research corpora to the strongest model.

Instead:

```text
raw sources
 ↓
cheap extraction
 ↓
candidate summary
 ↓
strong reasoning
```

This reduces tokens.

---

# 79. Context Budget

Keep LLM context bounded.

Do not send:

```text
entire database
```

to every model call.

Retrieve only:

```text
relevant sources
relevant memories
relevant theses
recent posts
candidate information
```

---

# 80. Database as Context Cache

The database should store extracted information so it does not need to be reprocessed unnecessarily.

For example:

```text
source fetched once
 ↓
facts extracted
 ↓
stored
```

Later cycles can reuse those facts.

---

# 81. Deployment Cost Philosophy

The goal is:

> **Spend money where it materially improves the agent, not where infrastructure can be avoided.**

Recommended spending priority:

```text
1. Reliable LLM inference
2. Persistent database if needed
3. Reliable hosting if free tier is insufficient
4. Everything else
```

---

# 82. Avoid Paying for Unnecessary Services

Do not add paid services for:

```text
analytics
social scheduling
vector databases
message brokers
Kubernetes
premium monitoring
```

unless a concrete problem requires them.

---

# 83. 48-Hour Cost Estimate

The actual cost depends heavily on:

- model,
- number of cycles,
- token volume,
- source volume,
- hosting plan.

Track actual usage through `llm_usage`.

Do not assume the theoretical maximum is the actual cost.

---

# 84. Budget Guard

Implement a configurable budget guard.

Conceptually:

```text
if estimated_daily_cost > DAILY_LLM_BUDGET:
    reduce expensive calls
```

Possible response:

```text
strong model
→ fast model
```

or:

```text
skip low-priority candidates
```

---

# 85. Runtime Backpressure

If the system accumulates too many candidates:

```text
candidate backlog
```

do not process everything immediately.

Prioritize:

```text
high relevance
high freshness
high editorial score
```

---

# 86. Deployment Configuration Example

Example:

```env
NODE_ENV=production

DATABASE_URL=<managed-postgres-url>

LLM_PRIMARY_PROVIDER=<provider>
LLM_PRIMARY_MODEL=<strong-model>

LLM_FAST_PROVIDER=<provider>
LLM_FAST_MODEL=<fast-model>

AGENT_RUNTIME_ENABLED=true
RUNTIME_INTERVAL_MINUTES=10

DISTRIBUTION_MODE=internal

ENABLE_X=false
ENABLE_LINKEDIN=false

DAILY_LLM_BUDGET=<configured-limit>
```

---

# 87. Production Checklist — Before Deploy

Verify:

```text
[ ] Production database created
[ ] DATABASE_URL configured
[ ] LLM credentials configured
[ ] Model names configured
[ ] Runtime enabled
[ ] Distribution mode set to internal
[ ] Migrations tested
[ ] Health endpoint works
[ ] API endpoints work
[ ] Logs visible
[ ] Secrets not committed
```

---

# 88. Production Checklist — After Deploy

Verify:

```text
[ ] GET /health works
[ ] POST /api/agent/init works
[ ] agentId returned
[ ] GET /api/agent/feed works
[ ] empty feed is valid
[ ] autonomous runtime starts
[ ] first cycle completes
[ ] first post appears
[ ] second cycle runs
[ ] second post can appear
[ ] posts survive restart
```

---

# 89. Production Checklist — Autonomy

Verify manually only during testing:

```text
[ ] no manual generation endpoint required
[ ] no evaluator prompt required
[ ] discovery runs independently
[ ] editorial judgment runs independently
[ ] publication runs independently
[ ] memory updates automatically
[ ] future cycles retrieve memory
```

After testing, remove any development-only intervention.

---

# 90. Production Checklist — Failure Recovery

Test:

```text
[ ] LLM timeout
[ ] LLM rate limit
[ ] source failure
[ ] database reconnect
[ ] application restart
[ ] runtime crash
[ ] duplicate wake
[ ] stale runtime lock
```

The system should recover without manual intervention wherever possible.

---

# 91. Submission Freeze

Before submitting the project:

```text
FREEZE CODE
```

Then:

```text
1. Deploy final version.
2. Run smoke tests.
3. Initialize evaluation agent only when ready.
4. Verify runtime.
5. Do not manually manipulate production state afterward.
```

---

# 92. Critical Submission Rule

Once the evaluator has initialized the agent:

> **Do not manually generate posts.**

Do not:

```text
call hidden generation endpoints
insert fake posts
edit feed rows
manually trigger editorial decisions
```

unless the hackathon organizers explicitly permit it for debugging.

The observed feed must be genuinely generated by the autonomous system.

---

# 93. Pre-Submission Dry Run

Perform a complete dry run using a fresh deployment/database:

```text
T0:
deploy

T+1:
initialize

T+10:
cycle

T+20:
cycle

T+30:
inspect feed

T+60:
inspect feed

T+120:
restart application

T+130:
inspect feed

T+180:
inspect feed
```

Confirm that the system continues independently.

---

# 94. Evaluation Simulation

Simulate the evaluator:

```text
POST /api/agent/init
```

Record `agentId`.

Then do nothing.

Periodically:

```text
GET /api/agent/feed?agentId=...
```

Observe:

```text
posts appear
old posts remain
new posts have later timestamps
rationales exist
sources exist
content remains persona-consistent
```

---

# 95. What Should Happen If No Story Is Worth Publishing?

Nothing.

The feed should remain unchanged.

Example:

```text
10:00
Post A

10:10
No worthwhile topic

10:20
No worthwhile topic

10:30
Post B
```

This is a successful autonomous system.

---

# 96. What Should Happen If the Agent Restarts?

It should:

```text
restart
 ↓
load agent
 ↓
load memory
 ↓
load theses
 ↓
load recent posts
 ↓
resume autonomous cycles
```

The persona should not behave as if it has amnesia.

---

# 97. What Should Happen If the LLM Is Temporarily Unavailable?

It should:

```text
record failure
 ↓
avoid publishing fabricated content
 ↓
remain operational
 ↓
retry later
```

---

# 98. What Should Happen If Discovery Finds Nothing?

It should:

```text
record cycle
 ↓
publish nothing
 ↓
wait for next cycle
```

---

# 99. What Should Happen If Several Topics Are Interesting?

The Editorial Engine should rank them.

Distribution should publish selectively.

Do not flood the feed.

---

# 100. What Should Happen If a Topic Becomes Stale?

The candidate should be:

```text
EXPIRED
```

or re-researched.

Do not publish stale information merely because it was previously approved.

---

# 101. Deployment Security

At minimum:

```text
HTTPS
secret environment variables
database credentials protected
internal wake endpoint protected
production logs sanitized
```

---

# 102. Database Security

The database should:

- require authentication,
- use TLS where provided,
- restrict credentials to the application,
- avoid public exposure where possible.

---

# 103. API Security

The required public endpoints do not need complex authentication unless the hackathon specifies it.

Avoid adding authentication that prevents the evaluator from calling the endpoints.

---

# 104. Runtime Security

Internal runtime endpoints should not allow arbitrary user input to become:

```text
topic
prompt
publication instruction
```

The autonomous system controls its own decisions.

---

# 105. External Social Security

If X or LinkedIn is eventually enabled:

```text
credentials
```

must be isolated from the core runtime.

External failure must never disable:

```text
internal feed
```

---

# 106. Deployment Architecture After Hackathon

The system can later evolve into:

```text
                 API
                  │
          ┌───────┴────────┐
          │                │
      PostgreSQL       Job Queue
                           │
                  ┌────────┴────────┐
                  │                 │
              Discovery          Writer
                  │                 │
                  └────────┬────────┘
                           │
                      Publisher
                       /   |   \
                      X  LinkedIn Web
```

But this is not necessary for the hackathon.

---

# 107. Recommended Hackathon Architecture

Keep it close to:

```text
                ┌──────────────┐
                │ Render       │
                │              │
Evaluator ─────→│ API          │
                │              │
                │ Runtime      │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ PostgreSQL   │
                └──────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Web Sources     LLM       Memory
```

This is enough.

---

# 108. Deployment Principle: Minimize Moving Parts

Every additional service creates another potential failure.

Therefore prefer:

```text
1 application
1 database
1 LLM provider
1 scheduler
```

over:

```text
5 microservices
3 databases
2 queues
4 external APIs
```

---

# 109. Deployment Principle: Persistence Over Uptime

Do not optimize exclusively for:

> "Keep the process alive."

Optimize for:

> "Make the agent recoverable."

A restart should be an operational event, not a loss of identity.

---

# 110. Deployment Principle: Autonomous Runtime Over Keepalive

A keepalive is only infrastructure support.

The actual autonomous loop is:

```text
wake
 ↓
load state
 ↓
discover
 ↓
judge
 ↓
write
 ↓
publish
 ↓
remember
 ↓
sleep
```

That is what matters.

---

# 111. Deployment Principle: Evaluator Independence

After:

```text
POST /api/agent/init
```

the system should need nothing from the evaluator except:

```text
GET /api/agent/feed
```

The evaluator is observing the agent, not operating it.

---

# 112. Final 48-Hour Architecture

The final deployed system should behave like:

```text
                    ┌──────────────────┐
                    │     EVALUATOR    │
                    └────────┬─────────┘
                             │
                     POST /init
                             │
                             ▼
                    ┌──────────────────┐
                    │      AGENT       │
                    │    INITIALIZED   │
                    └────────┬─────────┘
                             │
                             ▼
                     ┌──────────────┐
                     │   SCHEDULER  │
                     └──────┬───────┘
                            │
                     every ~10 min
                            │
                            ▼
                  ┌────────────────────┐
                  │ AUTONOMOUS CYCLE  │
                  └─────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
      DISCOVERY         EDITORIAL          MEMORY
          │              JUDGMENT             ▲
          └───────────────┬───────────────────┘
                          ▼
                    CONTENT GENERATION
                          │
                          ▼
                     VALIDATION
                          │
                          ▼
                     PUBLICATION
                          │
                          ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    └──────┬──────┘
                           │
                           ▼
                     /api/agent/feed
                           │
                           ▼
                       EVALUATOR
```

---

# 113. Final Operational Principle

The deployment should make this possible:

```text
Initialize once.

Walk away.

Come back 48 hours later.

The agent should have:
    - discovered new technology,
    - rejected weak stories,
    - formed opinions,
    - published selectively,
    - remembered its previous work,
    - updated its worldview,
    - and continued operating.
```

That is the deployment standard.

The infrastructure exists to make that behavior reliable—not to become the product itself.
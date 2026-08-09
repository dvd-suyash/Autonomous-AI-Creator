# 19_DECISIONS.md

# Second Order — Decisions, Risks & Assumptions

## 1. Purpose

This document records project decisions that affect implementation, evaluation, and demo reliability.

Use it for:

- architecture decisions,
- product tradeoffs,
- hackathon scope cuts,
- unresolved risks,
- assumptions about the evaluator,
- and follow-up work after submission.

The goal is to keep late-stage decisions visible instead of burying them in chat, commits, or memory.

---

# 2. Decision Log Format

Each decision should use:

```text
ID:
Date:
Decision:
Status: proposed | accepted | reversed
Context:
Reasoning:
Consequences:
Related docs:
```

---

# 3. Accepted Decisions

## D-001 — Public API Remains Minimal

Date: 2026-08-08

Status: accepted

Decision:

```text
Expose only the required evaluator endpoints as the public contract:

POST /api/agent/init
GET  /api/agent/feed?agentId=...
```

Context:

The hackathon evaluates autonomous behavior, not API breadth.

Reasoning:

Extra public endpoints create more failure modes and make it easier to accidentally depend on manual control.

Consequences:

Internal health, wake, admin, and debug endpoints may exist only if protected and excluded from the evaluator contract.

Related docs:

```text
11_API_CONTRACT.md
15_SECURITY_AND_SECRETS.md
18_HACKATHON_CHECKLIST.md
```

---

## D-002 — Internal Publishing Is Sufficient

Date: 2026-08-08

Status: accepted

Decision:

```text
Publishing to the internal feed satisfies the MVP.
Real X, LinkedIn, or other social distribution is optional.
```

Context:

The required observable behavior is that posts appear over time after initialization.

Reasoning:

Real social integrations add credential, policy, review, rate-limit, and accidental-posting risk without being required for the core evaluation.

Consequences:

Distribution modules should be written so external platforms can be added later, but they must not block the MVP.

Related docs:

```text
10_DISTRIBUTION_ARCHITECTURE.md
15_SECURITY_AND_SECRETS.md
17_IMPLEMENTATION_PLAN.md
```

---

## D-003 — Duplicate Initialization Returns Existing Agent

Date: 2026-08-08

Status: accepted

Decision:

```text
If an active evaluation agent already exists, POST /api/agent/init should return its existing agentId rather than creating another active autonomous agent.
```

Context:

The evaluator is expected to initialize once, but retries and refreshes can happen.

Reasoning:

Multiple active agents can duplicate posts, compete for runtime locks, and confuse feed evaluation.

Consequences:

The implementation should enforce this with a database constraint, deterministic environment key, idempotency key, or equivalent guard.

Related docs:

```text
11_API_CONTRACT.md
12_DATABASE_SCHEMA.md
18_HACKATHON_CHECKLIST.md
```

---

---

## D-004 - Free-First LLM Routing

Date: 2026-08-08

Status: accepted

Decision:

```text
Use free or lowest-cost models by default. Allow paid models only as bounded fallback for final generation, final critique, or outage recovery.
```

Context:

The hackathon rewards autonomous operation, editorial judgment, memory, rationale, and feed coherence. It does not require expensive model orchestration.

Reasoning:

Free-first routing protects budget and forces the implementation to filter candidates before spending model calls. A small paid fallback can improve reliability during the 48-hour evaluation if free providers are unavailable.

Consequences:

The LLM provider layer must support model routing, budget caps, usage logging, and graceful deferral when no acceptable free or budgeted model is available.

Related docs:

```text
08_LLM_STRATEGY.md
14_COST_AND_RESOURCE_BUDGET.md
17_IMPLEMENTATION_PLAN.md
18_HACKATHON_CHECKLIST.md
```


# 4. Open Risks

## R-001 — Scheduler Reliability

Risk:

The hosting platform may sleep, throttle background jobs, or fail to run long-lived workers.

Mitigation:

Use a durable runtime state table, idempotent cycles, expiring locks, and a platform-supported scheduler or external cron wake endpoint.

Submission check:

```text
[ ] prove at least two autonomous cycles after deployment
[ ] prove posts survive restart
[ ] prove feed does not trigger generation
```

---

## R-002 — Live Source Failure

Risk:

One discovery provider may be unavailable, rate-limited, blocked, or return low-quality results during judging.

Mitigation:

Use multiple source types where possible: RSS, official feeds, GitHub/releases, research feeds, and reputable technology reporting. Store source failures without blocking the feed.

Submission check:

```text
[ ] no single discovery source is mandatory
[ ] runtime handles timeout/error without crashing
```

---

## R-003 — Generic Content

Risk:

The system may satisfy the API but produce generic AI-news summaries that do not demonstrate editorial judgment.

Mitigation:

Require every published post to contain a clear thesis, why-now rationale, source list, and selection reason. Persist rejected candidates to prove selectivity.

Submission check:

```text
[ ] sample feed contains posts with distinct theses
[ ] rejection examples exist
[ ] repeated stories are not rewritten as new posts
```

---

## R-004 — Prompt Injection Through Sources

Risk:

Discovered webpages may contain text that tries to override system behavior.

Mitigation:

Treat all fetched content as untrusted evidence, isolate it in prompts, strip active content, validate structured model outputs, and reject instructions found inside source material.

Submission check:

```text
[ ] injection fixture tested
[ ] source content cannot change persona or policy
```

---

# 5. Assumptions To Validate

Before final submission, confirm:

```text
[ ] deployed base URL is public
[ ] POST /api/agent/init accepts the documented request
[ ] GET /api/agent/feed accepts the returned agentId
[ ] the database is persistent in production
[ ] the scheduler/worker runs after deploy
[ ] production secrets are configured
[ ] logs show autonomous cycles without manual post prompts
```

---

# 6. Demo Evidence Packet

Keep a short pre-submission evidence packet:

```text
[ ] deployed URL
[ ] init response with agentId
[ ] feed response at time T1
[ ] feed response at time T2 showing change
[ ] one runtime log excerpt showing discovery/judgment/publication
[ ] one rejected candidate example
[ ] one restart/persistence verification
[ ] one cost/usage snapshot
```

Do not include secrets in the evidence packet.

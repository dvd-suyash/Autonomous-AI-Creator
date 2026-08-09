# 04_AUTONOMOUS_STATE_MACHINE.md

## 1. Purpose

This document defines the state machine governing the autonomous behavior of **Second Order**.

The state machine determines:

- what the agent is doing,
- what state a piece of information is in,
- when transitions occur,
- what data must be persisted,
- what actions are allowed in each state,
- and how the system recovers from failures.

The state machine is a core architectural component.

It must not be replaced with an implicit prompt-driven workflow.

---

# 2. Core Principle

The agent should behave as a persistent editorial process.

A discovered topic is not immediately a post.

It progresses through explicit states:

```text
DISCOVERED
    ↓
NORMALIZED
    ↓
DEDUPLICATED
    ↓
SCREENED
    ↓
┌───────────┬──────────────┐
│           │              │
REJECTED  INVESTIGATING   APPROVED
             │              │
             ▼              │
          RESEARCHED        │
             │              │
             ▼              │
           ANALYZED         │
             │              │
             └──────┬───────┘
                    ▼
                 WRITING
                    │
                    ▼
                 CRITIQUE
                ┌───┴────┐
                │        │
             REJECTED  APPROVED
                           │
                           ▼
                       PUBLISHED
                           │
                           ▼
                    MEMORY_UPDATED
```

The exact implementation may combine some internal states for efficiency, but the logical lifecycle must remain intact.

---

# 3. Two Different State Machines

There are two related but distinct state machines.

## 3.1 Agent State

This describes the overall autonomous agent.

```text
UNINITIALIZED
      ↓
INITIALIZING
      ↓
ACTIVE
      ↓
PAUSED / DEGRADED
      ↓
ACTIVE
```

The normal production state is `ACTIVE`.

---

## 3.2 Candidate State

This describes the lifecycle of an individual discovered topic.

```text
DISCOVERED
      ↓
NORMALIZED
      ↓
DEDUPLICATED
      ↓
SCREENED
      ↓
REJECTED / INVESTIGATING / APPROVED
```

The candidate may then progress through research, analysis, writing, critique, and publication.

---

# 4. Agent Lifecycle

## 4.1 UNINITIALIZED

The agent does not yet exist.

Properties:

```text
agentId = absent
status = UNINITIALIZED
```

Allowed action:

```text
POST /api/agent/init
```

No autonomous work should occur before initialization.

---

# 5. INITIALIZING

Triggered by:

```http
POST /api/agent/init
```

During this state the system should:

1. validate the persona configuration,
2. create the agent record,
3. initialize persistent state,
4. create or load the persona configuration,
5. initialize required database structures,
6. establish scheduler readiness,
7. transition to `ACTIVE`.

Initialization should not generate a large batch of posts.

---

# 6. ACTIVE

This is the normal autonomous state.

The agent can:

- discover,
- evaluate,
- research,
- analyze,
- write,
- publish,
- update memory,
- and continue operating.

The scheduler periodically invokes autonomous cycles while the agent is active.

---

# 7. DEGRADED

The agent enters a degraded state when a significant dependency is temporarily unavailable.

Examples:

- LLM provider unavailable,
- database temporarily unavailable,
- source infrastructure unavailable,
- repeated runtime failures.

Degraded mode must not automatically mean permanent failure.

The system should:

1. record the failure,
2. preserve existing state,
3. retry according to policy,
4. return to `ACTIVE` when possible.

The agent should avoid destructive state transitions because of temporary failures.

---

# 8. PAUSED

A paused state may be used for explicit administrative control during development or testing.

The production evaluator should not need to pause the agent.

When paused:

- scheduled work should not generate new posts,
- existing feed data remains available,
- memory remains intact.

---

# 9. Candidate Lifecycle

Every discovered topic should become a candidate record.

Initial state:

```text
DISCOVERED
```

The candidate then progresses through the editorial pipeline.

---

# 10. DISCOVERED

A source adapter has found potentially relevant information.

Example:

```json
{
  "id": "candidate_123",
  "title": "New inference chip announced",
  "url": "https://example.com/...",
  "sector": "semiconductors",
  "discoveredAt": "...",
  "status": "DISCOVERED"
}
```

At this point:

- no publication decision has been made,
- the information may be incomplete,
- the source may be low quality,
- and the topic may be a duplicate.

Do not publish from this state.

---

# 11. NORMALIZED

The candidate has been converted into the application's canonical representation.

Normalization may include:

- canonical URL,
- normalized title,
- source metadata,
- publication timestamp,
- sector,
- content hash,
- extracted entities.

Transition:

```text
DISCOVERED → NORMALIZED
```

Failure:

```text
NORMALIZED_FAILURE
```

should be recorded without crashing the overall cycle.

---

# 12. DEDUPLICATED

The system checks whether the candidate is:

- an exact duplicate,
- a near duplicate,
- or semantically redundant with existing candidates or posts.

If it is an exact duplicate:

```text
DEDUPLICATED → REJECTED
```

with reason:

```text
DUPLICATE_SOURCE
```

If it is a semantic duplicate but may contain new information:

```text
DEDUPLICATED → SCREENED
```

The system should not automatically reject every related story.

A new development can justify a follow-up.

---

# 13. SCREENED

Screening is the first editorial filter.

The system evaluates inexpensive signals such as:

- source quality,
- freshness,
- sector relevance,
- obvious redundancy,
- obvious low importance,
- and basic novelty.

The goal is to eliminate obviously weak candidates before expensive reasoning.

Possible transitions:

```text
SCREENED → REJECTED
SCREENED → INVESTIGATING
SCREENED → APPROVED
```

`APPROVED` here means the candidate is sufficiently promising to proceed toward deeper analysis, not that publication is guaranteed.

---

# 14. REJECTED

A candidate enters `REJECTED` when it does not meet the editorial standard.

Possible reasons:

```text
LOW_IMPORTANCE
LOW_NOVELTY
WEAK_EVIDENCE
DUPLICATE
INSUFFICIENT_RELEVANCE
NO_ANALYTICAL_ANGLE
EXCESSIVE_SPECULATION
REDUNDANT_COVERAGE
LOW_READER_VALUE
PERSONA_MISMATCH
```

The rejection must be persisted.

Example:

```json
{
  "candidateId": "candidate_123",
  "status": "REJECTED",
  "reason": "LOW_ANALYTICAL_VALUE",
  "explanation": "The announcement is real but does not materially change the technology landscape."
}
```

Rejected candidates should not normally be processed again unless new evidence materially changes the situation.

---

# 15. INVESTIGATING

A candidate enters `INVESTIGATING` when it appears potentially important but requires additional evidence.

This is a critical state.

The agent should not be forced into premature publication.

Examples:

- a major technical claim lacks independent verification,
- a new technology appears significant but adoption evidence is absent,
- a trend is emerging but too early to establish significance,
- a company announcement requires technical validation.

While investigating, the system may:

- retrieve additional sources,
- inspect primary documentation,
- compare independent reports,
- examine historical context,
- compare with existing theses,
- and wait for additional evidence.

Possible outcomes:

```text
INVESTIGATING → REJECTED
INVESTIGATING → RESEARCHED
INVESTIGATING → WAITING
```

---

# 16. WAITING

A candidate may temporarily enter `WAITING` when additional evidence is expected but not yet available.

Examples:

- an announcement is incomplete,
- a technical paper has not yet been released,
- independent confirmation is pending,
- an event is developing rapidly.

A waiting candidate should not consume expensive inference on every cycle.

The scheduler should revisit it according to a configurable retry/revisit interval.

Possible transitions:

```text
WAITING → INVESTIGATING
WAITING → REJECTED
WAITING → RESEARCHED
```

---

# 17. RESEARCHED

A candidate enters `RESEARCHED` when sufficient supporting information has been collected.

The research object should include:

```text
primary sources
secondary sources
supporting evidence
contradicting evidence
important facts
relevant entities
related previous posts
related theses
research timestamp
```

Research does not automatically imply publication.

The candidate still requires analysis.

---

# 18. ANALYZED

The Analysis stage converts evidence into an editorial interpretation.

The system should determine:

- what happened,
- why it matters,
- why now,
- what changed,
- who gains,
- who loses,
- what becomes scarce,
- what second-order effects follow,
- and how the development relates to existing theses.

The output should include a thesis or analytical angle.

Example:

```json
{
  "candidateId": "candidate_123",
  "thesis": "Inference economics is becoming a stronger competitive variable than raw model size.",
  "confidence": 0.82,
  "implications": [
    "...",
    "...",
    "..."
  ]
}
```

---

# 19. EDITORIAL APPROVAL

After research and analysis, the system performs a deeper editorial decision.

Possible outcomes:

```text
ANALYZED → REJECTED
ANALYZED → WRITING
```

A candidate can be rejected at this stage even if it passed earlier filters.

This protects the system against the following failure:

> A story looked interesting initially but failed to produce a sufficiently meaningful insight after research.

---

# 20. WRITING

The candidate enters `WRITING` only after editorial approval.

The Writer receives:

```text
persona
worldview
editorial constitution
candidate
research
evidence
thesis
relevant memory
related posts
selected editorial format
```

The writer generates an original draft.

A draft is not yet a published post.

---

# 21. CRITIQUE

Every draft must pass a quality gate.

The Critic checks:

### Evidence

Are claims supported?

### Relevance

Does the post actually discuss something meaningful?

### Thesis

Is there a clear analytical point?

### Originality

Does it add value beyond summarization?

### Persona

Does it sound like Second Order?

### Redundancy

Is it too similar to previous posts?

### Tone

Is it appropriately confident without false certainty?

### Sources

Are the listed sources relevant?

Possible outcomes:

```text
CRITIQUE → APPROVED
CRITIQUE → REVISION
CRITIQUE → REJECTED
```

---

# 22. REVISION

A draft enters `REVISION` when the critic identifies correctable issues.

Examples:

- weak hook,
- unclear thesis,
- unsupported wording,
- unnecessary length,
- repetitive explanation,
- excessive certainty,
- weak connection to evidence.

The Writer may revise the draft.

Revision must be bounded.

Do not allow an infinite:

```text
write → critique → write → critique
```

loop.

Recommended maximum:

```text
MAX_REVISIONS = configurable
```

After exceeding the limit:

```text
REVISION → REJECTED
```

unless explicitly configured otherwise.

---

# 23. APPROVED

A draft enters `APPROVED` only after passing the quality gate.

At this stage:

- the post text exists,
- rationale exists,
- sources exist,
- candidate and thesis are linked,
- and the post is ready for persistence.

---

# 24. PUBLISHED

Publication means the canonical post has been successfully persisted.

Required fields:

```text
id
agentId
createdAt
text
rationale
sources
candidateId
thesisId
```

Publication should use an idempotent mechanism.

A retry must not create two posts from the same candidate.

---

# 25. MEMORY_UPDATED

After successful publication, the system updates memory.

This includes:

- episodic memory,
- editorial memory,
- semantic/thesis memory,
- entity relationships,
- and relevant candidate state.

The system should record:

```text
what was published
why it was published
what thesis it represented
what sources supported it
what entities were involved
```

Only after the canonical post is safely persisted should it be considered fully published.

---

# 26. Candidate Terminal States

The normal terminal states are:

```text
REJECTED
PUBLISHED
```

A candidate may also remain:

```text
WAITING
```

for an extended period if evidence is incomplete.

Terminal states should not normally be reprocessed.

---

# 27. State Transition Rules

The following transitions should be considered authoritative:

```text
DISCOVERED
   ↓
NORMALIZED
   ↓
DEDUPLICATED
   ↓
SCREENED
   ├──→ REJECTED
   ├──→ INVESTIGATING
   └──→ APPROVED

INVESTIGATING
   ├──→ WAITING
   ├──→ REJECTED
   └──→ RESEARCHED

WAITING
   ├──→ INVESTIGATING
   ├──→ REJECTED
   └──→ RESEARCHED

RESEARCHED
   ↓
ANALYZED
   ├──→ REJECTED
   └──→ WRITING

WRITING
   ↓
CRITIQUE
   ├──→ REVISION
   ├──→ REJECTED
   └──→ APPROVED

REVISION
   ↓
WRITING

APPROVED
   ↓
PUBLISHED
   ↓
MEMORY_UPDATED
```

---

# 28. Invalid Transitions

The implementation must prevent invalid state jumps.

Examples:

```text
DISCOVERED → PUBLISHED
```

is invalid.

```text
REJECTED → PUBLISHED
```

is invalid unless the candidate is explicitly reopened following new evidence.

```text
DISCOVERED → WRITING
```

is invalid.

```text
WAITING → PUBLISHED
```

is invalid without renewed research and analysis.

These restrictions ensure editorial logic cannot accidentally be bypassed.

---

# 29. Reopening a Rejected Candidate

A rejected candidate may be reopened if genuinely new information appears.

For example:

```text
REJECTED
   │
   │ new evidence
   ▼
REOPENED
   │
   ▼
INVESTIGATING
```

The system should not reopen candidates simply because a scheduler cycle occurred.

A reopening event should be based on meaningful new information.

---

# 30. Agent Autonomous Cycle

The scheduled runtime should not process every candidate through every state during every invocation.

Instead:

```text
1. Acquire runtime lock.

2. Load agent state.

3. Discover new sources.

4. Create candidate records.

5. Process a bounded number of candidates.

6. Advance candidates that are ready.

7. Perform deeper analysis only for high-value candidates.

8. Publish approved drafts.

9. Update memory.

10. Persist runtime state.

11. Release lock.
```

This keeps each invocation bounded.

---

# 31. Candidate Priority

When multiple candidates are waiting to be processed, prioritize according to:

1. editorial importance,
2. freshness,
3. evidence quality,
4. second-order potential,
5. relevance to active theses,
6. time sensitivity.

A breaking security event may therefore receive priority over a generic product announcement.

---

# 32. Time-Sensitive Candidates

Some topics decay rapidly.

Examples:

- security vulnerabilities,
- major product launches,
- market-moving announcements,
- regulatory decisions,
- outages,
- major research releases.

The system may assign:

```text
urgency = HIGH | MEDIUM | LOW
```

High-urgency candidates should receive faster processing.

---

# 33. Candidate Expiration

Candidates can become stale.

For example:

```text
A minor product announcement
```

may no longer justify publication several days later.

The system should support expiration.

Possible state:

```text
EXPIRED
```

or:

```text
REJECTED(reason = STALE)
```

Do not allow old low-value candidates to consume the agent's attention indefinitely.

---

# 34. Autonomous Scheduling and State

The scheduler should use persisted state to determine what work is needed.

Example:

```text
lastDiscoveryAt
lastEditorialRunAt
lastResearchAt
lastPublicationAt
```

The agent should not assume that every scheduled invocation successfully completed the previous one.

This allows recovery from:

- missed cron events,
- Worker restarts,
- temporary provider failures,
- deployments,
- and execution interruptions.

---

# 35. Failure State Handling

Failures should not destroy candidate state.

For example:

```text
RESEARCHING
    ↓
LLM TIMEOUT
    ↓
RESEARCH_RETRY_PENDING
```

rather than:

```text
RESEARCHING
    ↓
DELETE CANDIDATE
```

Failures should be persisted where useful.

A candidate should be retryable without duplicating earlier work.

---

# 36. Retry Policy

Retries should be bounded.

For transient failures:

```text
attempt 1
   ↓
short delay
   ↓
attempt 2
   ↓
longer delay
   ↓
attempt 3
   ↓
defer / fallback
```

Use exponential backoff where appropriate.

Do not retry indefinitely.

---

# 37. Idempotent Publication

Publication must be protected by a unique constraint.

Conceptually:

```text
candidateId + publication_type
```

should be unique.

If the runtime crashes immediately after publication and retries, the database should prevent a duplicate canonical post.

---

# 38. Feed Independence

The state machine must operate independently from feed retrieval.

The evaluator may call:

```text
GET /api/agent/feed
```

at any time.

This must not:

- advance candidate states,
- invoke the LLM,
- discover sources,
- publish posts,
- or mutate editorial state.

It simply reads the published state.

---

# 39. Example Lifecycle

Consider:

> “A major chip manufacturer releases a new inference accelerator.”

### Step 1

Discovery finds the announcement.

```text
DISCOVERED
```

### Step 2

Source is normalized.

```text
NORMALIZED
```

### Step 3

No exact duplicate is found.

```text
DEDUPLICATED
```

### Step 4

Initial screening determines it may materially affect inference economics.

```text
SCREENED → INVESTIGATING
```

### Step 5

The system finds:

- official technical documentation,
- benchmark details,
- pricing,
- independent analysis.

```text
RESEARCHED
```

### Step 6

The agent determines:

> The important story is not raw performance. The change is in inference economics.

```text
ANALYZED
```

### Step 7

Editorial review approves the angle.

```text
WRITING
```

### Step 8

Writer generates a thesis-first post.

```text
CRITIQUE
```

### Step 9

Critic approves.

```text
APPROVED
```

### Step 10

Post is stored.

```text
PUBLISHED
```

### Step 11

The system updates the inference-economics thesis.

```text
MEMORY_UPDATED
```

Future stories can now reference this thesis.

---

# 40. Example Rejection Lifecycle

Consider:

> “Startup X announces another AI productivity feature.”

Discovery:

```text
DISCOVERED
```

Normalization:

```text
NORMALIZED
```

Deduplication:

```text
DEDUPLICATED
```

Screening:

```text
SCREENED
```

Editorial evaluation:

```text
importance = low
novelty = low
second_order = weak
```

Decision:

```text
REJECTED
```

Reason:

> The announcement does not materially change the technology landscape and does not provide a meaningful analytical angle.

The rejection is persisted.

The system should not repeatedly reconsider the same announcement.

---

# 41. Example Waiting Lifecycle

Consider:

> A company claims a major breakthrough but provides no technical details.

Initial:

```text
DISCOVERED
→ NORMALIZED
→ SCREENED
→ INVESTIGATING
```

Research finds insufficient evidence.

```text
WAITING
```

Later, the company releases technical documentation.

The new source triggers reconsideration:

```text
WAITING
→ INVESTIGATING
→ RESEARCHED
→ ANALYZED
```

The system can then decide whether publication is justified.

---

# 42. State Persistence Requirements

Every meaningful state transition should be recoverable.

At minimum, persist:

```text
candidateId
previousState
newState
timestamp
reason
metadata
```

A state history is valuable for debugging and evaluation.

It also makes the autonomous process inspectable.

---

# 43. State History

Maintain a transition log where practical.

Example:

```json
{
  "candidateId": "candidate_123",
  "from": "INVESTIGATING",
  "to": "RESEARCHED",
  "reason": "Primary technical documentation found.",
  "timestamp": "2026-08-08T10:30:00Z"
}
```

This is not required in the external API, but it should be available internally.

---

# 44. Relationship to Editorial Constitution

The state machine implements the editorial constitution.

The constitution defines:

> what good judgment means.

The state machine defines:

> when and how that judgment is operationalized.

Do not allow implementation convenience to bypass editorial states.

---

# 45. Relationship to Memory

The state machine and memory are tightly connected.

Memory should influence transitions.

Examples:

```text
Previously published similar story
→ higher redundancy
→ likely REJECT
```

```text
Existing thesis strongly related
→ higher analytical value
→ INVESTIGATE
```

```text
Previous thesis contradicted
→ high importance
→ ANALYZED / UPDATE
```

The state machine therefore becomes progressively more intelligent as memory grows.

---

# 46. Relationship to the LLM

The LLM may recommend transitions, but application code must enforce them.

For example:

The LLM may output:

```json
{
  "decision": "PUBLISH"
}
```

The application must still verify:

- required evidence exists,
- required sources exist,
- candidate is in a valid state,
- publication thresholds are met,
- and no duplicate publication exists.

The LLM should never have unrestricted authority to mutate the system.

---

# 47. State Machine as a Safety Boundary

The state machine is also a guardrail.

It prevents:

- premature publication,
- accidental duplicate publication,
- unsupported stories,
- repeated processing,
- infinite loops,
- and corrupted agent state.

The LLM proposes.

The application validates.

The database persists.

---

# 48. Minimum Implementation Requirement

At minimum, the implementation must support:

```text
Agent:
UNINITIALIZED
INITIALIZING
ACTIVE
DEGRADED

Candidate:
DISCOVERED
NORMALIZED
DEDUPLICATED
SCREENED
INVESTIGATING
WAITING
RESEARCHED
ANALYZED
WRITING
CRITIQUE
REVISION
APPROVED
REJECTED
PUBLISHED
MEMORY_UPDATED
```

Some states may be represented as database status values, workflow records, or internal enums.

The exact implementation is flexible.

The logical behavior is not.

---

# 49. Non-Goals

The state machine does not need:

- distributed workflow orchestration,
- Kafka,
- Temporal,
- Celery,
- a separate microservice per state,
- multiple autonomous LLM agents,
- or a complex workflow engine.

For this hackathon, a well-designed state machine implemented inside the Worker runtime and persisted in D1 is sufficient.

---

# 50. Final State-Machine Principle

The most important rule is:

> **The agent should never jump directly from information discovery to publication.**

Every meaningful publication should pass through:

```text
Evidence
   ↓
Judgment
   ↓
Analysis
   ↓
Writing
   ↓
Critique
   ↓
Publication
   ↓
Memory
```

This is what turns Second Order from an automated content generator into an autonomous editorial intelligence system.
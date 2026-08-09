# 09_CONTENT_GENERATION.md

# Second Order — Content Generation System

## 1. Purpose

This document defines how **Second Order** transforms an editorially approved technology insight into a final publishable post.

Content generation is deliberately separated from:

- discovery,
- research,
- editorial judgment,
- memory,
- and publication.

The Writer does not decide whether something deserves to exist.

The Editorial Engine has already made that decision.

The Writer's responsibility is:

> **Turn a validated insight into clear, original, memorable technology commentary in the Second Order voice.**

---

# 2. Core Principle

The content pipeline follows:

```text id="u4sl8n"
DISCOVERY
    ↓
RESEARCH
    ↓
EDITORIAL JUDGMENT
    ↓
APPROVED THESIS
    ↓
CONTENT BRIEF
    ↓
DRAFT
    ↓
FACT CHECK
    ↓
CRITIQUE
    ↓
REVISION
    ↓
FINAL VALIDATION
    ↓
PUBLISHED POST
```

The system should never skip directly from:

```text id="4j9m9r"
SOURCE → POST
```

---

# 3. Content Philosophy

Second Order should not produce:

> "Here are five things you need to know about today's AI news."

It should produce:

> **"Here is what happened, what everyone is missing about it, and why the implication matters."**

The content should feel like the output of a person who:

- pays attention,
- has opinions,
- remembers previous arguments,
- understands technology,
- notices incentives,
- and is willing to reject weak narratives.

---

# 4. Content Objective

Every post should ideally accomplish at least one of the following:

```text id="d7d09w"
Explain something important
Challenge a common assumption
Connect two developments
Reveal a second-order effect
Update a previous thesis
Identify an emerging trend
Expose an overlooked constraint
Explain a technological tradeoff
```

If the post does none of these, it probably should not exist.

---

# 5. The Content Brief

Before writing, the system should create a structured **Content Brief**.

The brief is the bridge between editorial reasoning and writing.

Example:

```json id="9l6q2m"
{
  "candidateId": "candidate_123",
  "thesis": "Inference economics is becoming a stronger competitive variable than raw model size.",
  "whyNow": "New pricing and benchmark evidence appeared today.",
  "keyFacts": [],
  "keyEvidence": [],
  "implications": [],
  "counterarguments": [],
  "relevantMemory": [],
  "format": "THESIS_POST",
  "targetLength": "MEDIUM",
  "confidence": 0.84
}
```

The writer should write from the brief rather than rediscovering the story.

---

# 6. Content Brief Requirements

Every brief should contain:

```text id="h7t9qz"
Core thesis
Why now
Verified facts
Evidence
Important implications
Relevant memory
Potential counterargument
Chosen format
Confidence
Source references
```

Optional:

```text id="8h7y1m"
hook direction
analogy
historical context
previous post reference
```

---

# 7. One Post, One Core Idea

A post should generally have:

> **one dominant thesis.**

It may contain several supporting observations.

Avoid trying to say:

```text id="1j0xwm"
AI models
+
chips
+
robots
+
cybersecurity
+
open source
+
regulation
```

in one post unless they form a coherent argument.

---

# 8. Thesis Hierarchy

The writer should understand:

### Topic

What happened?

### Thesis

What does it mean?

### Implication

Why does that meaning matter?

Example:

```text id="72i4od"
TOPIC:
Cloud provider cuts inference pricing.

THESIS:
Inference economics is becoming a competitive weapon.

IMPLICATION:
Model capability alone may become less important as inference becomes commoditized.
```

The final post should emphasize the thesis, not merely the topic.

---

# 9. Content Structure

A strong default structure is:

```text id="q7b8v0"
HOOK
  ↓
WHAT HAPPENED
  ↓
WHY IT MATTERS
  ↓
SECOND-ORDER EFFECT
  ↓
CONCLUSION
```

Not every post must use all five sections explicitly.

The structure should remain invisible to the reader.

---

# 10. Hook

The opening should create immediate intellectual tension.

Good hooks often:

- challenge an assumption,
- state a surprising implication,
- identify an overlooked detail,
- compress the thesis,
- or create a useful contrast.

Examples of patterns:

> The interesting part isn't the model. It's the price.

> AI's next bottleneck may not be compute.

> Everyone is watching the benchmark. The business is happening somewhere else.

> This looks like a product launch. It is actually a distribution move.

These are patterns, not fixed phrases.

---

# 11. Avoid Clickbait Hooks

Do not use:

> "You won't believe what happened next."

or:

> "This changes EVERYTHING."

or:

> "The future of AI is here!!!"

The persona should create curiosity through insight, not manufactured excitement.

---

# 12. Hook-Test

Before finalizing a hook, ask:

> **Does this hook contain an actual idea?**

If the hook could be attached to almost any technology story, it is probably generic.

---

# 13. Thesis Statement

The thesis should appear early.

The reader should understand the author's position without reading 500 words first.

The thesis can be:

- explicit,
- implied through a strong opening,
- or revealed through contrast.

But the argument should remain clear.

---

# 14. Evidence Integration

Evidence should support the thesis naturally.

Do not dump facts into a paragraph.

Bad:

```text id="n7c0tp"
Company X released model Y.
It has Z parameters.
It achieved benchmark A.
It costs B.
It launched on date C.
```

Better:

```text id="e1c6xm"
The relevant change isn't model size. It is the fact that the same workload can now be served at materially lower cost.
```

Then provide the evidence that establishes that claim.

---

# 15. Fact Density

Posts should be evidence-rich without becoming technical reports.

Aim for:

```text id="5kym6p"
high signal
low filler
```

Every sentence should ideally perform one of these functions:

- establish fact,
- explain mechanism,
- develop thesis,
- provide context,
- introduce implication,
- or sharpen the conclusion.

---

# 16. Sentence-Level Discipline

Avoid sentences that merely restate previous sentences.

Example:

```text id="j02b7h"
AI is changing quickly.
The AI industry is moving fast.
There are many changes happening in AI.
```

These say almost nothing.

Replace them with:

> The bottleneck is moving from model capability to deployment economics.

---

# 17. Analytical Compression

The goal is not to include every fact discovered.

The writer should compress research into the smallest amount of prose that preserves the important reasoning.

Conceptually:

```text id="9r0n7m"
100 facts discovered
      ↓
10 relevant facts
      ↓
3 facts required for argument
      ↓
1 clear thesis
```

---

# 18. Second-Order Reasoning in Content

Where supported by evidence, the post should move beyond:

```text id="jj1l1q"
Event
```

toward:

```text id="pl8nuw"
Event
→ immediate consequence
→ strategic consequence
```

For example:

> Lower inference costs don't just make AI cheaper. They make more AI-native software economically viable.

That is stronger than simply reporting the price reduction.

---

# 19. Do Not Force Second-Order Effects

The persona is called Second Order because it looks for consequences.

That does not mean every post needs an elaborate chain of speculation.

If the evidence only supports:

> X happened and it matters because Y.

stop there.

A precise first-order observation is better than an invented fifth-order consequence.

---

# 20. Counterarguments

For significant posts, consider whether there is a credible counterargument.

Example:

```text id="s3wqj0"
THESIS:
Inference costs will become a major competitive variable.

COUNTERARGUMENT:
Frontier workloads may remain compute-intensive enough that cost reductions do not eliminate the capability moat.
```

The writer may include the counterargument when it improves intellectual honesty.

---

# 21. Counterargument Placement

Do not automatically add:

> "However, there are some caveats..."

to every post.

Instead, incorporate counterarguments naturally:

> The caveat is that frontier workloads remain expensive, so this does not eliminate the compute moat—it changes where that moat matters.

---

# 22. Confidence Calibration

Language should reflect evidence strength.

### High confidence

> "The evidence indicates..."

### Moderate confidence

> "This suggests..."

### Low confidence

> "One possibility is..."

Avoid presenting speculative conclusions as established facts.

---

# 23. Distinguishing Facts and Opinions

The writer should make it clear when a sentence is:

```text id="1sx2mv"
fact
```

versus:

```text id="6q8dr2"
interpretation
```

Example:

> NVIDIA introduced X.

Fact.

> The more important implication is that inference is becoming a hardware optimization problem.

Interpretation.

This distinction creates credibility.

---

# 24. Voice

The Second Order voice should combine:

```text id="k9h0rx"
Thesis discipline
+
technical credibility
+
strategic thinking
+
clear packaging
+
occasional wit
+
intellectual curiosity
```

The voice should feel:

- confident,
- analytical,
- curious,
- slightly irreverent,
- informed,
- and human.

---

# 25. Voice Must Not Become a Costume

Do not force:

- jokes,
- metaphors,
- sarcasm,
- contrarian statements,
- or clever endings.

Personality should emerge naturally from the insight.

---

# 26. Originality

Content must be original.

The system may use external information as evidence.

It must not copy:

- source wording,
- article structure,
- creator posts,
- distinctive phrases,
- or recognizable formulations.

The objective is independent synthesis.

---

# 27. Creator-Inspired Techniques

The writing system may use high-level techniques inspired by studied creators.

### Thesis discipline

Start with the argument.

### Evidence density

Use specifics.

### Strong packaging

Make the insight easy to understand.

### Narrative energy

Move the reader through an idea.

But the resulting prose must be Second Order's own.

---

# 28. Content Formats

The generator should support multiple formats.

Recommended formats:

```text id="a2l68n"
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

# 29. THESIS_POST

Use when:

> One strong idea can explain the importance of an event.

Structure:

```text id="m29vqp"
Hook
Thesis
Evidence
Implication
Closing
```

---

# 30. ANALYSIS

Use when:

> A development requires context and several connected observations.

Structure:

```text id="yq6l3a"
What happened
Why it happened
What changes
Who benefits
What to watch
```

---

# 31. BREAKDOWN

Use when:

> The reader needs a structured explanation.

Possible format:

```text id="g4s1af"
1. What changed
2. Why it matters
3. What most people miss
4. What happens next
```

Do not use numbered lists merely for stylistic decoration.

---

# 32. FOLLOW_UP

Use when:

> A new development meaningfully updates something previously discussed.

Structure:

```text id="f1sl9y"
Previous thesis
↓
New evidence
↓
What changed
↓
Updated conclusion
```

This format is particularly valuable for demonstrating memory.

---

# 33. CONTRARIAN_TAKE

Use when:

> The dominant interpretation appears incomplete or wrong.

Structure:

```text id="9e3z6c"
Consensus
↓
Problem with consensus
↓
Evidence
↓
Alternative interpretation
```

Contrarianism must be evidence-driven.

---

# 34. TREND_ANALYSIS

Use when:

> Several separate developments point toward the same structural change.

Structure:

```text id="m6r3tv"
Signal 1
Signal 2
Signal 3
↓
Underlying pattern
↓
Why it matters
```

---

# 35. TECHNICAL_EXPLANATION

Use when:

> The technology itself is difficult to understand.

The post should answer:

```text id="4ivd6o"
What is it?
How does it work?
Why is it different?
What constraint does it remove?
What new constraint does it create?
```

---

# 36. STRATEGIC_ANALYSIS

Use when:

> The important issue is competitive positioning.

Consider:

- incentives,
- moat,
- distribution,
- ecosystem,
- pricing,
- switching costs,
- dependencies,
- and leverage.

---

# 37. PREDICTION

Use sparingly.

A prediction should emerge from evidence.

Structure:

```text id="1n3h1m"
Observed change
↓
Reasoning
↓
Prediction
↓
What would prove/disprove it
```

This creates accountability.

---

# 38. THESIS_UPDATE

Use when:

> New evidence materially changes a previous view.

This is one of the highest-value formats for the autonomous system.

It demonstrates:

- memory,
- continuity,
- intellectual honesty,
- and evolving reasoning.

---

# 39. Content Length

Length should depend on complexity.

Conceptual ranges:

```text id="b6a0b6"
SHORT:
50–120 words

MEDIUM:
120–250 words

DEEP:
250–500+ words
```

These are guidelines, not hard requirements.

A simple idea should not be inflated to 500 words.

---

# 40. Social Feed Optimization

The post should be readable in a feed.

Use:

- short paragraphs,
- whitespace,
- clear transitions,
- occasional bullets,
- strong first lines.

Avoid giant text walls.

---

# 41. Thread Support

The internal content architecture may eventually support threads.

For the hackathon, this is optional.

The canonical memory object should still represent the underlying idea rather than platform-specific formatting.

---

# 42. Platform Independence

The content generator should produce platform-neutral canonical content.

Conceptually:

```text id="a7l6b0"
CORE IDEA
    ↓
CANONICAL POST
    ↓
X formatter
LinkedIn formatter
Other formatter
```

Real X or LinkedIn publishing is not required for the hackathon.

---

# 43. Canonical Content Object

The internal content object should resemble:

```json id="3x8ydo"
{
  "postId": "post_123",
  "candidateId": "candidate_456",
  "thesisId": "thesis_789",
  "format": "THESIS_POST",
  "hook": "...",
  "body": "...",
  "rationale": "...",
  "sources": [],
  "confidence": 0.86
}
```

---

# 44. Rationale Generation

The rationale is not simply a description of the post.

It should explain the editorial decision.

It must answer:

```text id="0kjx2a"
Why was this selected?
Why now?
Why this angle?
```

The rationale should be concise but substantive.

---

# 45. Example Rationale

Weak:

> This is an important AI development.

Strong:

> Selected because the pricing change provides evidence that inference economics is becoming a competitive variable. It is timely because the new pricing follows a major hardware efficiency improvement, and it offers a more structural angle than the competing model-launch stories discovered this cycle.

---

# 46. Source Attachment

Every content object must maintain source references.

Prefer source IDs internally:

```text id="k0k6r2"
source_123
source_456
```

The API layer can resolve them to:

```text id="7u0t9m"
https://...
```

---

# 47. Source-to-Claim Mapping

For high-value content, maintain an internal mapping:

```text id="aqw0a3"
Claim A → Source 1
Claim B → Source 2
Claim C → Source 1 + Source 3
```

This is useful for fact checking.

---

# 48. Content Generation Pipeline

The detailed pipeline is:

```text id="c4od2e"
1. Load approved candidate
2. Load editorial decision
3. Load thesis
4. Retrieve relevant memory
5. Build content brief
6. Select format
7. Generate hook
8. Generate draft
9. Validate factual claims
10. Run critic
11. Revise if needed
12. Run final validation
13. Persist canonical post
14. Update memory
```

---

# 49. Hook Generation

The system may generate several candidate hooks internally.

Example:

```text id="f0m4k9"
Hook A:
The interesting part isn't the model. It's the price.

Hook B:
The AI race may be becoming an infrastructure race.

Hook C:
The benchmark is impressive. The economics are more interesting.
```

The editorial/writer model can select the strongest one.

Do not publish all three.

---

# 50. Hook Selection Criteria

Prefer hooks that are:

- specific,
- truthful,
- connected to the thesis,
- concise,
- intellectually interesting.

Avoid hooks that are:

- sensational,
- generic,
- misleading,
- or disconnected from the evidence.

---

# 51. Draft Generation

The writer receives:

```text id="fddo7s"
persona
worldview
content brief
evidence
memory
format
length target
```

The writer should not receive unrestricted access to the entire source corpus.

---

# 52. Draft Constraints

The writer must:

```text id="r4v5ul"
use only supplied factual evidence
preserve factual meaning
not invent statistics
not invent quotes
not invent sources
not misrepresent uncertainty
maintain persona
follow chosen format
```

---

# 53. Draft Post-Processing

After generation, application code should perform:

- whitespace normalization,
- length checks,
- malformed output checks,
- source validation,
- required field checks.

Do not use application code to rewrite the meaning.

---

# 54. Factual Validation

The system should identify factual claims where practical.

For example:

```text id="0zq8z9"
Claim:
"Company X reduced API pricing by 40%."

Check:
Does the supplied source actually establish this?
```

If not:

```text id="7p2p1n"
revise or remove
```

---

# 55. Numerical Claims

Numbers require special caution.

Validate:

- percentages,
- prices,
- dates,
- benchmarks,
- model sizes,
- user counts,
- revenue figures,
- funding amounts.

A single incorrect number can undermine an otherwise strong post.

---

# 56. Quotes

Do not invent quotes.

If the post uses a quote:

- it must come from a source,
- wording must be preserved accurately,
- and the source must be retained.

For the MVP, paraphrasing is generally safer than unnecessary direct quotation.

---

# 57. Benchmarks

Benchmark claims should include context where relevant.

For example:

> "Model X is 30% faster."

may be incomplete.

The system should consider:

- workload,
- hardware,
- metric,
- comparison baseline,
- and methodology.

Avoid treating benchmarks as universal truth.

---

# 58. Marketing Claims

Company marketing statements should be attributed appropriately.

Distinguish:

> "Company X says..."

from:

> "Company X achieved..."

unless independent evidence supports the latter.

---

# 59. Uncertainty Language

Useful phrases include:

> "The evidence suggests..."

> "So far, the stronger signal is..."

> "If the benchmark holds outside the lab..."

> "The more interesting possibility is..."

These allow analytical writing without pretending certainty.

---

# 60. Avoid Excessive Hedging

The opposite failure is writing:

> "It might perhaps potentially possibly suggest..."

The persona should remain decisive where evidence allows.

Calibrated confidence is the goal.

---

# 61. Editorial Personality

Personality can appear through:

- sharp contrasts,
- concise observations,
- unexpected analogies,
- understated humor,
- cultural references,
- and memorable phrasing.

But personality should never obscure the argument.

---

# 62. Humor

Humor is optional.

Use it when:

- the situation naturally invites it,
- it sharpens the point,
- or it creates memorable framing.

Avoid jokes when discussing:

- serious security incidents,
- major harm,
- sensitive events,
- or uncertain technical claims.

---

# 63. Analogies

Analogies can simplify technical ideas.

Good analogy:

> "The model is becoming electricity; the scarce resource is increasingly the machinery around it."

But analogies should be clearly illustrative.

Do not let them replace technical accuracy.

---

# 64. Metaphor Discipline

Do not overload posts with metaphors.

One strong metaphor is better than five.

---

# 65. Closing

The final line should ideally:

- sharpen the implication,
- leave a memorable thought,
- or identify what to watch next.

Avoid generic closings such as:

> "The future is exciting."

---

# 66. Strong Closing Patterns

Possible patterns:

> The interesting question is no longer whether this works. It is who gets to own the bottleneck.

> The model may be the headline. The economics are the story.

> The next advantage may belong less to whoever has the smartest model and more to whoever can deploy it cheapest.

These are patterns, not reusable templates.

---

# 67. Avoid Template Fatigue

The generator must not repeatedly produce:

```text id="4s0b9c"
Hook
"Here's the thing..."
"More importantly..."
"The bottom line..."
```

Repeated structural phrases will make the persona feel synthetic.

Track recurring phrases where practical.

---

# 68. Phrase Diversity

The system may maintain a small list of recently used:

- opening patterns,
- transitions,
- closing patterns.

If the same phrase appears repeatedly, the writer should be encouraged to vary it.

---

# 69. No Artificial Quirks

Do not force a signature phrase into every post.

A recognizable voice should emerge from:

- worldview,
- reasoning,
- vocabulary,
- and editorial instincts.

Not gimmicks.

---

# 70. Memory Integration During Writing

Before generating the final post, retrieve:

```text id="0r6iqd"
recent related posts
relevant old posts
active thesis
previous thesis version
previous rejection if relevant
important entities
```

The writer can then produce continuity.

---

# 71. Follow-Up Writing

If a new post updates a previous thesis, the writer should know:

```text id="4d6e6k"
what was previously said
what new evidence appeared
what changed
```

Example:

> Two days ago, we argued X. New evidence makes that view too broad.

This is highly valuable for demonstrating autonomous memory.

---

# 72. Avoid Fake Continuity

Do not mention previous posts merely to prove memory.

If the previous post is not relevant:

```text id="0s6a2g"
do not reference it
```

Memory should influence reasoning even when it remains invisible.

---

# 73. Content Similarity Check

Before final publication, compare the draft against recent posts.

Possible signals:

- semantic similarity,
- repeated thesis,
- repeated hook,
- repeated phrasing.

High similarity should trigger:

```text id="5nyj6q"
revision
```

or:

```text id="yn5j72"
rejection
```

depending on whether new information exists.

---

# 74. Semantic Duplicate Example

Previous:

> Lower inference costs will make AI applications cheaper.

New draft:

> Falling inference prices mean AI apps will become less expensive.

These are effectively the same idea.

Unless new evidence changes the argument:

```text id="jv9y4w"
REJECT / REFRAME
```

---

# 75. Meaningful Continuation Example

Previous:

> Lower inference costs may make AI applications cheaper.

New evidence:

> Developers are now changing architecture because local inference has become economically viable.

This is not merely repetition.

It is:

```text id="v0q1dn"
new evidence
+
new implication
```

Publishable.

---

# 76. Publication Gate

Before final persistence, run:

```text id="v1v6j7"
CONTENT VALIDATION
```

Checklist:

```text id="y4j6v5"
✓ approved candidate
✓ valid thesis
✓ evidence available
✓ source URLs valid
✓ factual claims grounded
✓ rationale generated
✓ why-now explanation
✓ persona consistent
✓ no duplicate
✓ no prohibited content
✓ no hallucinated sources
✓ unique post ID
✓ valid timestamp
```

---

# 77. Post Object

The canonical post should contain at least:

```json id="3xsyhf"
{
  "id": "p7",
  "createdAt": "2026-08-08T10:30:00Z",
  "text": "...",
  "rationale": "...",
  "sources": [
    "https://..."
  ]
}
```

Internally, additional metadata should be retained.

---

# 78. Internal Post Metadata

Recommended:

```text id="1i9b2q"
candidateId
thesisId
format
editorialScore
confidence
model
promptVersion
revisionCount
sourceIds
createdAt
```

Only the required fields need to be exposed by the public feed API.

---

# 79. Publication Atomicity

Publishing should be atomic.

The system should avoid:

```text id="cgrw5g"
post saved
but memory missing
```

or:

```text id="0htrzv"
memory saved
but post missing
```

where possible.

The database transaction should persist the canonical post and essential relationships together.

---

# 80. Memory Update After Publication

After successful publication:

```text id="d6ct4g"
post
 ↓
episodic memory
 ↓
thesis evidence
 ↓
entity updates
 ↓
relationship updates
```

This is part of content generation's completion state.

---

# 81. Content Generation Failure

If writing fails:

```text id="1e3z5b"
candidate remains approved
```

or returns to:

```text id="5i5q7x"
WRITING
```

with retry metadata.

Do not lose the editorial decision.

---

# 82. Critique Failure

If critique fails:

```text id="4w9xg1"
do not publish
```

Retry or defer.

A missing critic should not silently become permission to publish.

---

# 83. Revision Failure

If the maximum revision count is exceeded:

```text id="7ph6cq"
REJECT
```

The system should preserve the reason.

---

# 84. Content Generation Cost

Track:

```text id="u3m0o7"
draft calls
critic calls
revision calls
tokens
cost
```

The system should optimize for:

> high-quality posts per unit of inference cost.

---

# 85. Content Generation Latency

The pipeline should remain bounded.

Avoid:

```text id="xj2d7j"
research for 20 minutes
→ write
→ critique
→ rewrite
→ rewrite
```

Instead use bounded research and revision.

---

# 86. Maximum Generation Attempts

Recommended configuration:

```text id="4v6h08"
MAX_DRAFT_ATTEMPTS = 2
MAX_CRITIQUE_ATTEMPTS = 1
MAX_REVISIONS = 2
```

These are starting values.

---

# 87. Content Generation and Autonomous Scheduling

The generator should be invoked only when an approved candidate exists.

The scheduler should not say:

> "Generate a post."

It should say:

> "Advance candidates according to the state machine."

This keeps generation subordinate to editorial judgment.

---

# 88. Content Generation and Feed Timing

Posts should appear at the time they are actually generated and published.

Do not pre-generate 48 hours of posts at initialization.

That would violate the spirit of autonomous operation.

---

# 89. No Batch Generation

Avoid:

```text id="r0r5l8"
Initialization
 ↓
generate 50 posts
 ↓
schedule them
```

The agent should genuinely discover and reason over information during the evaluation period.

---

# 90. Content Freshness

A draft can become stale while waiting for publication.

Before publication, verify:

```text id="t9v6mz"
Is the underlying story still current?

Did new information appear?

Did the thesis change?

Is the draft now misleading?
```

If necessary:

```text id="0j1o8h"
re-research
```

or:

```text id="a3u5w1"
discard draft
```

---

# 91. Breaking News

For rapidly changing stories:

```text id="j7xw48"
draft
 ↓
new evidence
 ↓
invalidate draft
 ↓
re-research
```

Do not publish stale conclusions simply because a draft already exists.

---

# 92. Evergreen Analysis

Some posts may remain useful after the immediate event.

Examples:

- architectural shifts,
- long-term infrastructure trends,
- fundamental technology economics.

These can be published later if the analysis remains relevant.

---

# 93. Content Lifecycle

The complete lifecycle is:

```text id="m8k3sq"
APPROVED
   ↓
CONTENT BRIEF
   ↓
DRAFT
   ↓
FACT CHECK
   ↓
CRITIQUE
   ↓
REVISION
   ↓
FINAL VALIDATION
   ↓
PUBLISHED
   ↓
MEMORY
```

---

# 94. Content Quality Rubric

Evaluate each final post on:

### 1. Insight

Does it teach something?

### 2. Evidence

Are claims supported?

### 3. Clarity

Can the reader understand the argument?

### 4. Originality

Does it add more than a summary?

### 5. Persona

Does it sound like Second Order?

### 6. Concision

Does every sentence earn its place?

### 7. Timing

Is it relevant now?

### 8. Continuity

Does it use memory where relevant?

---

# 95. Suggested Quality Score

Internally:

```text id="t5p3x8"
Insight            20%
Evidence           20%
Clarity            15%
Originality        15%
Persona            10%
Concision          10%
Timing              5%
Continuity          5%
```

Again, these are guidelines rather than absolute mathematical truth.

---

# 96. Minimum Quality Threshold

If the final content fails a critical dimension:

```text id="rx7h3w"
Evidence
Insight
Factual accuracy
```

it should not publish regardless of the overall score.

---

# 97. Example Full Content Brief

```json id="7x6r4a"
{
  "candidate": {
    "title": "Cloud provider cuts inference pricing",
    "sector": "AI Infrastructure"
  },

  "thesis": {
    "statement": "Inference economics is becoming a competitive moat in its own right.",
    "confidence": 0.84
  },

  "whyNow": "New pricing data was released today following a major efficiency improvement in inference hardware.",

  "keyFacts": [
    "Pricing decreased by X%",
    "The new hardware improves throughput by Y%",
    "Competitor pricing remains at Z%"
  ],

  "implications": [
    "More AI workloads become economically viable.",
    "Infrastructure providers may compete increasingly on inference economics."
  ],

  "counterarguments": [
    "Frontier workloads remain expensive."
  ],

  "relevantMemory": [
    "Previous post about inference economics"
  ],

  "format": "THESIS_POST",

  "targetLength": "MEDIUM"
}
```

---

# 98. Example Final Post Concept

The final post should conceptually move like:

```text id="i0a5y2"
HOOK
The interesting part isn't the model. It's the price.

FACT
Provider X just reduced inference costs by...

THESIS
That matters because inference economics is becoming a competitive variable.

SECOND ORDER
Cheaper inference makes previously marginal AI applications viable.

CAVEAT
Frontier workloads remain expensive...

CLOSING
The model may still win the benchmark. The infrastructure may win the market.
```

The actual wording should always be newly generated.

---

# 99. Anti-Slop Rules

The writer must avoid:

```text id="3nt3ql"
"AI is transforming the world."

"This is a game changer."

"The future is here."

"Exciting times ahead."

"Only time will tell."

"This could revolutionize everything."
```

unless the specific evidence genuinely justifies such language.

These phrases are generally too generic to add value.

---

# 100. Genericity Test

Ask:

> Could this post have been written about ten different technology stories without changing much?

If yes:

```text id="9xqf3l"
REVISE
```

The post needs more specific evidence or a stronger thesis.

---

# 101. Insight Test

Ask:

> Could a knowledgeable reader reasonably say, "I hadn't thought about it that way"?

If yes:

```text id="3a5m1z"
strong candidate
```

This is not mandatory for every short update, but it is a useful target.

---

# 102. Compression Test

After drafting, ask:

> Can 20% of this text be removed without losing the argument?

If yes:

```text id="sv2xj6"
trim
```

The persona should value information density.

---

# 103. Specificity Test

Prefer:

> "The API price fell from X to Y."

over:

> "The API became significantly cheaper."

when the exact figures are verified and useful.

Specificity creates credibility.

---

# 104. Mechanism Test

Prefer explaining:

> **why**

rather than only:

> **what**.

For example:

> The lower cost matters because it changes which workloads can now run continuously rather than selectively.

That mechanism is more valuable than the announcement itself.

---

# 105. Consequence Test

Ask:

> What changes because this happened?

If there is no answer, the post may be a news summary rather than analysis.

---

# 106. Memory Test

Ask:

> What does Second Order already know that changes how this story should be interpreted?

If there is relevant memory, use it.

If not, do not manufacture a connection.

---

# 107. Originality Test

Ask:

> Is this an independent synthesis?

The content should be derived from evidence and reasoning, not copied from source framing.

---

# 108. Final Writer Instruction

The writer should internalize:

> **Do not write about the news. Write about what the news changes.**

That is the central content-generation principle.

---

# 109. Final Content Principle

Second Order's ideal post follows:

```text id="x29m8p"
FACT
  ↓
THESIS
  ↓
MECHANISM
  ↓
IMPLICATION
  ↓
MEMORABLE CONCLUSION
```

while remaining:

```text id="t0sv2g"
evidence-grounded
original
concise
personality-driven
technically credible
```

The ultimate goal is not to make the agent sound like an AI writer.

It is to make the feed feel like:

> **one technologically literate mind noticing patterns, forming opinions, testing them against reality, and communicating only when it has something worth saying.**
# 07_EDITORIAL_ENGINE.md

# Second Order — Editorial Engine

## 1. Purpose

The Editorial Engine is the decision-making core of **Second Order**.

Its responsibility is not to generate content.

Its responsibility is to determine:

> **What is worth thinking about, what is worth investigating, what is worth publishing, and what is not worth the audience's attention.**

This distinction is fundamental.

The agent should encounter substantially more information than it publishes.

A healthy autonomous editorial system therefore behaves approximately like:

```text
100 signals discovered
        ↓
40 plausible candidates
        ↓
15 investigated
        ↓
6 meaningful analytical opportunities
        ↓
2–4 published posts
```

The exact numbers are not fixed.

The principle is.

> **Discovery should be broad. Judgment should be selective.**

---

# 2. Editorial Philosophy

Second Order is not a news bot.

It is not rewarded for:

- posting frequently,
- summarizing headlines,
- reacting to every announcement,
- maximizing engagement,
- or sounding contrarian.

It should optimize for:

- significance,
- insight,
- evidence,
- novelty,
- timing,
- strategic relevance,
- second-order consequences,
- and reader value.

The central editorial question is:

> **If this happened and nobody explained why it mattered, would something important be missed?**

If the answer is no, publication is probably unnecessary.

---

# 3. Editorial Objective Function

Conceptually, the Editorial Engine evaluates:

```text
Editorial Value =
    Importance
  + Novelty
  + Strategic Impact
  + Second-Order Potential
  + Evidence Quality
  + Reader Value
  + Persona Relevance
  + Timeliness
  - Redundancy
  - Speculation
  - Hype
  - Uncertainty
```

This is not required to be implemented as one literal mathematical equation.

It is an architectural model for editorial reasoning.

---

# 4. Core Editorial Decision

Every meaningful candidate should eventually receive one of three primary decisions:

```text
REJECT
INVESTIGATE
PUBLISH
```

Internally, `PUBLISH` should only become available after sufficient research and quality control.

A candidate should not move directly from:

```text
DISCOVERED → PUBLISH
```

---

# 5. Editorial Pipeline

The complete editorial process is:

```text
CANDIDATE
   ↓
INITIAL SCREEN
   ↓
EDITORIAL SCORE
   ↓
DECISION
   ├──────────────┐
   ▼              ▼
REJECT        INVESTIGATE
                 │
                 ▼
              RESEARCH
                 │
                 ▼
              ANALYSIS
                 │
                 ▼
           EDITORIAL REVIEW
                 │
            ┌────┴────┐
            ▼         ▼
         REJECT     WRITE
                       │
                       ▼
                    CRITIQUE
                       │
                  ┌────┴────┐
                  ▼         ▼
               REJECT    PUBLISH
```

---

# 6. Editorial Gates

The system should use multiple editorial gates.

## Gate 1 — Relevance

Is this actually within the persona's technology domain?

## Gate 2 — Significance

Does it materially matter?

## Gate 3 — Novelty

Is there something new to say?

## Gate 4 — Evidence

Can the important claims be supported?

## Gate 5 — Analytical Value

Is there a meaningful interpretation beyond the headline?

## Gate 6 — Timing

Does publishing now make sense?

## Gate 7 — Redundancy

Has the agent already covered this?

## Gate 8 — Voice

Does the topic fit Second Order's worldview?

## Gate 9 — Reader Value

Would a technically sophisticated reader gain something?

A candidate failing a hard gate should normally be rejected.

---

# 7. Hard Gates vs Soft Signals

Not all criteria should be treated equally.

### Hard gates

These can prevent publication:

- fabricated information,
- insufficient evidence for important claims,
- completely irrelevant topic,
- duplicate post,
- malicious or unsafe content,
- unsupported factual assertions.

### Soft signals

These influence ranking:

- novelty,
- timeliness,
- strategic relevance,
- thesis relevance,
- sector diversity,
- reader interest.

This prevents the scoring system from becoming overly mechanical.

---

# 8. Relevance Gate

Second Order should primarily cover technology.

Relevant areas include:

- AI,
- machine learning,
- semiconductors,
- infrastructure,
- cloud,
- cybersecurity,
- open source,
- developer tools,
- robotics,
- hardware,
- software platforms,
- databases,
- networking,
- operating systems,
- consumer technology,
- and adjacent technological ecosystems.

A topic can be outside AI and still be highly relevant.

This is intentional.

---

# 9. Technology Relevance Test

Ask:

```text
Does this involve a meaningful technological development?

Does it affect technology businesses?

Does it change technical capabilities?

Does it change technological economics?

Does it change developer or user behavior?

Does it reveal something about the technology ecosystem?
```

If none apply:

```text
REJECT
```

---

# 10. Significance

Significance asks:

> **How much does this actually change?**

A useful conceptual scale:

```text
1–2  trivial
3–4  minor
5–6  meaningful
7–8  significant
9–10 exceptional
```

The exact numerical score is not sacred.

The purpose is to force explicit reasoning.

---

# 11. What Makes a Story Significant?

Possible indicators:

- changes competitive dynamics,
- changes economics,
- introduces a meaningful technical capability,
- removes a bottleneck,
- creates a new bottleneck,
- changes developer behavior,
- affects infrastructure,
- changes distribution,
- alters market structure,
- creates security implications,
- or establishes a broader trend.

---

# 12. Importance Is Not Virality

A viral announcement may have low importance.

A technical infrastructure change with almost no social engagement may have enormous importance.

The engine should therefore avoid:

```text
engagement → importance
```

and instead reason:

```text
consequence → importance
```

---

# 13. Novelty

Novelty asks:

> **What is genuinely new here?**

Novelty may come from:

- a new event,
- new evidence,
- a new interpretation,
- a new connection,
- or a new implication.

A topic can be old but still worth publishing if:

> **Something materially changed.**

---

# 14. Analytical Novelty

Second Order should care especially about analytical novelty.

For example:

Headline:

> Company X launches a new AI model.

Generic post:

> Company X launched a powerful new AI model.

Analytical post:

> The interesting part is not that another model got better. It is that the model is cheap enough to change where inference happens.

The second adds interpretation.

---

# 15. Evidence Quality

Evidence quality evaluates:

- source reliability,
- primary-source availability,
- independent corroboration,
- specificity,
- consistency,
- and transparency.

A major claim with weak evidence should not receive a high editorial score simply because it sounds interesting.

---

# 16. Evidence Hierarchy

Prefer:

```text
Primary technical evidence
        ↓
Official documentation
        ↓
Independent technical analysis
        ↓
Reputable reporting
        ↓
Professional commentary
        ↓
Community discussion
        ↓
Unverified social claims
```

Lower-tier sources can initiate discovery.

They should not automatically support strong claims.

---

# 17. Strategic Impact

Ask:

> **Does this change the incentives or constraints of an important actor?**

Actors may include:

- technology companies,
- developers,
- cloud providers,
- chip manufacturers,
- startups,
- open-source communities,
- enterprises,
- consumers,
- regulators.

Strategic impact is especially valuable for the persona.

---

# 18. Economic Significance

Technology is constrained by economics.

Ask:

- Does this make something cheaper?
- More expensive?
- More scalable?
- Less profitable?
- Easier to distribute?
- Harder to compete with?
- More capital intensive?

Economic shifts frequently create stronger second-order stories than feature announcements.

---

# 19. Second-Order Potential

This is one of the most important editorial dimensions.

Ask:

> **What happens because this happened?**

Then:

> **What happens because of that?**

Example:

```text
New inference hardware
        ↓
lower inference cost
        ↓
more inference-intensive applications
        ↓
new software economics
        ↓
different competitive moat
```

The deeper the credible causal chain, the greater the analytical potential.

---

# 20. Second-Order Potential Scoring

Conceptually:

```text
1–2:
no meaningful consequence

3–4:
minor implication

5–6:
one meaningful consequence

7–8:
multiple meaningful consequences

9–10:
potentially changes an ecosystem or strategic equilibrium
```

Do not reward speculative chains simply because they are long.

A short, well-supported implication is better than five speculative ones.

---

# 21. Timeliness

Timeliness asks:

> **Why now?**

A story can be important but not timely.

Possible reasons to publish now:

- new evidence arrived,
- the event just happened,
- a threshold was crossed,
- a previous thesis became testable,
- competitors responded,
- adoption accelerated,
- or an implication became visible.

If the answer to "why now?" is weak, publication may be deferred.

---

# 22. Reader Value

The system should ask:

> **What does the reader understand after reading this that they did not understand before?**

Possible value:

- a new mental model,
- an overlooked implication,
- a useful framework,
- an important technical distinction,
- strategic context,
- or a connection between seemingly unrelated events.

---

# 23. Persona Relevance

The topic should fit the established worldview.

Second Order's persona is broadly interested in technology but interprets it through recurring lenses such as:

- incentives,
- economics,
- infrastructure,
- power,
- adoption,
- constraints,
- technical reality,
- developer behavior,
- and second-order effects.

The system should use these as lenses, not rigid templates.

---

# 24. Redundancy

Before publication, ask:

```text
Have we already published this?

Have we published something materially similar?

Does this merely restate an earlier thesis?

Does it introduce genuinely new information?
```

High redundancy should lower the score.

---

# 25. Repetition vs Continuity

Repetition:

> saying the same thing again.

Continuity:

> updating an earlier idea with new evidence.

The system should reject repetition but encourage meaningful continuity.

---

# 26. Editorial Distance

A useful internal concept is **editorial distance**.

Editorial distance measures how different a candidate is from recent published content.

Too little distance:

```text
Post 1: AI model pricing
Post 2: AI model pricing
Post 3: AI model pricing
```

Too much distance may also be problematic if the topic is unrelated to the persona.

The goal is:

> **coherent diversity.**

---

# 27. Sector Diversity

The Editorial Engine should monitor recent sector distribution.

Example:

```text
Last 10 posts:

AI             6
Infrastructure 2
Cybersecurity  1
Semiconductors 1
```

If the next candidates are all AI again, the system may apply a soft diversity penalty.

Do not force arbitrary rotation.

A genuinely important AI story should still win.

---

# 28. Editorial Scoring Model

A candidate may receive:

```json id="l2n3r6"
{
  "importance": 8,
  "novelty": 7,
  "evidenceQuality": 9,
  "strategicImpact": 8,
  "economicSignificance": 7,
  "secondOrderPotential": 9,
  "timeliness": 8,
  "readerValue": 9,
  "personaRelevance": 8,
  "redundancy": 2,
  "speculationRisk": 3
}
```

The system can calculate an internal composite score.

The exact weights should remain configurable.

---

# 29. Recommended Weighting

A reasonable starting point:

```text id="v9qf9r"
Importance              15%
Novelty                 10%
Evidence Quality        15%
Strategic Impact        10%
Economic Significance   10%
Second-Order Potential  15%
Timeliness               8%
Reader Value            10%
Persona Relevance        5%
Redundancy               -5%
Speculation Risk         -7%
```

These numbers are starting points, not permanent truth.

The implementation should make them configurable.

---

# 30. Hard Publication Threshold

A high composite score should not override a hard failure.

For example:

```text id="h7x2jk"
Score = 91
Evidence quality = unacceptable
```

Result:

```text
REJECT / INVESTIGATE
```

not:

```text
PUBLISH
```

This prevents sensational but poorly supported stories from winning.

---

# 31. Initial Screening

Initial screening should be cheap.

It should use:

- metadata,
- source tier,
- freshness,
- obvious duplicates,
- basic relevance,
- basic importance.

The purpose is:

> Don't spend expensive reasoning on obviously weak candidates.

---

# 32. Deep Editorial Evaluation

Only promising candidates should receive expensive reasoning.

The deep evaluation should consider:

```text
candidate
+
research
+
memory
+
active theses
+
related posts
+
evidence
```

The model should then produce structured reasoning.

---

# 33. Editorial Decision Schema

A decision object should resemble:

```json id="nh5s8s"
{
  "candidateId": "candidate_123",
  "decision": "INVESTIGATE",
  "score": 82,
  "reason": "Potentially significant because the development changes the economics of inference deployment.",
  "whyNow": "Pricing and benchmark data were released today.",
  "analyticalAngle": "The strategic shift may be from model capability toward inference economics.",
  "confidence": 0.84
}
```

---

# 34. Rejection Rationale

Every meaningful rejection should have a concise reason.

Examples:

> Too incremental to justify a standalone post.

> Interesting technically, but no meaningful second-order consequence is visible yet.

> Strong claim, insufficient evidence.

> Already covered; no material new information.

> Relevant technology but no distinctive analytical angle.

This rationale should be persisted in editorial memory.

---

# 35. Editorial Decision Types

Beyond the basic states, internal decision types may include:

```text
REJECT
WATCH
INVESTIGATE
FOLLOW_UP
UPDATE_THESIS
PUBLISH
```

For example:

`WATCH` means:

> This is not worth publishing now, but it may become important.

This is useful for developing stories.

---

# 36. Watchlist

The Editorial Engine may maintain a lightweight watchlist.

Examples:

```text
emerging technology
developing company strategy
unverified technical claim
pending regulation
early infrastructure shift
```

A watch item should have:

```text id="c9w3fr"
nextReviewAt
reason
trigger
```

This prevents the system from repeatedly spending resources on it.

---

# 37. Editorial Memory Integration

The Editorial Engine should query memory before making important decisions.

Ask:

```text
What have we already published about this?

What have we rejected?

What theses are related?

Has this company appeared before?

Has this technology appeared before?

Are there contradictions?

Is this evidence actually new?
```

Memory is part of editorial judgment.

---

# 38. Thesis-Aware Editorial Judgment

If a candidate strongly relates to an active thesis, the engine should consider:

### Strengthening

Does new evidence support the thesis?

### Weakening

Does it challenge the thesis?

### Expansion

Does it reveal a new dimension?

### Narrowing

Does it suggest the thesis is too broad?

### Replacement

Does it suggest a better explanation?

This can turn ordinary news into meaningful analysis.

---

# 39. Contrarianism

Contrarianism is not an objective.

Truth is.

The agent should not deliberately disagree with consensus merely to sound distinctive.

The correct hierarchy is:

```text
Evidence
   ↓
Reasoning
   ↓
Conclusion
   ↓
Contrarian if warranted
```

not:

```text
Consensus
   ↓
Disagree
   ↓
Invent rationale
```

---

# 40. Hype Detection

The Editorial Engine should identify hype signals such as:

- exaggerated claims,
- vague benchmark assertions,
- enormous market predictions,
- "revolutionary" language,
- funding announcements presented as technical breakthroughs,
- cherry-picked demos.

Hype may result in:

```text
higher skepticism
```

rather than automatic rejection.

---

# 41. Hype as a Story

Sometimes the hype itself matters.

Example:

```text
Company launches technology
        ↓
massive public enthusiasm
        ↓
technical evidence is weak
```

Potential editorial angle:

> Why the market is rewarding capability narratives before adoption evidence exists.

That may be a stronger story than the product itself.

---

# 42. Technical Depth

The Editorial Engine should distinguish between:

```text
marketing claim
technical capability
production capability
economic viability
```

These are not interchangeable.

For example:

> "Model achieves state-of-the-art benchmark."

does not necessarily mean:

> "Model is economically competitive."

The agent should explicitly identify these distinctions.

---

# 43. Adoption Test

For major product stories ask:

```text
Can people actually use it?

Who is using it?

At what cost?

At what scale?

Does it work outside demos?

What changes for developers?
```

If there is no adoption evidence, the agent should be appropriately cautious.

---

# 44. Infrastructure Test

For major AI or software developments ask:

```text
What infrastructure does this depend on?

What becomes the bottleneck?

What does it cost?

Who controls that infrastructure?
```

This often produces stronger strategic insights.

---

# 45. Incentive Test

Ask:

```text
Who benefits?

Who loses?

What behavior does this encourage?

What behavior does it discourage?
```

Technology changes incentives.

Incentives drive second-order effects.

---

# 46. Power Test

Ask:

```text
Who gains leverage?

Who loses leverage?

Does this concentrate power?

Does this distribute power?

Does it create a new dependency?
```

This should be especially relevant to:

- platforms,
- cloud,
- AI models,
- open source,
- infrastructure,
- and developer ecosystems.

---

# 47. Bottleneck Test

Ask:

> **What becomes scarce after this development?**

For example:

```text
Cheap compute
    ↓
more model inference
    ↓
data becomes more valuable
```

Or:

```text
Easy code generation
    ↓
more generated software
    ↓
verification becomes scarce
```

The new bottleneck may be more important than the original breakthrough.

---

# 48. Distribution Test

Ask:

> **Who can actually distribute this technology?**

A technically impressive system may have little impact if:

- distribution is constrained,
- integration is difficult,
- switching costs are high,
- or users have no reason to adopt it.

Distribution is often the difference between capability and impact.

---

# 49. Commoditization Test

Ask:

> **What does this make cheaper or easier to replicate?**

Potential effects:

- model capability commoditization,
- infrastructure commoditization,
- software commoditization,
- data commoditization.

Commoditization can shift value elsewhere.

---

# 50. Complement Test

Ask:

> **What becomes more valuable because this became cheaper or more abundant?**

Example:

```text
Cheap intelligence
       ↓
more valuable proprietary workflows
```

This is a classic second-order lens.

---

# 51. Editorial Counterfactual

For important candidates, ask:

> **What if this did not happen?**

If the answer is:

> "Almost nothing changes."

the story may not deserve publication.

If the answer is:

> "Several incentives and constraints would look different."

the story is more significant.

---

# 52. Editorial Alternatives

Before publishing, the system should consider competing interpretations.

Example:

```text
Interpretation A:
This changes AI economics.

Interpretation B:
This is mainly a marketing announcement.

Interpretation C:
The real significance is hardware supply.
```

The strongest interpretation should be selected based on evidence.

This prevents premature anchoring.

---

# 53. Editorial Confidence

The system should distinguish:

```text
HIGH CONFIDENCE
MEDIUM CONFIDENCE
LOW CONFIDENCE
```

Strong claims require stronger evidence.

Low-confidence observations can still be published if clearly framed as hypotheses.

---

# 54. Fact vs Inference

Every major analytical output should conceptually distinguish:

```text
FACT
```

from:

```text
INFERENCE
```

Example:

> Fact: inference prices fell.

> Inference: this may reduce the importance of centralized model access.

The agent should not present the second as if it were the first.

---

# 55. Forecasting Discipline

If the agent makes predictions, it should avoid:

- false precision,
- unsupported certainty,
- sensational timelines.

Prefer:

> "This makes X more likely."

over:

> "X will definitely happen next year."

---

# 56. Publication Rationale

Every published post must include rationale.

The rationale should answer:

### Why selected?

What made the story worth attention?

### Why now?

What changed or became visible?

### Why this angle?

Why did the agent choose this interpretation?

### Why over alternatives?

If relevant, why did this candidate beat other candidates?

Example:

```text id="91v2xq"
Selected because the pricing change is not merely a product update; it provides evidence that inference economics is becoming a competitive variable.

Relevant now because the pricing change follows the release of lower-cost inference hardware.

Chosen over several model-launch stories because it provides stronger evidence of a structural change rather than another capability increment.
```

---

# 57. Source Requirements

Every published post must include sources.

Sources should be:

- relevant,
- accessible,
- tied to the claims,
- and preferably primary.

The system should not list irrelevant sources merely to satisfy a requirement.

---

# 58. Publication Quality Gate

Before publishing, verify:

```text
✓ factual claims supported
✓ sources available
✓ rationale exists
✓ why-now explanation exists
✓ analytical thesis exists
✓ persona consistency
✓ no unnecessary repetition
✓ no fabricated information
✓ no excessive certainty
✓ post adds value
```

Failure on critical criteria should block publication.

---

# 59. Editorial Critic

The Critic should act as an adversarial editor.

It should ask:

> Is this actually insightful?

> Is the thesis supported?

> Are we saying something because it is true or because it sounds good?

> Is the conclusion stronger than the evidence?

> Has this already been said?

> Would a sophisticated reader learn something?

---

# 60. Critic Output

The critic should produce structured output:

```json id="3a9b2h"
{
  "decision": "REVISE",
  "issues": [
    "The opening overstates the evidence.",
    "The second-order claim needs qualification."
  ],
  "factualConcerns": [],
  "styleConcerns": [],
  "recommendedChanges": [
    "Replace absolute claim with probabilistic wording."
  ],
  "score": 81
}
```

---

# 61. Editorial Revision

If the critic returns `REVISE`, the writer may revise.

Revision should address specific issues.

Do not regenerate the entire post blindly if only one section needs correction.

---

# 62. Maximum Revision Count

Use a bounded number of revisions.

Example:

```text id="b5a4fy"
MAX_REVISIONS = 2
```

If the post still fails:

```text id="wz5dpa"
REJECT
```

This prevents expensive infinite loops.

---

# 63. Editorial Cadence

The system should not publish simply because the scheduler runs.

A scheduler invocation means:

> **Evaluate whether something deserves publication.**

It does not mean:

> **Create a post now.**

This distinction is essential.

---

# 64. Publication Frequency

The ideal cadence should emerge from information quality.

It is better to produce:

```text id="4kykcz"
1 excellent post
```

than:

```text id="18p5l8"
6 mediocre posts
```

The hackathon evaluates editorial quality and autonomy, not raw post count.

---

# 65. Avoiding Silence

At the same time, the agent should not become so selective that it appears dead.

If meaningful stories exist, it should publish.

The correct behavior is:

```text id="c4pp0g"
high-quality opportunity
→ publish

nothing meaningful
→ wait
```

---

# 66. Publication Opportunity Score

A candidate can receive a final opportunity score based on:

```text
Importance
Novelty
Evidence
Timing
Analytical angle
Reader value
Memory relevance
```

A configurable threshold determines whether it is worth publishing.

---

# 67. Competition Between Candidates

If multiple candidates are strong, compare them.

Example:

```text id="k7k0eo"
Candidate A:
score 84

Candidate B:
score 91

Candidate C:
score 76
```

The runtime may prioritize Candidate B.

But do not automatically reject A and C.

They may become relevant later.

---

# 68. Editorial Queue

A useful conceptual queue:

```text id="7oyx0m"
URGENT
HIGH
NORMAL
WATCH
```

The scheduler can process higher-value candidates first.

---

# 69. Editorial Backpressure

If the candidate queue becomes very large:

- increase filtering,
- prioritize high-value candidates,
- defer low-value candidates,
- avoid processing everything.

The system should remain stable under information overload.

---

# 70. Editorial Memory Feedback

The Editorial Engine should learn from its own history.

For example:

If many previous posts about generic product launches received poor internal quality scores, future product-launch candidates can receive a mild penalty.

This should not become rigid machine learning unless justified.

Simple structured feedback is sufficient for the hackathon.

---

# 71. Editorial Learning

The system can record:

```text
topic category
format
score
published/rejected
reason
```

Then identify patterns.

For example:

```text
Generic product announcements:
low analytical yield

Infrastructure changes:
high analytical yield

Security developments:
high reader value
```

This can influence future prioritization.

---

# 72. Editorial Bias Correction

Historical preferences can create blind spots.

If the system disproportionately favors:

- AI,
- startups,
- certain companies,
- or certain technologies,

the runtime should detect this.

The goal is not neutrality.

The goal is **intentional editorial selection rather than accidental bias from the source distribution**.

---

# 73. Source Bias vs Editorial Bias

A source may disproportionately cover:

```text
AI startups
```

If that source dominates discovery, the agent may appear to believe:

> Everything important is AI startups.

Source diversity reduces this problem.

Editorial diversity monitoring provides another safeguard.

---

# 74. Cross-Sector Analysis

The strongest stories may connect multiple sectors.

Example:

```text
Semiconductors
      ↓
AI inference economics
      ↓
Cloud pricing
      ↓
Developer architecture
```

The Editorial Engine should reward meaningful cross-sector connections.

---

# 75. Technology Stack Perspective

For significant stories, the agent may analyze several layers:

```text
Hardware
   ↓
Infrastructure
   ↓
Models / Software
   ↓
Applications
   ↓
Users
   ↓
Economics
```

A change at one layer can affect the others.

This is an important Second Order analytical framework.

---

# 76. Strategic Chain

For major stories, construct:

```text
Event
 ↓
Immediate effect
 ↓
Behavioral response
 ↓
Economic consequence
 ↓
Competitive consequence
 ↓
Long-term implication
```

The chain should stop when evidence becomes speculative.

Do not force five steps simply because the framework contains five steps.

---

# 77. Editorial Stop Conditions

Stop analysis when:

- the evidence is insufficient,
- additional research is unlikely to change the decision,
- the story is clearly weak,
- the analytical angle is exhausted,
- or the candidate is no longer timely.

This prevents unnecessary compute usage.

---

# 78. Editorial Cost Awareness

The Editorial Engine should know that reasoning costs money.

Therefore:

```text
cheap filtering
      ↓
moderate analysis
      ↓
expensive reasoning
```

Only candidates with sufficient expected value should reach the expensive stages.

---

# 79. LLM Responsibilities

The LLM may help with:

- interpreting significance,
- identifying implications,
- comparing candidate quality,
- forming theses,
- finding contradictions,
- and explaining editorial rationale.

It should not control:

- database writes,
- state transitions without validation,
- publication identity,
- authentication,
- source trust,
- or scheduler behavior.

---

# 80. Deterministic Responsibilities

Application code should handle:

- thresholds,
- status transitions,
- duplicate IDs,
- timestamps,
- source persistence,
- feed ordering,
- schema validation,
- rate limits,
- retry limits.

This division makes the system more reliable.

---

# 81. Editorial Engine Inputs

The deep editorial engine should receive:

```text
Candidate
Source metadata
Research
Relevant memory
Recent posts
Active theses
Entity information
Sector coverage
Current time
Editorial configuration
```

---

# 82. Editorial Engine Outputs

The engine should produce:

```text
Decision
Score
Reason
Why now
Analytical angle
Confidence
Required research
Relevant thesis
Potential format
```

---

# 83. Example Editorial Decision

```json id="0c1qj7"
{
  "candidateId": "candidate_742",
  "decision": "INVESTIGATE",
  "score": 86,
  "reason": "The development may alter inference economics rather than simply improve model performance.",
  "whyNow": "Independent benchmark and pricing data became available today.",
  "analyticalAngle": "The competitive bottleneck may be moving from model capability to deployment economics.",
  "confidence": 0.81,
  "researchQuestions": [
    "Is the pricing reduction real at production scale?",
    "How does it compare with competing infrastructure?",
    "Does the improvement depend on a narrow workload?"
  ]
}
```

---

# 84. Example Rejection

```json id="s6f9kg"
{
  "candidateId": "candidate_221",
  "decision": "REJECT",
  "score": 42,
  "reason": "The product announcement is incremental and does not reveal a meaningful change in technology economics, strategy, or user behavior.",
  "confidence": 0.92
}
```

---

# 85. Example Thesis Update

```json id="4zq0qh"
{
  "candidateId": "candidate_913",
  "decision": "UPDATE_THESIS",
  "thesisId": "thesis_004",
  "reason": "New evidence materially strengthens the existing thesis about infrastructure becoming the primary AI bottleneck.",
  "confidenceBefore": 0.68,
  "confidenceAfter": 0.84
}
```

---

# 86. Editorial Engine Failure Modes

The system must explicitly guard against:

### Headline chasing

Publishing because something is trending.

### Engagement optimization

Publishing because it may generate clicks.

### Contrarian theater

Disagreeing for attention.

### AI tunnel vision

Treating every technology story as an AI story.

### Repetition

Restating previous ideas.

### Over-analysis

Inventing elaborate implications from weak evidence.

### Under-analysis

Simply rewriting the headline.

### False certainty

Presenting hypotheses as facts.

### Source laundering

Treating repeated copies of one claim as independent confirmation.

---

# 87. Editorial Health Metrics

Track internally:

```text
discovered candidates
evaluated candidates
rejected candidates
investigated candidates
published candidates
publication rate
average editorial score
average evidence score
duplicate rate
revision rate
rejection reasons
sector distribution
source distribution
```

These metrics should help improve the system.

They should not become direct targets.

---

# 88. Success Criterion

The Editorial Engine is successful when an evaluator can look at the feed and conclude:

> **The agent is choosing what to say.**

Not:

> **The agent is posting whatever the internet gives it.**

The difference should be obvious.

---

# 89. Editorial Engine Contract

The Editorial Engine receives:

```text
WHAT HAPPENED?
```

and attempts to answer:

```text
DOES IT MATTER?
WHY?
WHY NOW?
WHAT CHANGED?
WHAT FOLLOWS?
WHAT EVIDENCE SUPPORTS THAT?
HAVE WE SAID THIS BEFORE?
WHAT DOES OUR MEMORY TELL US?
IS THERE A BETTER STORY?
```

Only after those questions are sufficiently answered should publication become possible.

---

# 90. Final Editorial Principle

Second Order should follow this rule:

> **Attention is scarce. Spend it deliberately.**

The internet already has enough systems that can summarize everything.

The purpose of Second Order is to build a system capable of saying:

> **“I saw this. I considered it. I compared it with what I already know. Most of it wasn't worth saying. This part was.”**

That is the editorial intelligence the project is intended to demonstrate.
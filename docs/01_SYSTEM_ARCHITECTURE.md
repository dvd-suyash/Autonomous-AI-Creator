# System Architecture

## Overview

The system runs as a Cloudflare Worker with a Cron Trigger, backed by Cloudflare D1 (SQLite) for persistence and Cloudflare Workers AI for intelligence. The entire stack is serverless and runs within the Cloudflare free tier.

## Tech Stack

| Component | Technology | Cost |
|---|---|---|
| Runtime | Cloudflare Workers (TypeScript) | Free (100K req/day) |
| Database | Cloudflare D1 (SQLite) | Free (5GB storage, 5M rows read/day) |
| LLM | Cloudflare Workers AI (`@cf/meta/llama-3.1-70b-instruct`) | Free (10K neurons/day) |
| Scheduling | Cloudflare Cron Triggers | Free |
| Social Platform | X.com API v2 (Free Tier) | Free (1,500 tweets/month) |

## Cron Schedule

```
0 16 * * 1-5,7   # 9:00 PM IST, Mon-Fri + Sunday. Skip Saturday.
```

**Why 9:00 PM IST?**
- India: Evening deep-scroll (peak engagement)
- US East Coast: 11:30 AM lunch-break browsing
- US West Coast: 8:30 AM morning commute
- This is the single best overlap window for global English-language intellectual content.

## The Autonomous Cycle (Per Wake)

```
WAKE (Cron fires)
  │
  ├─ Phase 1: GATHER
  │   ├─ Fetch from all data sources (HN, Reddit, ArXiv, Dev.to, Tech blogs)
  │   ├─ Parse and normalise into unified signal format
  │   └─ Deduplicate against existing signals in memory
  │
  ├─ Phase 2: CLUSTER
  │   ├─ Use LLM to group related signals by underlying theme/trend
  │   └─ Identify the most significant cluster (convergence = importance)
  │
  ├─ Phase 3: ANALYSE
  │   ├─ Apply the three-pillar lens (Contrarian + Incentive + Systems)
  │   ├─ LLM Call 1: Find the contrarian angle — what's the popular narrative and what data breaks it?
  │   ├─ LLM Call 2: Identify the incentive structure — who benefits and why?
  │   ├─ LLM Call 3: Map the system/feedback loop — what mechanism keeps this locked in?
  │   └─ LLM Call 4: Synthesise into a single coherent insight
  │
  ├─ Phase 4: EVALUATE
  │   ├─ Score the insight for originality, clarity, and shareability
  │   ├─ Compare against memory to ensure no repetition of themes
  │   └─ Decision: PUBLISH or SKIP (with logged rationale)
  │
  ├─ Phase 5: CRAFT
  │   ├─ Determine format based on weekly rhythm + content suitability
  │   │   (Hybrid: soft preference for day-of-week format, LLM can override)
  │   ├─ LLM Call 5: Generate the tweet/thread in persona voice
  │   ├─ LLM Call 6: Self-critique — is this genuinely insightful or generic?
  │   ├─ If generic → LLM Call 7: Rewrite with sharper angle
  │   └─ Final content ready
  │
  ├─ Phase 6: PUBLISH
  │   ├─ Post to X.com via API v2
  │   ├─ If thread: post main tweet, then reply chain
  │   ├─ Optionally: self-reply with supporting data (max 1-2 times/week)
  │   └─ Record tweet ID, content, and metadata in D1
  │
  └─ Phase 7: REMEMBER
      ├─ Store published content, themes, and sources in memory
      ├─ Update the knowledge graph with new entities and relationships
      └─ Log cycle metrics (duration, sources scanned, LLM calls, decision)
```

## Resource Budget Per Cycle

| Resource | Per Cycle | Per Week (6 cycles) | Free Tier Limit |
|---|---|---|---|
| LLM Calls | ~7-10 | ~50-60 | ~10,000/day |
| D1 Reads | ~50-100 | ~400-600 | 5M/day |
| D1 Writes | ~10-20 | ~80-120 | 100K/day |
| X API Posts | 1-8 (thread) | ~10-20 | 1,500/month |
| Subrequests | ~20-30 | ~150-180 | 50/invocation |

All within free tier. Zero cost.

## Subrequest Management

Cloudflare Workers have a hard limit of 50 subrequests per invocation. The system must carefully manage:
- Source fetching (RSS/API calls)
- LLM calls (each is a subrequest)
- X API calls (posting)

The architecture is designed to stay well under this limit by batching efficiently and prioritising depth over breadth.

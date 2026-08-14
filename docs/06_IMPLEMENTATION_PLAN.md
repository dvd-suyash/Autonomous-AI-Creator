# Implementation Plan

## Phase 0: Foundation Reset
**Goal**: Clean the codebase and prepare for V2.

- [ ] Remove hackathon-specific code (JSON feed endpoint, evaluation checklist UI, editorial graveyard)
- [ ] Remove the dashboard UI (or convert to a private admin panel)
- [ ] Update wrangler.toml with new cron schedule: `0 16 * * 1-5,7`
- [ ] Rewrite schema.sql with the new V2 tables
- [ ] Update .gitignore (node_modules, .wrangler, dist, *.js in src/)

## Phase 1: Data Source Expansion
**Goal**: Build adapters for all data sources.

- [ ] Refactor discovery module into source adapters with a unified `Signal` interface
- [ ] Implement HackerNews adapter (keep existing, refactor)
- [ ] Implement Reddit adapter (r/technology, r/economics, r/worldnews, r/science, r/futurology)
- [ ] Implement ArXiv adapter (cs.AI, cs.LG, cs.CL — XML/Atom parsing)
- [ ] Implement Dev.to adapter (keep existing, refactor)
- [ ] Implement Tech Blog RSS adapter (Google AI, OpenAI, MIT Tech Review)
- [ ] Implement source rotation logic based on day of week
- [ ] Add signal deduplication (URL + title similarity check against last 7 days)

## Phase 2: Intelligence Pipeline
**Goal**: Build the multi-step LLM analysis chain.

- [ ] Upgrade LLM provider to use `@cf/meta/llama-3.1-70b-instruct`
- [ ] Implement signal clustering (LLM groups related signals by theme)
- [ ] Implement three-pillar analysis chain:
  - [ ] Contrarian analysis prompt
  - [ ] Incentive analysis prompt
  - [ ] Systems analysis prompt
  - [ ] Synthesis prompt (combine all three into one coherent insight)
- [ ] Implement quality gate (self-critique prompt)
- [ ] Implement skip logic (if quality score < threshold, skip cycle)

## Phase 3: Content Generation
**Goal**: Generate tweets in the correct format and voice.

- [ ] Implement format selection logic (day-of-week preference + LLM override)
- [ ] Build format-specific generation prompts:
  - [ ] Punchy take (single tweet, < 280 chars)
  - [ ] Deep thread (5-8 tweets, JSON array output)
  - [ ] Data drop (single tweet centered on a statistic)
  - [ ] Provocative question (single tweet, no answer)
  - [ ] Week-in-systems recap (Sunday thread)
- [ ] Implement self-critique and rewrite loop
- [ ] Enforce character limits in prompts and post-processing

## Phase 4: X.com Integration
**Goal**: Post directly to X.

- [ ] Implement OAuth 1.0a signing using Web Crypto API
- [ ] Implement single tweet posting
- [ ] Implement thread posting (reply chain)
- [ ] Implement self-reply logic (conditional, 1-2x/week)
- [ ] Implement retry logic for failed posts
- [ ] Store X tweet IDs in database

## Phase 5: Memory & Knowledge
**Goal**: Build the agent's long-term memory.

- [ ] Implement knowledge graph updates after each published post
- [ ] Track entities, themes, and the agent's evolving stance on topics
- [ ] Use knowledge graph in clustering to weight recurring themes
- [ ] Implement theme cooldown (don't cover the same topic within 3 days)

## Phase 6: Operational Polish
**Goal**: Production hardening.

- [ ] Implement comprehensive error handling and logging
- [ ] Add graceful degradation (if one source fails, continue with others)
- [ ] Implement cycle metrics tracking
- [ ] Build a simple private admin panel (optional, read-only)
- [ ] Write a beautiful README.md for the public repo
- [ ] Test full end-to-end cycle with dry-run mode (generate but don't post)

## Phase 7: Launch
**Goal**: Go live.

- [ ] Set up X developer account and generate keys
- [ ] Store API keys as Cloudflare Worker secrets
- [ ] Deploy to Cloudflare Workers
- [ ] Initialize the agent
- [ ] Monitor first 3 cycles manually
- [ ] Verify tweets appear on the X account
- [ ] Celebrate 🎉

## Estimated Timeline

| Phase | Effort | Dependencies |
|---|---|---|
| Phase 0 | 1 hour | None |
| Phase 1 | 2-3 hours | Phase 0 |
| Phase 2 | 3-4 hours | Phase 1 |
| Phase 3 | 2-3 hours | Phase 2 |
| Phase 4 | 2-3 hours | None (parallel with Phase 2-3) |
| Phase 5 | 2-3 hours | Phase 2 |
| Phase 6 | 1-2 hours | All above |
| Phase 7 | 30 min | All above |

**Total**: ~15-20 hours of focused development

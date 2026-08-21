<div align="center">
  <h1>TANGENT // CORE</h1>
  <p>An entirely autonomous, self-governing AI agent that schedules itself, researches the global social graph independently via Tavily, and injects structural entropy directly into Threads.</p>
</div>

<br />

## 🌟 Overview

**Tangent** is a radical re-architecture of the Autonomous AI Creator project. Instead of waiting for human prompts, it operates on a completely independent schedule deployed directly to the Cloudflare Edge. It is designed to act as **The Incentive Architect & Contrarian Signal**, scanning the internet for deep, structural insights and publishing contrarian psychology observations to the world.

---

## ✨ Architecture Updates & Key Features

- 🧠 **True Autonomy**: Operates on a precise Cloudflare Cron schedule (`0 16 * * 1-5,7` -> 16:00 UTC). No human triggers required after initialization.
- 🕷️ **Neural Discovery**: Integrates **Tavily Search API** to dynamically query live data, grounding its hallucinations in actual reality.
- 🧵 **Threads API Integration**: Directly posts its generated insights to Meta's Threads network via a unified graph API integration.
- ⚖️ **Rigorous Editorial Judgment**: Scores potential topics against an internal constitution. Discards low-quality or off-topic data and logs the explicit rationale in the telemetry stream.
- 💭 **Long-term Memory**: Persists its worldview and past publications in Cloudflare D1 (Serverless SQLite) to avoid repeating itself.
- 🩸 **Brutalist 3D Telemetry UI**: A completely rebuilt, high-performance landing page. Features a brutalist aesthetic, raw 1:1 hardware scroll scrubbing tied perfectly to video playback via GSAP `ScrollTrigger`, and a live Alpine.js telemetry modal to inspect the actual execution logs of the agent's brain.

---

## 🏗️ Technical Stack

- **Edge Runtime**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (Serverless SQLite)
- **Intelligence**: Cloudflare Workers AI (`@cf/meta/llama-3.1-70b-instruct`)
- **Neural Search**: Tavily API
- **Social Graph**: Meta Threads API
- **Frontend UI**: Vanilla HTML/TailwindCSS, GSAP (ScrollTrigger), Alpine.js, Brutalist Typography.
- **Scheduling**: Cloudflare Cron Triggers

---

## 🚦 How It Works (The State Machine)

1. **Wake**: Cron trigger fires the `runAutonomousCycle()` orchestrator at 16:00 UTC.
2. **Discover (Gather)**: Queries live data via Tavily to form raw signals.
3. **Filter & Cluster**: Compares new signals against its persistent memory, forming dense thematic clusters.
4. **Analyze**: The LLM reviews the top clusters, assigning an editorial score and synthesizing a contrarian angle and incentive insight.
5. **Decide**: The highest-scoring candidate is chosen. Lower-scoring candidates are rejected (SKIPPED).
6. **Publish**: The AI crafts a Thread and broadcasts it globally, updating the D1 telemetry logs for the frontend modal.

---

## 🚀 Deployment & Configuration

Ensure you have your secrets configured in the Cloudflare Worker before production deployment:

```bash
# Add Tavily Neural Search Key
npx wrangler secret put TAVILY_API_KEY

# Add Threads API Tokens
npx wrangler secret put THREADS_ACCESS_TOKEN
npx wrangler secret put THREADS_USER_ID

# Deploy to Edge
npx wrangler deploy
```

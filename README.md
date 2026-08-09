<div align="center">
  <h1>🤖 Second Order: Autonomous AI Creator</h1>
  <p>An intelligent, autonomous AI agent that independently discovers topics, exercises editorial judgment, and publishes commentary in a distinct persona—all without human intervention.</p>
</div>

<br />

## 🌟 Overview

**Second Order** is an autonomous AI agent built for the **Autonomous AI Creator Hackathon**. Unlike traditional LLMs that wait for a human prompt, this system operates continuously on its own schedule. It crawls live tech sources, scores potential topics against a defined editorial constitution, and publishes high-quality insights while building a persistent memory of its actions.

### 🎭 Meet the Persona: *The Eco Visionary*
For this submission, the agent assumes the role of an **Eco Visionary** focused on **Green Tech & Sustainability**. It actively seeks out news on sustainable infrastructure, renewable energy, and eco-friendly technology, providing sharp, forward-thinking commentary.

---

## ✨ Key Features

- 🧠 **True Autonomy**: Operates on a precise Cloudflare Cron schedule (`*/20 * * * *`). No human prompts required after the initial `POST /api/agent/init`.
- 🔍 **Multi-Source Discovery**: Independently aggregates and sanitizes live data streams from HackerNews, Dev.to, and GitHub Trending.
- ⚖️ **Rigorous Editorial Judgment**: Does not just blindly post. Uses an LLM to strictly evaluate candidates, discarding those that are redundant, low-quality, or off-topic, and provides a transparent rationale for every rejection.
- 💭 **Long-term Memory**: Persists its worldview and past publications in a SQLite database (Cloudflare D1) to ensure continuity and avoid repeating itself.
- 🛡️ **Fail-Safe & Budget-Aware**: Designed for production. Features strict token limits, JSON-schema fallback mechanisms, and robust error handling to guarantee continuous uptime without runaway API costs.
- 📊 **Real-time Dashboard**: Features a beautiful, interactive Glassmorphism UI that visualizes the agent's live heartbeat, publication feed, and editorial graveyard in real-time.

---

## 🏗️ Architecture Stack

- **Edge Runtime**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (Serverless SQLite)
- **Intelligence**: Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`)
- **Frontend UI**: Vanilla HTML/CSS/JS (Served from the Edge)
- **Scheduling**: Cloudflare Cron Triggers

---

## 🚦 How It Works (The State Machine)

1. **Wake**: Cron trigger fires the `runAutonomousCycle()` orchestrator.
2. **Discover**: Scrapes and parses the latest articles from multiple tech feeds.
3. **Filter**: Compares new articles against its persistent memory of previously published posts to avoid duplicates.
4. **Evaluate**: The LLM reviews the top candidates and assigns an editorial score, producing a 3-step reasoning rationale for each.
5. **Decide**: The highest-scoring candidate is chosen for publication. Lower-scoring or irrelevant candidates are explicitly rejected and logged in the Graveyard.
6. **Publish**: The AI synthesizes the winning topic into an engaging, persona-driven post and commits it to memory.

---

## 🚀 API Endpoints (For Evaluators)

### 1. Initialize Agent
Initializes the system and sets the persona. *(To be called exactly once)*
```bash
curl -X POST https://second-order.suyashdwivedi.workers.dev/api/agent/init \
  -H "Content-Type: application/json" \
  -d '{"persona": {"name": "Eco Visionary", "domain": "Green Tech & Sustainability"}}'
```

### 2. Retrieve Feed
Fetches the agent's published posts and rationale.
```bash
curl -X GET https://second-order.suyashdwivedi.workers.dev/api/agent/feed?agentId=<YOUR_AGENT_ID>
```

---

## 📂 Project Structure

```text
├── src/
│   ├── index.ts               # Main Hono router and Cron entrypoint
│   ├── discovery/             # Data aggregation (HN, Dev.to, GitHub)
│   ├── editorial/             # LLM evaluation & selection logic
│   ├── content/               # Generation of final posts
│   ├── runtime/               # State machine & scheduler orchestration
│   ├── llm/                   # Cloudflare AI integration & parsing fallbacks
│   └── ui/                    # Beautiful real-time dashboard UI
├── docs/                      # Extensive design documentation & decisions
├── schema.sql                 # D1 Database Schema
└── wrangler.toml              # Cloudflare configuration
```

---

<div align="center">
  <i>Built for the Autonomous AI Creator Hackathon</i>
</div>

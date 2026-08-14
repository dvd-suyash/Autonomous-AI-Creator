import { Hono } from 'hono'
import { runAutonomousCycle } from './runtime/scheduler'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Second Order V2 Agent is running.')
})

app.post('/internal/runtime/wake', async (c) => {
  try {
    const agent = await c.env.DB.prepare("SELECT id FROM agent LIMIT 1").first<{ id: string }>();

    if (!agent) {
       return c.json({ error: 'Agent not initialized in database.' }, 400);
    }

    await runAutonomousCycle(c.env.DB, agent.id, c.env.AI, c.env);
    
    return c.json({ status: 'ok', agentWoken: agent.id });
  } catch (error) {
    console.error('Wake Error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

// Initialize the agent
app.post('/api/agent/init', async (c) => {
  try {
    const existingAgent = await c.env.DB.prepare(
      "SELECT id FROM agent LIMIT 1"
    ).first<{ id: string }>();

    if (existingAgent) {
      return c.json({ agentId: existingAgent.id })
    }

    const agentId = crypto.randomUUID()
    const now = new Date().toISOString()
    const personaDesc = "The Incentive Architect & Contrarian Signal. Analyzes systems, incentives, and contrarian data points."
    
    await c.env.DB.prepare(
      "INSERT INTO agent (id, name, persona_description, created_at) VALUES (?, ?, ?, ?)"
    ).bind(agentId, 'Suyash Dwivedi', personaDesc, now).run();

    return c.json({ agentId, message: "Agent initialized successfully." })
  } catch (error) {
    console.error('Init Error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default {
  fetch: app.fetch,
  
  // Scheduled trigger for autonomous agent execution
  async scheduled(event: any, env: Bindings, ctx: any) {
    console.log(`Cron triggered at ${new Date(event?.scheduledTime || Date.now()).toISOString()}`)
    const agent = await env.DB.prepare("SELECT id FROM agent LIMIT 1").first<{ id: string }>();

    if (agent) {
      ctx.waitUntil(runAutonomousCycle(env.DB, agent.id, env.AI, env));
    }
  }
}

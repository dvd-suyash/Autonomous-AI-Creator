export function renderDashboard(data: {
  agent: any,
  posts: any[],
  rejections: any[],
  memories: any[],
  cycles: any[],
  state: any,
  totalSpent: number
}) {
  const { agent, posts, rejections, cycles, memories, state, totalSpent } = data;

  // Compute status
  const isRunning = state?.state === 'RUNNING';
  const statusColor = isRunning ? 'bg-amber-500' : 'bg-emerald-500';
  const statusPulse = isRunning ? 'animate-pulse' : '';
  const statusText = isRunning ? 'RUNNING - Evaluating Candidates' : 'IDLE - Sleeping';
  const lockedUntil = state?.locked_until ? new Date(state.locked_until).toLocaleTimeString() : '';
  
  const statusLabel = isRunning 
    ? `Will finish around ${lockedUntil}` 
    : (state?.last_successful_cycle_at 
        ? `Last run: <span class="log-time" data-time="${new Date(state.last_successful_cycle_at).toISOString()}"></span>` 
        : 'Waiting for first run');

  // Compute source distribution from the latest successful cycle with metadata
  let sourceDistributionHTML = '<p class="text-sm text-slate-500">Waiting for data...</p>';
  const latestCycleWithMeta = cycles.find(c => c.metadata);
  if (latestCycleWithMeta) {
    try {
      const meta = JSON.parse(latestCycleWithMeta.metadata);
      if (meta.sources && Object.keys(meta.sources).length > 0) {
        const total = Object.values(meta.sources).reduce((a: any, b: any) => a + b, 0) as number;
        sourceDistributionHTML = Object.entries(meta.sources).map(([src, count]: [string, any]) => {
          const pct = Math.round((count / total) * 100);
          return `
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-slate-400">${src.replace('_', ' ')}</span>
              <span class="text-slate-300 font-mono">${pct}%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 mb-3">
              <div class="bg-accent h-1.5 rounded-full" style="width: ${pct}%"></div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {}
  }

  // Merge and sort ALL logs chronologically (newest first)
  const logs = [
    ...posts.map(p => ({ type: 'PUBLISH' as const, date: new Date(p.created_at).getTime(), raw: p })),
    ...rejections.map(r => ({ type: 'REJECT' as const, date: new Date(r.decided_at).getTime(), raw: r })),
    ...cycles.map(c => ({ type: 'CYCLE' as const, date: new Date(c.started_at).getTime(), raw: c }))
  ].sort((a, b) => b.date - a.date);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus - Autonomous AI Agent</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        dark: '#0a0f1c',
                        card: '#111827',
                        accent: '#38bdf8'
                    },
                    fontFamily: {
                        mono: ['"Fira Code"', 'monospace'],
                        sans: ['Inter', 'sans-serif']
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Fira+Code:wght@400;600&display=swap');
        body { background-color: #0a0f1c; color: #f8fafc; font-family: 'Inter', sans-serif; overflow: hidden; }
        .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); }
        .hide-scroll::-webkit-scrollbar { width: 6px; }
        .hide-scroll::-webkit-scrollbar-track { background: transparent; }
        .hide-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .hide-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .log-container { font-family: 'Fira Code', monospace; font-size: 0.85rem; }
        .log-green { color: #10b981; }
        .log-red { color: #f43f5e; }
        .log-cyan { color: #22d3ee; }
        .log-time { color: #64748b; }

        /* Fancy Gradient Text */
        .text-gradient {
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-image: linear-gradient(to right, #38bdf8, #818cf8);
        }

        /* Tabs */
        .tab-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; color: #94a3b8; }
        .tab-btn:hover { color: #f8fafc; background: rgba(255,255,255,0.05); }
        .tab-btn.active { color: #f8fafc; background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.3); }
    </style>
</head>
<body class="h-screen flex flex-col p-4 md:p-6 gap-6 relative">
    
    <!-- Background Glow Effects -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

    <!-- Top Banner -->
    <header class="glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-2xl border-t-4 border-accent shrink-0 z-10 gap-6">
        <div>
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">
                ${agent.name}
            </h1>
            <p class="text-accent text-sm md:text-base font-medium tracking-wide uppercase">
                Autonomous AI Agent &#x2022; Technology Commentator
            </p>
        </div>
        
        <div class="flex gap-6 items-center">
            <!-- Cost Tracker -->
            <div class="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                    <div class="text-xs text-slate-400 font-bold uppercase tracking-wider">Total LLM Cost</div>
                    <div class="text-xl font-mono font-bold text-emerald-400">$${totalSpent.toFixed(6)} <span class="text-xs text-slate-500">/ $1.00 limit</span></div>
                </div>
            </div>

            <!-- Status / Countdown Indicator -->
            <div class="bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 flex items-center gap-4 min-w-[220px]">
                ${isRunning ? `
                <div class="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]"></div>
                <div>
                    <div class="text-xs text-amber-500 font-bold uppercase tracking-wider">Agent Status</div>
                    <div class="text-sm font-bold text-slate-200">AWAKE & EVALUATING</div>
                </div>
                ` : `
                <div class="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                    <div class="text-xs text-slate-400 font-bold uppercase tracking-wider">Next Wake Cycle</div>
                    <div class="text-xl font-mono font-bold text-slate-200" id="next-wake-countdown">--:--</div>
                </div>
                `}
            </div>
        </div>
    </header>

    <!-- Two Halves -->
    <main class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 min-h-0 z-10">
        
        <!-- Left Half: Intelligence & Memory -->
        <section class="flex flex-col gap-6 min-h-0">
            
            <!-- Sources Box -->
            <div class="glass rounded-2xl p-6 shrink-0">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                    Source Distribution (Last Scan)
                </h3>
                ${sourceDistributionHTML}
            </div>

            <!-- Info Section -->
            <div class="glass rounded-2xl p-6 flex-1 overflow-y-auto hide-scroll flex flex-col gap-6 relative">
                
                <div class="space-y-3">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        What is this?
                    </h2>
                    <p class="text-slate-300 leading-relaxed text-sm">
                        This is a completely independent AI agent living on the edge (Cloudflare Workers). 
                        It wakes up autonomously every 20 minutes, reads the latest news across the web, evaluates the content, and writes its own thesis-driven thoughts if it finds something highly impactful.
                    </p>
                </div>

                <div class="space-y-4 pt-6 border-t border-slate-800 pb-2">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Hackathon Evaluation Checklist
                    </h3>
                    <p class="text-slate-400 text-sm mb-4">This agent is engineered to fulfill all core requirements for the Autonomous AI Creator challenge:</p>
                    
                    <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 hover:border-emerald-500/40 transition-colors group cursor-default">
                        <h4 class="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs">1</span> Autonomous Topic Discovery
                        </h4>
                        <p class="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                            Scans <strong>Hacker News</strong>, <strong>Reddit</strong> (Tech/AI/Science), and <strong>Dev.to</strong> dynamically. Uses a rolling 2-hour cache to filter out stale news and prioritize fresh candidates.
                        </p>
                    </div>

                    <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 hover:border-emerald-500/40 transition-colors group cursor-default">
                        <h4 class="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs">2</span> Editorial Judgment & Persona
                        </h4>
                        <p class="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                            The agent actively rejects low-impact topics via Llama-3.2 reasoning (see graveyard in Red logs). Maintains a strict thesis-driven tech persona, refusing to publish generic summaries.
                        </p>
                    </div>

                    <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 hover:border-emerald-500/40 transition-colors group cursor-default">
                        <h4 class="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs">3</span> Long-term Memory & Rationale
                        </h4>
                        <p class="text-slate-400 text-xs leading-relaxed mb-2 group-hover:text-slate-300 transition-colors">
                            <strong>Memory:</strong> Extracts core theses from every post into SQLite and injects them back into its prompt on the next wake cycle to completely avoid repetition.
                        </p>
                        <p class="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                            <strong>Rationale:</strong> Every API payload returns a structured rationale explicitly answering: <em>Why selected? Why relevant now? What sources were used?</em>
                        </p>
                    </div>

                    <div class="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 hover:border-emerald-500/40 transition-colors group cursor-default">
                        <h4 class="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs">4</span> Enterprise Cost Control
                        </h4>
                        <p class="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                            Hard-capped at $1.00/day with real-time token tracking. If API fails, it seamlessly degrades to a deterministic fallback heuristic without crashing.
                        </p>
                    </div>
                </div>
            </div>

        </section>

        <!-- Right Half: Live Logs & Observability -->
        <section class="flex flex-col gap-4 min-h-0">
            
            <!-- Filters -->
            <div class="glass rounded-xl p-2 flex gap-2 overflow-x-auto hide-scroll shrink-0 border-b border-slate-800">
                <button class="tab-btn active" data-filter="ALL">All Logs</button>
                <button class="tab-btn" data-filter="PUBLISH">Publishes (${posts.length})</button>
                <button class="tab-btn" data-filter="REJECT">Rejections (${rejections.length})</button>
                <button class="tab-btn" data-filter="CYCLE">System Heartbeats (${cycles.length})</button>
            </div>

            <!-- Terminal Logs -->
            <div class="flex-1 glass rounded-xl p-6 overflow-y-auto hide-scroll bg-[#05080f] shadow-inner relative">
                <div class="flex items-center gap-2 mb-4 sticky top-0 bg-[#05080f] py-2 border-b border-slate-800 z-10">
                    <div class="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></div>
                    <div class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
                    <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                    <span class="ml-2 text-xs font-mono text-slate-500">observability-console.log &#x2014; live autonomous audit trail</span>
                </div>
                
                <div class="space-y-4 log-container flex flex-col" id="log-window">
                    ${logs.length === 0 ? '<div class="text-slate-500 italic">Waiting for agent activity...</div>' : ''}
                    
                    ${logs.map(log => {
                        const rawIso = new Date(log.date).toISOString();
                        const placeholderTime = rawIso.replace('T', ' ').substring(0, 19) + ' UTC';

                        if (log.type === 'CYCLE') {
                            const c = log.raw;
                            const duration = c.completed_at ? Math.round((new Date(c.completed_at).getTime() - new Date(c.started_at).getTime()) / 1000) : '...';
                            const statusIcon = c.status === 'COMPLETED' ? '&#x2713;' : c.status === 'FAILED' ? '&#x2717;' : '&#x27F3;';
                            const statusColor = c.status === 'FAILED' ? 'text-rose-400' : 'text-cyan-400';
                            let meta: any = {};
                            try { meta = JSON.parse(c.metadata || '{}'); } catch(e) {}
                            const scanned = meta.totalScanned || 0;
                            const newCount = meta.newCandidates || c.candidates_discovered || 0;
                            return `
                                <div class="log-entry opacity-80 hover:opacity-100 transition-opacity" data-type="CYCLE">
                                    <span class="log-time" data-time="${rawIso}">[${placeholderTime}]</span> <span class="${statusColor} font-bold">SYSTEM: Agent Wake Cycle ${statusIcon}</span>
                                    <div class="log-cyan ml-4 text-xs mt-1 opacity-80 border-l-2 border-cyan-900 pl-3">
                                        duration=${duration}s | scanned=${scanned} articles | ${newCount} new | approved=${c.candidates_approved || 0} | rejected=${c.candidates_rejected || 0} | published=${c.posts_published || 0}${c.error_message ? ' | error=' + c.error_message : ''}
                                    </div>
                                </div>
                            `;
                        } else if (log.type === 'PUBLISH') {
                            const json = JSON.stringify({
                                action: "PUBLISH",
                                rationale: log.raw.rationale,
                                generated_text: log.raw.text
                            }, null, 2);
                            return `
                                <div class="log-entry opacity-90 hover:opacity-100 transition-opacity" data-type="PUBLISH">
                                    <span class="log-time" data-time="${rawIso}">[${placeholderTime}]</span> <span class="text-emerald-500 font-bold">INFO: Editorial Passed</span>
                                    <pre class="log-green mt-1 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/50 whitespace-pre-wrap break-words">${json}</pre>
                                </div>
                            `;
                        } else {
                            const json = JSON.stringify({
                                action: "REJECT",
                                title: log.raw.title,
                                rationale: log.raw.rationale
                            }, null, 2);
                            return `
                                <div class="log-entry opacity-60 hover:opacity-100 transition-opacity" data-type="REJECT">
                                    <span class="log-time" data-time="${rawIso}">[${placeholderTime}]</span> <span class="text-rose-500 font-bold">WARN: Candidate Rejected</span>
                                    <pre class="log-red mt-1 bg-rose-950/20 p-3 rounded-lg border border-rose-900/50 whitespace-pre-wrap break-words">${json}</pre>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>

        </section>

    </main>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Countdown Logic
            const countdownEl = document.getElementById('next-wake-countdown');
            if (countdownEl) {
                setInterval(() => {
                    const now = Date.now();
                    const twentyMins = 20 * 60 * 1000;
                    // Cloudflare Cron runs on UTC 0, 20, 40. 
                    // Using epoch math completely bypasses local timezone offset bugs (like +05:30).
                    let nextWake = Math.ceil(now / twentyMins) * twentyMins;
                    
                    if (nextWake === now) {
                        nextWake += twentyMins;
                    }

                    const diff = nextWake - now;
                    const m = Math.floor(diff / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    countdownEl.textContent = m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
                }, 1000);
            }

            // Convert timestamps to Local Time
            document.querySelectorAll('.log-time').forEach(el => {
                const isoTime = el.getAttribute('data-time');
                if (isoTime) {
                    const date = new Date(isoTime);
                    el.innerHTML = '[' + date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) + ']';
                }
            });

            // Filtering Logic
            const tabs = document.querySelectorAll('.tab-btn');
            const entries = document.querySelectorAll('.log-entry');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Update Active State
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Filter entries
                    const filter = tab.getAttribute('data-filter');
                    entries.forEach((entry) => {
                        const type = entry.getAttribute('data-type');
                        if (filter === 'ALL' || type === filter) {
                            (entry).style.display = 'block';
                        } else {
                            (entry).style.display = 'none';
                        }
                    });
                });
            });
        });
    </script>
</body>
</html>`;
}

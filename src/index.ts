import { Hono } from 'hono'
import { runAutonomousCycle } from './runtime/scheduler'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT c.*, p.content as post_content, p.format as post_format 
    FROM runtime_cycles c 
    LEFT JOIN posts p ON c.id = p.cycle_id 
    ORDER BY c.started_at DESC LIMIT 50
  `).all();
  const cycles = results as any[];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TANGENT_CORE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        display: ['Syne', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        bg: '#000000',
                        surface: '#121212',
                        accent: '#FF2040',
                        ink: '#EAEAEA',
                        dim: '#777777'
                    }
                }
            }
        }
    </script>
    <style>
        .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        [x-cloak] { display: none !important; }
        body, html {
            margin: 0; padding: 0;
            background-color: #000000;
            color: #EAEAEA;
            font-family: 'JetBrains Mono', monospace;
        }
        
        .scroll-space { height: 600vh; width: 100%; }

        .grid-overlay {
            position: fixed; inset: 0; z-index: 1; pointer-events: none;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 5vw 5vw;
        }

        /* 1. BACKGROUND TEXT LAYER (Behind the robot) */
        .bg-text-layer {
            position: fixed; top: 0; left: 0; width: 100%; height: 100vh; z-index: 2;
            pointer-events: none; padding: 0 4vw;
        }
        .bg-text-content {
            width: 100%; position: absolute; top: 0; left: 0;
            opacity: 0; visibility: hidden;
        }
        .bg-giant-text {
            position: absolute; font-size: 8vw; line-height: 0.8;
            font-family: 'Syne', sans-serif; font-weight: 800;
            letter-spacing: -0.02em;
            color: transparent;
            -webkit-text-stroke: 3px rgba(255, 32, 64, 0.9);
        }

        /* 2. VIDEO LAYER */
        .bg-container {
            position: fixed; inset: 0; z-index: 5;
            pointer-events: none;
            mix-blend-mode: screen;
            /* Fade out the left edge smoothly into transparency */
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40%);
            mask-image: linear-gradient(to right, transparent 0%, black 40%);
        }
        
        #bg-video {
            width: 100%; height: 100%;
            object-fit: cover; object-position: 80% center;
            filter: contrast(1.1) grayscale(0.2);
        }

        /* 3. FOREGROUND UI LAYER */
        .ui-layer {
            position: fixed; inset: 0; z-index: 10;
            pointer-events: none; display: flex; align-items: center; padding: 0 4vw;
        }
        .section-content {
            width: 100%; position: absolute;
            opacity: 0; visibility: hidden; pointer-events: none;
        }

        /* Ticker Tape */
        .ticker-tape {
            position: fixed; bottom: 4vw; left: -10vw; width: 120vw;
            background: #FF2040; color: #080808;
            font-family: 'JetBrains Mono', monospace; font-weight: 800; text-transform: uppercase;
            padding: 0.5rem 0; z-index: 20; transform: rotate(-2deg);
            white-space: nowrap; overflow: hidden; pointer-events: none;
        }
        .ticker-content {
            display: inline-block; animation: ticker 20s linear infinite;
        }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        /* UI Elements */
        .brutal-box {
            background-color: #080808; border: 2px solid #EAEAEA; padding: 1.5rem; position: relative;
        }
        .brutal-box::before {
            content: ''; position: absolute; top: 6px; left: 6px; right: -8px; bottom: -8px;
            border: 2px solid #FF2040; z-index: -1;
        }
        
        .brutal-badge {
            background: #EAEAEA; color: #080808; font-weight: 800; text-transform: uppercase;
            padding: 0.2rem 0.75rem; border: 2px solid #EAEAEA; display: inline-block;
        }

        .brutal-btn {
            pointer-events: auto; /* Re-enable clicks only on interactive buttons to avoid blocking scroll */
            background-color: #FF2040; color: #080808;
            border: 2px solid #FF2040; font-weight: 800; text-transform: uppercase;
            padding: 1rem 2rem; display: inline-block; cursor: pointer;
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .brutal-btn::after {
            content: ''; position: absolute; top: 4px; left: 4px; width: 100%; height: 100%;
            border: 2px solid #EAEAEA; z-index: -1; transition: all 0.15s ease;
        }
        .brutal-btn:hover { transform: translate(-2px, -2px); }
        .brutal-btn:hover::after { transform: translate(4px, 4px); }
        .brutal-btn:active { transform: scale(0.96) translate(2px, 2px); }
        .brutal-btn:active::after { transform: translate(0, 0); border-color: #FF2040; }

        .brutal-btn-alt { background-color: #080808; color: #EAEAEA; border-color: #EAEAEA; }
        .brutal-btn-alt::after { border-color: #FF2040; }
    </style>
</head>
<body x-data="{ modalOpen: false }" :class="modalOpen ? 'overflow-hidden' : ''">

    <!-- SYSTEM BOOT PRELOADER -->
    <div id="boot-screen" class="fixed inset-0 z-[9999] bg-bg flex flex-col items-center justify-center font-mono text-accent text-xs tracking-[0.3em]">
        <div class="mb-6 text-4xl font-display text-ink font-bold opacity-80" style="transform: scale(0.98);">TANGENT</div>
        <div>ESTABLISHING_NEURAL_LINK<span class="animate-pulse">_</span></div>
    </div>

    <div class="grid-overlay"></div>
    <div class="ticker-tape">
        <div class="ticker-content">
            // TANGENT_CORE // AUTONOMOUS SOCIAL ENGINE // ZERO HUMAN OVERSIGHT // CLOUDFLARE EDGE DEPLOYED // TAVILY NEURAL SEARCH ACTIVATED // D1 STATE TRACKING // TANGENT_CORE // AUTONOMOUS SOCIAL ENGINE // ZERO HUMAN OVERSIGHT // CLOUDFLARE EDGE DEPLOYED // TAVILY NEURAL SEARCH ACTIVATED // D1 STATE TRACKING //
        </div>
    </div>

    <!-- LAYER 1: GIANT BACKGROUND TEXT -->
    <div class="bg-text-layer">
        <div class="bg-text-content sec-1" style="opacity: 1; visibility: visible;">
            <div class="bg-giant-text top-12 left-0">TANGENT</div>
        </div>
        <div class="bg-text-content sec-2">
            <div class="bg-giant-text top-12 left-0">EDGE</div>
        </div>
        <div class="bg-text-content sec-3">
            <div class="bg-giant-text top-12 left-0">OUTPUT</div>
        </div>
    </div>

    <!-- LAYER 2: VIDEO -->
    <div class="bg-container">
        <video id="bg-video" muted playsinline preload="auto"></video>
    </div>

    <!-- LAYER 3: FOREGROUND UI -->
    <div class="ui-layer">
        <div class="section-content sec-1" style="opacity: 1; visibility: visible;">
            <div class="relative z-20 max-w-xl mt-24">
                <div class="brutal-badge mb-6 text-xs !bg-[#00FF41] !border-[#00FF41] !text-black">SYS_STATE: ONLINE</div>
                <h1 class="text-7xl md:text-8xl font-display font-bold uppercase leading-[0.9] mb-8 text-ink tracking-tight">
                    NO MANUAL<br>TRIGGERS.
                </h1>
                <div class="brutal-box">
                    <h2 class="font-bold text-accent uppercase mb-4 text-sm tracking-widest">Autonomous AI Creator Agent</h2>
                    <p class="text-dim text-sm leading-relaxed max-w-md">
                        Tangent is an AI that runs entirely on its own schedule. Every day, it crawls the web for tech news, uses Llama 3 to form a unique contrarian opinion, and publishes its thoughts directly to Threads—without a human ever clicking a button.
                    </p>
                    <a href="https://www.threads.net/@dvdsuyash" target="_blank" rel="noopener noreferrer" class="brutal-btn text-xs tracking-widest mt-6 inline-block bg-bg text-ink border-ink hover:bg-ink hover:text-bg transition-colors">
                        INITIATE_CONTACT // @DVDSUYASH
                    </a>
                </div>
            </div>
        </div>

        <div class="section-content sec-2">
            <div class="relative z-20 max-w-2xl mt-32">
                <h1 class="text-6xl md:text-8xl font-display font-bold uppercase leading-[0.9] mb-6 text-ink tracking-tight bg-accent text-bg inline-block px-4 py-2">
                    ARCHITECTURE.
                </h1>
                <div class="flex flex-col md:flex-row gap-4 mt-4 relative z-10">
                    <div class="bg-bg border-2 border-ink p-6 flex-1">
                        <div class="text-accent font-bold text-xs mb-2">01 // RESEARCH</div>
                        <p class="text-dim text-xs leading-relaxed">Tangent actively queries the live internet using Tavily Neural Search to find breaking news in tech and related fields.</p>
                    </div>
                    <div class="bg-ink text-bg border-2 border-ink p-6 flex-1 transform md:translate-y-8">
                        <div class="text-accent font-bold text-xs mb-2">02 // EXECUTION</div>
                        <p class="text-bg/70 text-xs leading-relaxed">Operating entirely on Cloudflare's serverless edge, it evaluates the news, avoids duplicate topics using its D1 memory, and drafts a post.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-content sec-3">
            <div class="relative z-20 max-w-lg mt-24">
                <div class="brutal-badge mb-6 text-xs bg-bg text-ink border-ink">TELEMETRY_LOGS</div>
                <h1 class="text-6xl md:text-8xl font-display font-bold uppercase leading-[0.9] mb-8 text-ink tracking-tight">
                    INSPECT<br>THE CORE.
                </h1>
                <p class="text-dim text-sm leading-relaxed mb-10 max-w-sm border-l-2 border-accent pl-4">
                    We don't hide the AI's internal monologue. Open the live execution feed to see exactly what Tangent researched, what it decided to skip, and what it ultimately published today.
                </p>
                <div class="flex flex-col sm:flex-row gap-6">
                    <a href="https://github.com/dvd-suyash/Autonomous-AI-Creator" target="_blank" rel="noopener noreferrer" class="brutal-btn text-xs tracking-widest">
                        GITHUB_REPO
                    </a>
                    <button @click="modalOpen = true" class="brutal-btn brutal-btn-alt text-xs tracking-widest uppercase cursor-pointer">
                        LIVE_FEED
                    </button>
                </div>
            </div>
        </div>
    </div>

        <!-- TELEMETRY MODAL -->
    <div x-show="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" style="display: none;" x-cloak>
        <div x-show="modalOpen" x-transition.opacity.duration.300ms class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="modalOpen = false"></div>
        <div x-show="modalOpen" 
             x-transition:enter="transition ease-out duration-500" 
             x-transition:enter-start="opacity-0 translate-y-12 scale-95" 
             x-transition:enter-end="opacity-100 translate-y-0 scale-100" 
             x-transition:leave="transition ease-in duration-300" 
             x-transition:leave-start="opacity-100 translate-y-0 scale-100" 
             x-transition:leave-end="opacity-0 translate-y-12 scale-95" 
             class="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col border-2 border-accent bg-bg/95 shadow-[8px_8px_0_0_#FF2040]">
            
            <div class="flex justify-between items-center p-4 border-b-2 border-accent bg-accent text-bg">
                <div class="font-bold tracking-widest text-sm uppercase">TELEMETRY_LOGS // SYSTEM_STREAM</div>
                <button @click="modalOpen = false" class="hover:bg-bg hover:text-accent px-2 py-1 font-bold transition-colors uppercase text-xs">
                    [ CLOSE ]
                </button>
            </div>
            
            <div class="overflow-y-auto p-4 sm:p-8 flex-1">
                <table class="w-full text-left font-mono">
                    <thead class="text-[9px] text-ink/50 uppercase tracking-[0.2em] hidden md:table-header-group">
                        <tr>
                            <th class="pb-4 font-normal">Timestamp</th>
                            <th class="pb-4 font-normal">Status</th>
                            <th class="pb-4 font-normal hidden sm:table-cell">Latency</th>
                            <th class="pb-4 font-normal text-right">Inspect</th>
                        </tr>
                    </thead>
                    <tbody x-data="{ expanded: null }" class="text-[11px] sm:text-xs">
                        ${cycles.map(cy => `
                            <tr @click="expanded = expanded === '${cy.id}' ? null : '${cy.id}'" 
                                class="border-b border-ink/10 hover:bg-ink/5 transition-colors cursor-pointer group">
                                <td class="py-4 pr-4 text-dim">
                                    ${new Date(cy.started_at).toLocaleString(undefined, {month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit'})}
                                </td>
                                <td class="py-4 pr-4 tracking-widest">
                                    ${cy.outcome === 'PUBLISHED' ? '<span class="text-[#00FF41]">SUCCESS</span>' 
                                    : cy.outcome === 'SKIPPED' ? '<span class="text-dim">SKIPPED</span>' 
                                    : cy.error_message ? '<span class="text-accent" title="' + cy.error_message + '">ERROR</span>'
                                    : '<span class="text-ink animate-pulse">PROCESSING</span>'}
                                </td>
                                <td class="py-4 pr-4 text-dim hidden sm:table-cell">
                                    ${cy.duration_ms ? (cy.duration_ms/1000).toFixed(2) + 's' : '—'}
                                </td>
                                <td class="py-4 text-right">
                                    <span class="text-dim group-hover:text-accent transition-colors text-base leading-none font-bold">
                                        <span x-show="expanded !== '${cy.id}'">+</span>
                                        <span x-show="expanded === '${cy.id}'" x-cloak>-</span>
                                    </span>
                                </td>
                            </tr>
                            <tr x-show="expanded === '${cy.id}'" 
                                x-collapse.duration.300ms
                                x-cloak 
                                class="bg-surface">
                                <td colspan="4" class="p-0">
                                    <div class="p-5 sm:p-6 border-l-2 border-accent ml-2 my-4">
                                        <div class="font-mono text-[9px] text-accent mb-4 uppercase tracking-[0.2em] font-bold">>> Output_Payload</div>
                                        ${cy.post_content 
                                            ? '<div class="space-y-4 font-mono text-xs text-ink/80">' +
                                                 (() => {
                                                     try {
                                                         const parsed = JSON.parse(cy.post_content);
                                                         if(Array.isArray(parsed)) {
                                                             return parsed.map((p, i) => '<p class="pl-4 border-l border-ink/20"><span class="text-dim text-[10px] mr-2">' + (i+1) + '/</span>' + p + '</p>').join('');
                                                         }
                                                         return '<p>' + parsed + '</p>';
                                                     } catch(e) {
                                                         return '<p>' + cy.post_content + '</p>';
                                                     }
                                                 })() +
                                               '</div>'
                                            : '<p class="text-dim italic text-sm">NULL</p>'}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${cycles.length === 0 ? `
                            <tr>
                                <td colspan="4" class="py-8 text-center text-dim tracking-widest text-[10px] uppercase">Awaiting_Data</td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>


    <div class="scroll-space"></div>

    <script src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <script>
        /* --- LENIS COMMENTED OUT ---
        // Initialize Lenis Virtual Scroll
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth, heavy deceleration
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
        });

        // Sync Lenis with GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
        ----------------------------- */

        gsap.registerPlugin(ScrollTrigger);
        
        const video = document.getElementById('bg-video');
        video.src = 'https://files.catbox.moe/8oayq8.mp4';
        video.load();

        // Hide preloader when video is ready (Disney Principle: Fast exit ease-in, subtle anticipation scale)
        const hidePreloader = () => {
            const bootScreen = document.getElementById('boot-screen');
            if(bootScreen && bootScreen.style.display !== 'none') {
                gsap.to(bootScreen, { 
                    opacity: 0, 
                    scale: 1.02,
                    duration: 0.25, 
                    ease: "power3.in", 
                    onComplete: () => { bootScreen.style.display = 'none'; } 
                });
            }
        };

        video.addEventListener('canplaythrough', hidePreloader, { once: true });
        video.addEventListener('loadeddata', hidePreloader, { once: true });
        setTimeout(hidePreloader, 3500); // Fallback timeout if network is extremely slow

        // 100% Bulletproof GSAP Init: We don't wait for the video to load.
        // We know the video is ~10s long, so we build the timeline immediately.
        // This guarantees the scroll ALWAYS works, zero race conditions.
        const duration = 10;
        let scrollState = { time: 0 };

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".scroll-space",
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                /* --- SNAP COMMENTED OUT ---
                snap: {
                    snapTo: [0, 0.5, 1],
                    duration: { min: 0.5, max: 1 },
                    delay: 0.1,
                    ease: "power2.inOut"
                }
                ----------------------------- */
            }
        });

        tl.to(scrollState, {
            time: duration, duration: duration, ease: "none",
            onUpdate: () => { 
                if(video.readyState >= 1) {
                    try { video.currentTime = scrollState.time; } catch(e) {}
                }
            }
        }, 0);

        const animateSection = (secClass, enterTime, exitTime) => {
            const bgContent = ".bg-text-content" + secClass;
            const fgContent = ".section-content" + secClass;

            if(enterTime !== null) {
                tl.fromTo([bgContent, fgContent], 
                    { opacity: 0, x: 80, visibility: "hidden" },
                    { opacity: 1, x: 0, visibility: "visible", duration: 1, ease: "power4.out" }, enterTime 
                );
            }
            if(exitTime !== null) {
                tl.to([bgContent, fgContent], {
                    opacity: 0, x: -80, duration: 1, ease: "power3.in",
                    onComplete: () => {
                        gsap.set(bgContent, { visibility: "hidden" });
                        gsap.set(fgContent, { visibility: "hidden" });
                    },
                    onReverseComplete: () => {
                        gsap.set(bgContent, { visibility: "visible" });
                        gsap.set(fgContent, { visibility: "visible" });
                    }
                }, exitTime);
            }
        };

        animateSection(".sec-1", null, 1.5);
        animateSection(".sec-2", 3.5, duration - 3);
        animateSection(".sec-3", duration - 1.5, null);
    </script>
</body>
</html>

`;
  return c.html(html);
})

app.post('/internal/runtime/wake', async (c) => {
  try {
    const agent = await c.env.DB.prepare("SELECT id FROM agent LIMIT 1").first<{ id: string }>();

    if (!agent) {
       return c.json({ error: 'Agent not initialized in database.' }, 400);
    }

    c.executionCtx.waitUntil(runAutonomousCycle(c.env.DB, agent.id, c.env.AI, c.env));
    
    return c.json({ status: 'ok', agentWoken: agent.id });
  } catch (error) {
    console.error('Wake Error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

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
    const personaDesc = "The Incentive Architect & Contrarian Signal."
    
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
  async scheduled(event: any, env: Bindings, ctx: any) {
    console.log(`Cron triggered at ${new Date(event?.scheduledTime || Date.now()).toISOString()}`)
    const agent = await env.DB.prepare("SELECT id FROM agent LIMIT 1").first<{ id: string }>();

    if (agent) {
      ctx.waitUntil(runAutonomousCycle(env.DB, agent.id, env.AI, env));
    }
  }
}

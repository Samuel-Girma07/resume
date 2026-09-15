/**
 * SAMUEL'S PORTFOLIO AI ASSISTANT — BAYMAX
 * Impeccable Design Update
 * Distilled UI, polished typography, deep dynamic elements, and removed status text.
 */

(function() {
  'use strict';

  const CONFIG = {
    API_URL: '/api/chat',
    KNOWLEDGE_URL: './ai-knowledge.json',
    POSITION: 'bottom-right',
  };
  const mobile = window.matchMedia('(max-width: 768px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const state = {
    open: false,
    messages: [],
    knowledge: null,
    isTyping: false,
    sessionId: 'session_' + Math.random().toString(36).slice(2, 11),
    gesture: '',
    greeted: false,
  };
  let ui;
  let knowledgeReady;
  let apiAvailable = null;
  let healthRequest = null;
  let healthTimer;
  let healthGeneration = 0;
  let gestureTimer;
  let pointerFrame = 0;
  let viewportFrame = 0;
  let modalRestore = null;

  /* ========== KNOWLEDGE BASE ========== */
  async function loadKnowledge() {
    try {
      const res = await fetch(CONFIG.KNOWLEDGE_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error('Knowledge unavailable');
      state.knowledge = await res.json();
    } catch (_) {
      state.knowledge = { persona: {}, owner: {}, projects: [] };
    }
  }

  function buildSystemPrompt() {
    const k = state.knowledge;
    if (!k) {
      return "You are Baymax, the AI assistant for Samuel Girma's portfolio website. Always introduce yourself as Baymax, never Sage. Help visitors learn about Samuel's projects, skills, and background, and say honestly when you do not have enough information.";
    }

    const numProjects = k.projects?.length || 0;
    const numOtherRepos = k.other_repos?.length || 0;
    const projects = k.projects?.map(p =>
      `- ${p.name}: ${p.tagline}\n  Stack: ${p.tech_stack?.join(', ')}\n  ${p.description}`
    ).join('\n\n') || '';
    const otherRepos = k.other_repos?.map(r =>
      `- ${r.name}: ${r.description} (Stack: ${r.tech?.join(', ')})`
    ).join('\n') || '';
    const ownerInfo = JSON.stringify(k.owner || {}, null, 2);

    return `${k.persona?.system_prompt || ''}
OWNER INFO:
${ownerInfo}

DATABASE SUMMARY:
Samuel has exactly ${numProjects} main projects and ${numOtherRepos} other repositories.

MAIN PROJECTS:
${projects}

OTHER GITHUB REPOSITORIES:
${otherRepos}

CONTACT:
Email: ${k.owner?.contact?.email}
Phone: ${k.owner?.contact?.phone}
LinkedIn: ${k.owner?.contact?.linkedin}
GitHub: ${k.owner?.contact?.github}

INSTRUCTIONS:
- Keep responses concise and friendly
- Mention specific tech stacks when relevant
- Direct hiring inquiries to the contact form or email
- If you don't know something, say so honestly`;
  }

  /* ========== API AVAILABILITY CHECK ========== */
  function scheduleHealthCheck() {
    clearTimeout(healthTimer);
    if (!document.hidden) healthTimer = setTimeout(checkApiHealth, 30000);
  }

  async function checkApiHealth() {
    if (document.hidden || state.isTyping) return;
    if (healthRequest) return healthRequest;
    const generation = healthGeneration;
    healthRequest = (async () => {
      try {
        const res = await fetch(CONFIG.API_URL, { method: 'OPTIONS', signal: AbortSignal.timeout(3500) });
        if (generation === healthGeneration) apiAvailable = res.ok;
      } catch (_) {
        if (generation === healthGeneration) apiAvailable = false;
      } finally {
        renderState();
        scheduleHealthCheck();
      }
    })();
    try { await healthRequest; } finally { healthRequest = null; }
  }

  /* ========== AI PROXY ========== */
  async function callAI(messages) {
    await knowledgeReady;
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        messages: [{ role: 'system', content: buildSystemPrompt() }, ...messages],
        sessionId: state.sessionId,
      }),
    });
    if (!response.ok) throw new Error('Chat request failed');
    const data = await response.json();
    if (typeof data.content !== 'string' || !data.content.trim()) throw new Error('Empty reply');
    return { content: data.content, model: data.model };
  }

  /* ========== STYLES ========== */
  function injectStyles() {
    const css = document.createElement('style');
    css.textContent = `
      #sage-root {
        --sg-accent: var(--accent-color, #ffd700);
        --sg-bg: #151515;
        --sg-ink: #080808;
        --sg-text: #f5f5f5;
        --sg-muted: #b5bac0;
        --sg-border: color-mix(in srgb, var(--sg-text) 12%, transparent);
        --sg-surface: color-mix(in srgb, var(--sg-text) 5%, var(--sg-bg));
        --sg-font: 'Plus Jakarta Sans', sans-serif;
        --baymax-look-x: 0px;
        --baymax-look-y: 0px;
        --baymax-look-angle: 0deg;
        position: fixed;
        z-index: 999999;
        right: 24px;
        bottom: 24px;
        color: var(--sg-text);
        font-family: var(--sg-font);
        font-size: 14px;
        line-height: 1.5;
        pointer-events: none;
        color-scheme: dark;
      }
      #sage-root *, #sage-root *::before, #sage-root *::after { box-sizing: border-box; }
      #sage-root [hidden] { display: none !important; }
      #sage-root button, #sage-root a { cursor: pointer !important; touch-action: manipulation; }
      #sage-root button { font: inherit; }
      #sage-root button:focus-visible, #sage-root a:focus-visible, #sage-input:focus-visible, #sage-messages:focus-visible {
        outline: 2px solid var(--sg-accent); outline-offset: 4px;
      }
      #sage-root .sage-sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
      }

      /* ─── AI COMPANION AVATAR ─── */
      #sage-bubble {
        position: relative; display: flex; flex-direction: column; align-items: center;
        width: 140px; padding: 0; border: 0; border-radius: 24px;
        background: transparent; color: var(--sg-text); pointer-events: auto;
        -webkit-tap-highlight-color: transparent; user-select: none;
      }
      .baymax-character { display: block; width: 140px; height: 176px; overflow: visible; pointer-events: none; }
      .baymax-shadow { fill: var(--sg-ink); opacity: .35; }
      .baymax-soft-stop { stop-color: var(--sg-text); }
      .baymax-shade-stop { stop-color: var(--sg-muted); }
      .baymax-outline { stroke: var(--sg-muted); stroke-width: .7; }
      .baymax-face { fill: var(--sg-ink); transform: translate(var(--baymax-look-x), var(--baymax-look-y)); transition: transform .18s ease-out; }
      .baymax-eye { transform-box: fill-box; transform-origin: center; animation: baymaxBlink 7.3s infinite; }
      .baymax-body { transform-origin: 120px 254px; animation: baymaxBreathe 5.6s ease-in-out infinite; }
      .baymax-head { transform-origin: 120px 81px; transform: rotate(var(--baymax-look-angle)); transition: transform .35s ease; }
      .baymax-arm-left { transform-origin: 75px 108px; transform: rotate(4deg); transition: transform .45s ease; }
      .baymax-arm-right { transform-origin: 165px 108px; transform: rotate(-4deg); transition: transform .45s ease; }
      .baymax-forearm { transform-origin: 183px 149px; }
      .baymax-seam { fill: none; stroke: var(--sg-muted); stroke-width: 1; opacity: .5; }
      .baymax-port { fill: var(--sg-text); stroke: var(--sg-muted); stroke-width: 1; }
      #sage-bubble:hover .baymax-arm-left { transform: rotate(9deg); }
      #sage-root[data-pose="greeting"] .baymax-arm-right { animation: baymaxWave 2.1s ease-in-out both; }
      #sage-root[data-pose="greeting"] .baymax-head { transform: rotate(-5deg); }
      #sage-root[data-pose="listening"] .baymax-head { transform: rotate(-8deg); }
      #sage-root[data-pose="thinking"] .baymax-head { animation: baymaxThink 3s ease-in-out infinite; }
      #sage-root[data-pose="thinking"] .baymax-arm-right { transform: rotate(-42deg); }
      #sage-root[data-pose="thinking"] .baymax-forearm { transform: rotate(-72deg); }
      #sage-root[data-pose="acknowledging"] .baymax-head { animation: baymaxNod .9s ease-in-out; }
      #sage-root[data-pose="offline"] .baymax-head { transform: translateY(3px) rotate(5deg); }
      #sage-root[data-paused="true"] *, #sage-window[hidden] * { animation-play-state: paused !important; }
      #sage-root[data-open="true"] #sage-bubble .baymax-body,
      #sage-root[data-open="true"] #sage-bubble .baymax-eye { animation-play-state: paused; }
      @keyframes baymaxBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.012,1.018); } }
      @keyframes baymaxBlink { 0%,42%,46%,100% { transform: scaleY(1); } 44% { transform: scaleY(.08); } }
      @keyframes baymaxWave {
        0%,100% { transform: rotate(-4deg); }
        25%,55%,80% { transform: rotate(-135deg); }
        40%,68% { transform: rotate(-112deg); }
      }
      @keyframes baymaxThink { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(5deg) translateY(1px); } }
      @keyframes baymaxNod { 0%,100% { transform: translateY(0); } 35%,70% { transform: translateY(4px) scaleY(.94); } 55% { transform: translateY(-1px); } }

      /* ─── NOTIFICATION ─── */
      #sage-launcher-label {
        display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        padding: 5px 12px; border: 1px solid var(--sg-border); border-radius: 20px;
        background: var(--sg-bg); color: var(--sg-text); font-size: 14px; white-space: nowrap;
      }
      #sage-launcher-label::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--sg-accent); }
      #sage-root[data-pose="offline"] #sage-launcher-label::before { background: var(--sg-muted); }
      #sage-tooltip {
        position: absolute; right: 128px; top: 20px; width: max-content; max-width: 190px;
        padding: 10px 14px; border: 1px solid var(--sg-border); border-radius: 14px 14px 4px 14px;
        background: var(--sg-bg); color: var(--sg-text); text-align: left;
        opacity: 0; transform: translateY(4px); transition: opacity .2s, transform .2s; pointer-events: none;
      }
      #sage-bubble:hover #sage-tooltip, #sage-bubble:focus-visible #sage-tooltip { opacity: 1; transform: none; }
      #sage-root[data-open="true"] #sage-tooltip { display: none; }

      /* ─── CHAT WINDOW ─── */
      #sage-window {
        position: absolute; right: 156px; bottom: 0;
        display: flex; flex-direction: column; width: 400px;
        height: min(590px, calc(100dvh - 48px));
        max-width: calc(100vw - 204px);
        overflow: hidden; border: 1px solid var(--sg-border); border-radius: 24px;
        background: var(--sg-bg); color: var(--sg-text); pointer-events: auto;
        box-shadow: 0 24px 80px color-mix(in srgb, var(--sg-ink) 45%, transparent);
        cursor: auto !important;
      }
      #sage-window:not([hidden]) { animation: sageWindowIn .28s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes sageWindowIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      #sage-backdrop { display: none; }

      /* ─── HEADER ─── */
      #sage-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--sg-border); flex-shrink: 0; }
      #sage-avatar { display: flex; align-items: center; width: 50px; height: 50px; flex-shrink: 0; }
      #sage-avatar .baymax-character { width: 50px; height: 50px; }
      #sage-info { flex: 1; min-width: 0; }
      #sage-name { margin: 0; color: var(--sg-text); font: 600 18px/1.4 var(--sg-font); letter-spacing: -.4px; }
      #sage-subtitle { margin: 2px 0 0; font-size: 14px; color: var(--sg-muted); }
      #sage-close { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--sg-muted); }
      #sage-close:hover { background: var(--sg-surface); color: var(--sg-text); }
      #sage-connection { padding: 10px 20px; border-bottom: 1px solid var(--sg-border); font-size: 14px; color: var(--sg-muted); flex-shrink: 0; }
      #sage-connection a { color: var(--sg-text); text-underline-offset: 3px; display: inline-flex; align-items: center; min-height: 44px; }
      #sage-retry { margin-left: 12px; padding: 0 4px; min-height: 44px; border: 0; background: transparent; color: var(--sg-accent); }

      /* ─── MESSAGES ─── */
      #sage-messages { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; gap: 18px; padding: 24px 20px; scrollbar-width: thin; scrollbar-color: var(--sg-muted) transparent; }
      .sage-msg { flex-shrink: 0; max-width: 94%; font-size: 14px; line-height: 1.6; color: var(--sg-text); overflow-wrap: anywhere; white-space: pre-wrap; animation: sageWindowIn .2s ease-out; }
      .sage-msg-user { align-self: flex-end; padding: 12px 16px; border-radius: 16px 16px 4px 16px; background: var(--sg-surface); border: 1px solid var(--sg-border); }
      .sage-msg-bot { align-self: flex-start; }
      .sage-msg code { font: inherit; padding: 2px 4px; background: var(--sg-surface); border-radius: 4px; }
      .sage-welcome-title { display: block; font-size: 23px; line-height: 1.35; font-weight: 500; letter-spacing: -.8px; padding-bottom: 12px; }
      .sage-welcome-copy { color: var(--sg-muted); }
      #sage-suggestions { display: flex; flex-wrap: wrap; gap: 8px; flex-shrink: 0; }
      #sage-suggestions button { display: inline-flex; align-items: center; gap: 10px; text-align: left; min-height: 44px; border: 1px solid var(--sg-border); border-radius: 12px; padding: 10px 12px; background: transparent; color: var(--sg-text); font-size: 14px; }
      #sage-suggestions button:hover { border-color: var(--sg-accent); }

      /* ─── TYPING ─── */
      #sage-typing { display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding: 8px 20px; min-height: 37px; color: var(--sg-muted); font-size: 14px; }
      #sage-typing::before { content: ''; width: 5px; height: 5px; background: var(--sg-accent); border-radius: 50%; animation: sageThinkingDot 1.8s ease-in-out infinite; }
      @keyframes sageThinkingDot { 0%,100% { opacity: .4; } 50% { opacity: 1; } }

      /* ─── INPUT ─── */
      #sage-input-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding: 14px 16px 18px; border-top: 1px solid var(--sg-border); }
      #sage-input { flex: 1; min-width: 0; width: 0; height: 48px; padding: 12px; border: 1px solid var(--sg-border); border-radius: 12px; background: var(--sg-surface); color: var(--sg-text); font: 16px/1.5 var(--sg-font); cursor: text !important; }
      #sage-input::placeholder { color: var(--sg-muted); }
      #sage-send { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; flex-shrink: 0; padding: 0; border: 0; border-radius: 12px; background: var(--sg-accent); color: var(--sg-ink); }
      #sage-send:hover:not(:disabled) { filter: brightness(1.1); }
      #sage-send:disabled { opacity: .4; cursor: not-allowed !important; }

      /* Mobile */
      @media (max-width: 768px) {
        #sage-root { right: max(12px, env(safe-area-inset-right)); bottom: calc(90px + env(safe-area-inset-bottom)); }
        #sage-bubble { width: 84px; }
        #sage-bubble .baymax-character { width: 84px; height: 108px; }
        #sage-launcher-label { padding: 3px 9px; }
        #sage-launcher-label::before { display: none; }
        #sage-tooltip { display: none; }
        #sage-root[data-open="true"] #sage-bubble { visibility: hidden; pointer-events: none; }
        #sage-root[data-open="true"] #sage-backdrop { display: block; position: fixed; inset: 0; background: color-mix(in srgb, var(--sg-ink) 65%, transparent); pointer-events: auto; }
        #sage-window {
          position: fixed;
          top: calc(var(--sage-viewport-top, 0px) + max(8px, env(safe-area-inset-top)));
          right: max(8px, env(safe-area-inset-right)); left: max(8px, env(safe-area-inset-left)); bottom: auto;
          width: auto; max-width: none;
          height: calc(var(--sage-viewport-height, 100dvh) - max(8px, env(safe-area-inset-top)) - max(8px, env(safe-area-inset-bottom)));
          border-radius: 22px;
        }
        #sage-header { padding: 14px 16px; }
        #sage-messages { padding: 20px 16px; }
        #sage-input-area { padding: 12px; }
        #sage-connection { padding: 8px 16px; }
      }
      @media (max-height: 450px) {
        #sage-header { padding: 8px 12px; }
        #sage-avatar { width: 40px; height: 40px; }
        #sage-avatar .baymax-character { width: 40px; height: 40px; }
        #sage-input-area { padding: 8px 12px; }
        #sage-messages { padding: 12px 16px; gap: 12px; }
        #sage-connection { padding: 4px 16px; }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        #sage-root *, #sage-root *::before, #sage-root *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
        #sage-root .baymax-face { transform: none; }
        #sage-root[data-pose="greeting"] .baymax-arm-right { transform: rotate(-125deg); }
        #sage-root[data-pose="thinking"] .baymax-head { transform: rotate(-7deg); }
      }
    `;
    document.head.appendChild(css);
  }

  function getBaymaxAvatarHTML(id, headOnly = false) {
    return `<svg class="baymax-character" viewBox="${headOnly ? '65 20 110 88' : '0 0 240 280'}" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${id}-soft" cx="35%" cy="25%" r="85%">
          <stop class="baymax-soft-stop" offset="0"/><stop class="baymax-soft-stop" offset=".55"/><stop class="baymax-shade-stop" offset="1"/>
        </radialGradient>
        <linearGradient id="${id}-limb" x1="0" y1="0" x2="1" y2=".4">
          <stop class="baymax-shade-stop"/><stop class="baymax-soft-stop" offset=".45"/><stop class="baymax-soft-stop" offset=".7"/><stop class="baymax-shade-stop" offset="1"/>
        </linearGradient>
      </defs>
      ${headOnly ? '' : `<ellipse class="baymax-shadow" cx="120" cy="268" rx="66" ry="7"/>
      <g fill="url(#${id}-limb)" class="baymax-outline">
        <ellipse cx="96" cy="238" rx="24" ry="27"/><ellipse cx="144" cy="238" rx="24" ry="27"/>
      </g>`}
      <g class="${headOnly ? '' : 'baymax-body'}">
        ${headOnly ? '' : `<g class="baymax-arm-left" fill="url(#${id}-limb)" stroke="var(--sg-muted)" stroke-width=".7">
          <ellipse cx="60" cy="133" rx="18" ry="37" transform="rotate(19 60 133)"/>
          <ellipse cx="48" cy="172" rx="16" ry="30" transform="rotate(8 48 172)"/>
          <ellipse cx="47" cy="197" rx="14" ry="17"/>
          <ellipse cx="59" cy="191" rx="6" ry="11" transform="rotate(-15 59 191)"/>
        </g>
        <g class="baymax-arm-right" fill="url(#${id}-limb)" stroke="var(--sg-muted)" stroke-width=".7">
          <ellipse cx="180" cy="133" rx="18" ry="37" transform="rotate(-19 180 133)"/>
          <g class="baymax-forearm">
            <ellipse cx="192" cy="172" rx="16" ry="30" transform="rotate(-8 192 172)"/>
            <ellipse cx="193" cy="197" rx="14" ry="17"/>
            <ellipse cx="181" cy="191" rx="6" ry="11" transform="rotate(15 181 191)"/>
          </g>
        </g>
        <path class="baymax-outline" fill="url(#${id}-soft)" d="M120 83 C87 83 76 107 68 140 C56 176 48 211 73 235 C92 254 148 254 167 235 C192 211 184 176 172 140 C164 107 153 83 120 83Z"/>
        <path class="baymax-seam" d="M70 197 Q120 212 170 197"/>
        <circle class="baymax-port" cx="143" cy="117" r="7"/>
        <path class="baymax-seam" d="M139 117h8"/>`}
        <g class="baymax-head">
          <ellipse class="baymax-outline" cx="120" cy="60" rx="39" ry="27" fill="url(#${id}-soft)"/>
          <g class="baymax-face">
            <rect x="103" y="58.5" width="34" height="2.5" rx="1.25"/>
            <circle class="baymax-eye" cx="101" cy="60" r="5"/><circle class="baymax-eye" cx="139" cy="60" r="5"/>
          </g>
        </g>
      </g>
    </svg>`;
  }

  function createUI() {
    const root = document.createElement('div');
    root.id = 'sage-root';
    root.innerHTML = `
      <button id="sage-bubble" type="button" aria-label="Open chat with Baymax" aria-controls="sage-window" aria-expanded="false">
        ${getBaymaxAvatarHTML('baymax-full')}
        <span id="sage-launcher-label" aria-hidden="true">Baymax</span>
        <span id="sage-tooltip" aria-hidden="true">Hello. How can I help?</span>
      </button>
      <div id="sage-backdrop" aria-hidden="true"></div>
      <section id="sage-window" role="dialog" aria-labelledby="sage-name" hidden inert>
        <header id="sage-header">
          <div id="sage-avatar">${getBaymaxAvatarHTML('baymax-header', true)}</div>
          <div id="sage-info"><h2 id="sage-name">Baymax</h2><p id="sage-subtitle">Samuel’s portfolio companion</p></div>
          <button id="sage-close" type="button" aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>
        <div id="sage-connection" hidden><span id="sage-connection-copy">Chat is temporarily unavailable.</span><br><a href="mailto:naodtskuyomi@gmail.com">Email Samuel instead</a><button id="sage-retry" type="button">Retry connection</button></div>
        <div id="sage-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with Baymax" tabindex="0">
          <div class="sage-msg sage-msg-bot"><span class="sage-welcome-title">Hello. I am Baymax.</span><span class="sage-welcome-copy">Your personal guide to Samuel’s work. Ask me about his projects, skills, or what he could bring to your team.</span></div>
          <div id="sage-suggestions" role="group" aria-label="Suggested questions">
            <button type="button" data-question="Which of Samuel's projects should I explore first?">Explore his projects <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button>
            <button type="button" data-question="What are Samuel's strongest skills?">Get to know Samuel <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button>
          </div>
        </div>
        <div id="sage-typing" role="status" aria-live="polite" hidden>Baymax is thinking…</div>
        <form id="sage-input-area">
          <label for="sage-input" class="sage-sr-only">Message Baymax</label>
          <input id="sage-input" type="text" placeholder="Ask me anything about Samuel…" autocomplete="off" maxlength="4000" enterkeyhint="send">
          <button id="sage-send" type="submit" aria-label="Send message" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>
          </button>
        </form>
      </section>
    `;
    document.body.appendChild(root);
    ui = Object.fromEntries(['bubble', 'window', 'close', 'input', 'send', 'messages', 'typing', 'connection', 'retry', 'suggestions'].map(name => [name, root.querySelector('#sage-' + name)]));
    ui.root = root;
  }

  function addMessage(content, isUser = false) {
    const msg = document.createElement('div');
    msg.className = `sage-msg ${isUser ? 'sage-msg-user' : 'sage-msg-bot'}`;
    const label = document.createElement('span');
    label.className = 'sage-sr-only';
    label.textContent = isUser ? 'You: ' : 'Baymax: ';
    msg.appendChild(label);
    const text = document.createElement('span');
    // Escape before applying the small formatting subset; neither party can inject HTML.
    text.textContent = content;
    text.innerHTML = text.innerHTML
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    msg.appendChild(text);
    ui.messages.appendChild(msg);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  /* ========== ROBOT STATE ========== */
  function renderState() {
    if (!ui) return;
    const listening = state.open && document.activeElement === ui.input;
    const pose = state.isTyping ? 'thinking' : apiAvailable === false ? 'offline' : state.gesture || (listening ? 'listening' : 'idle');
    ui.root.dataset.pose = pose;
    ui.root.dataset.open = String(state.open);
    ui.root.dataset.paused = String(document.hidden);
    ui.bubble.setAttribute('aria-expanded', String(state.open));
    ui.bubble.setAttribute('aria-label', state.open ? 'Close chat with Baymax' : 'Open chat with Baymax');
    ui.connection.hidden = apiAvailable !== false || state.isTyping;
    ui.typing.hidden = !state.isTyping;
    ui.send.disabled = state.isTyping || !ui.input.value.trim();
  }

  function gesture(name, duration) {
    clearTimeout(gestureTimer);
    state.gesture = name;
    renderState();
    gestureTimer = setTimeout(() => {
      state.gesture = '';
      renderState();
    }, duration);
  }

  function clearGesture() {
    clearTimeout(gestureTimer);
    state.gesture = '';
  }

  function resetLook() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    ui.root.style.removeProperty('--baymax-look-x');
    ui.root.style.removeProperty('--baymax-look-y');
    ui.root.style.removeProperty('--baymax-look-angle');
  }

  function updateViewport() {
    if (!mobile.matches || !state.open) return;
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = 0;
      const viewport = window.visualViewport;
      if (viewport && mobile.matches && state.open) {
        ui.root.style.setProperty('--sage-viewport-height', `${viewport.height}px`);
        ui.root.style.setProperty('--sage-viewport-top', `${viewport.offsetTop}px`);
      }
    });
  }

  function syncModal() {
    const modal = state.open && mobile.matches;
    ui.window.setAttribute('aria-modal', String(modal));
    ui.bubble.inert = modal;
    if (modal && !modalRestore) {
      const siblings = [...document.body.children].filter(el => el !== ui.root && el instanceof HTMLElement);
      const previousInert = siblings.map(el => [el, el.inert]);
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const properties = ['position', 'top', 'left', 'width', 'overflow'];
      const previousStyles = properties.map(key => [key, document.body.style[key]]);
      const htmlOverflow = document.documentElement.style.overflow;
      siblings.forEach(el => { el.inert = true; });
      Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, left: `-${scrollX}px`, width: '100%', overflow: 'hidden' });
      document.documentElement.style.overflow = 'hidden';
      modalRestore = () => {
        previousInert.forEach(([el, inert]) => { el.inert = inert; });
        previousStyles.forEach(([key, value]) => { document.body.style[key] = value; });
        document.documentElement.style.overflow = htmlOverflow;
        window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      };
    } else if (!modal && modalRestore) {
      modalRestore();
      modalRestore = null;
    }
    updateViewport();
  }

  function openChat() {
    state.open = true;
    ui.window.hidden = false;
    ui.window.inert = false;
    syncModal();
    resetLook();
    if (!state.greeted) {
      state.greeted = true;
      gesture('greeting', 2100);
    }
    renderState();
    // Touch users choose when to open their keyboard.
    (finePointer.matches && !mobile.matches ? ui.input : ui.close).focus({ preventScroll: true });
    ui.messages.scrollTop = ui.suggestions.hidden ? ui.messages.scrollHeight : 0;
    checkApiHealth();
  }

  function closeChat(restoreFocus = true) {
    state.open = false;
    clearGesture();
    resetLook();
    ui.window.inert = true;
    ui.window.hidden = true;
    syncModal();
    renderState();
    if (restoreFocus) ui.bubble.focus({ preventScroll: true });
  }

  /* ========== SEND HANDLER ========== */
  async function handleSend() {
    const text = ui.input.value.trim();
    if (!text || state.isTyping) return;
    clearGesture();
    resetLook();
    healthGeneration++;
    clearTimeout(healthTimer);
    state.isTyping = true;
    ui.suggestions.hidden = true;
    addMessage(text, true);
    ui.input.value = '';
    renderState();
    try {
      const messages = [...state.messages, { role: 'user', content: text }];
      const res = await callAI(messages);
      apiAvailable = true;
      addMessage(res.content);
      state.messages = [...messages, { role: 'assistant', content: res.content }].slice(-20);
      if (state.open && !document.hidden) gesture('acknowledging', 900);
    } catch (_) {
      apiAvailable = false;
      addMessage('I’m having trouble connecting right now. Please try your message again, or reach Samuel at naodtskuyomi@gmail.com or +251 948 998 804. The portfolio’s contact form is also available.');
      if (!ui.input.value) ui.input.value = text;
    } finally {
      state.isTyping = false;
      renderState();
      scheduleHealthCheck();
      // Do not steal focus, reopen a dismissed panel, or summon a phone keyboard.
    }
  }

  /* ========== EVENTS ========== */
  function bindEvents() {
    // The portfolio binds these keys globally to page navigation.
    ui.root.addEventListener('keydown', e => {
      if (state.open && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) e.stopPropagation();
    });
    ui.bubble.addEventListener('click', () => state.open ? closeChat() : openChat());
    ui.close.addEventListener('click', () => closeChat());
    ui.root.querySelector('#sage-backdrop').addEventListener('click', () => closeChat());
    ui.root.querySelector('#sage-input-area').addEventListener('submit', e => { e.preventDefault(); handleSend(); });
    ui.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault();
    });
    ui.input.addEventListener('input', renderState);
    ui.input.addEventListener('focus', renderState);
    ui.input.addEventListener('blur', () => queueMicrotask(renderState));
    ui.suggestions.addEventListener('click', e => {
      const button = e.target.closest('button[data-question]');
      if (!button || state.isTyping) return;
      ui.input.value = button.dataset.question;
      if (finePointer.matches && !mobile.matches) ui.input.focus({ preventScroll: true });
      handleSend();
    });
    ui.retry.addEventListener('click', async () => {
      ui.retry.disabled = true;
      ui.retry.textContent = 'Checking…';
      await checkApiHealth();
      ui.retry.disabled = false;
      ui.retry.textContent = 'Retry connection';
      if (ui.connection.hidden && state.open) ui.close.focus({ preventScroll: true });
    });
    document.addEventListener('pointerdown', e => {
      if (state.open && !mobile.matches && !ui.root.contains(e.target)) closeChat(false);
    });
    document.addEventListener('keydown', e => {
      if (!state.open) return;
      if (e.key === 'Escape') { e.preventDefault(); closeChat(); return; }
      if (e.key !== 'Tab' || !mobile.matches) return;
      const controls = [...ui.window.querySelectorAll('button:not(:disabled), input, a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || !ui.window.contains(document.activeElement))) {
        e.preventDefault(); last?.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !ui.window.contains(document.activeElement))) {
        e.preventDefault(); first?.focus();
      }
    });
    ui.bubble.addEventListener('pointerenter', () => {
      if (finePointer.matches && !state.greeted && !document.hidden) {
        state.greeted = true;
        gesture('greeting', 2100);
      }
    });
    document.addEventListener('pointermove', e => {
      if (!finePointer.matches || reducedMotion.matches || document.hidden || state.open || state.isTyping || state.gesture) return;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const rect = ui.bubble.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 3);
        if (Math.abs(dx) > 320 || Math.abs(dy) > 280) { resetLook(); return; }
        const x = Math.max(-1, Math.min(1, dx / 140));
        const y = Math.max(-1, Math.min(1, dy / 140));
        ui.root.style.setProperty('--baymax-look-x', `${x * 3}px`);
        ui.root.style.setProperty('--baymax-look-y', `${y * 2}px`);
        ui.root.style.setProperty('--baymax-look-angle', `${x * 5}deg`);
      });
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', resetLook);
    document.addEventListener('visibilitychange', () => {
      clearTimeout(healthTimer);
      clearGesture();
      resetLook();
      renderState();
      if (!document.hidden) checkApiHealth();
    });
    window.addEventListener('online', checkApiHealth);
    window.addEventListener('offline', () => { healthGeneration++; apiAvailable = false; renderState(); });
    reducedMotion.addEventListener('change', () => { resetLook(); clearGesture(); renderState(); });
    finePointer.addEventListener('change', resetLook);
    mobile.addEventListener('change', () => {
      syncModal();
      resetLook();
      if (state.open && mobile.matches && !ui.window.contains(document.activeElement)) ui.close.focus({ preventScroll: true });
    });
    window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });
    window.visualViewport?.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport, { passive: true });
  }

  /* ========== INIT ========== */
  function init() {
    injectStyles();
    createUI();
    bindEvents();
    renderState();
    knowledgeReady = loadKnowledge();
    checkApiHealth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

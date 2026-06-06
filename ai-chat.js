/**
 * SAMUEL'S PORTFOLIO AI ASSISTANT — SAGE
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

  let state = {
    open: false,
    messages: [],
    knowledge: null,
    isTyping: false,
    sessionId: 'session_' + Math.random().toString(36).slice(2, 11),
    robotState: 'idle'
  };

  /* ========== KNOWLEDGE BASE ========== */
  async function loadKnowledge() {
    try {
      const res = await fetch(CONFIG.KNOWLEDGE_URL);
      state.knowledge = await res.json();
    } catch (e) {
      state.knowledge = { persona: {}, owner: {}, projects: [] };
    }
  }

  function buildSystemPrompt() {
    const k = state.knowledge;
    if (!k) return 'You are a helpful assistant.';
    
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
  let apiAvailable = null; // null = unchecked, true = available, false = unavailable

  async function checkApiHealth() {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(CONFIG.API_URL, { method: 'OPTIONS', signal: ctrl.signal });
      clearTimeout(id);
      apiAvailable = res.ok;
    } catch (_) {
      apiAvailable = false;
    }
    
    if (apiAvailable === false) {
      setRobotState('offline');
    } else if (state.robotState === 'offline') {
      setRobotState('idle');
    }
    return apiAvailable;
  }
  
  // Proactive background polling
  setInterval(checkApiHealth, 30000);

  /* ========== AI PROXY ========== */
  async function callAI(messages) {
    // If we already know API is unavailable, fail fast with a helpful message
    if (apiAvailable === false) {
      throw new Error('Chat is offline on static hosting. Please use the contact form below or email naodtskuyomi@gmail.com');
    }

    const apiMessages = [
      { role: 'system', content: buildSystemPrompt() },
      ...messages
    ];
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
      }
      const data = await response.json();
      return { content: data.content, model: data.model };
    } catch (err) {
      // Mark API as unavailable so next time we fail fast
      if (err.name === 'TypeError' || err.message.includes('fetch')) {
        apiAvailable = false;
      }
      throw err;
    }
  }

  /* ========== STYLES ========== */
  function injectStyles() {
    const css = document.createElement('style');
    css.textContent = `
      #sage-root {
        --sg-accent: var(--accent-color, #FFD700);
        --sg-accent-soft: rgba(255,215,0,0.12);
        --sg-accent-mid: rgba(255,215,0,0.25);
        --sg-bg: rgba(10, 10, 10, 0.65);
        --sg-surface: rgba(25, 25, 25, 0.4);
        --sg-border: rgba(255,215,0,0.12);
        --sg-text: var(--text-white, #ffffff);
        --sg-text-muted: var(--text-grey, #a3a3a3);
        --sg-font-head: 'Orbitron', sans-serif;
        --sg-font-body: 'Plus Jakarta Sans', sans-serif;

        position: fixed;
        z-index: 999999;
        ${CONFIG.POSITION.includes('right') ? 'right: 28px;' : 'left: 28px;'}
        bottom: 28px;
        font-family: var(--sg-font-body);
        pointer-events: none;
      }

      #sage-root, #sage-root * { cursor: auto !important; }

      /* ─── AI ROBOT BUTTON ─── */
      #sage-bubble {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        position: relative;
        overflow: visible;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      #sage-bubble:hover { transform: scale(1.15) translateY(-4px); }
      #sage-bubble:active { transform: scale(0.93) translateY(-1px); }

      /* Dynamic Animations mapped to states */
      #sage-bubble.robot-idle { animation: sageBotFloat 4s ease-in-out infinite; }
      #sage-bubble.robot-hover { animation: sageBotWiggle 0.6s ease-in-out; }
      #sage-bubble.robot-listening { animation: sageBotPulse 1.2s ease-in-out infinite; }
      #sage-bubble.robot-thinking { animation: sageBotSpin 3s ease-in-out infinite; }
      #sage-bubble.robot-offline { animation: none; pointer-events: none; }
      #sage-bubble.robot-offline .bm-svg { filter: grayscale(1) brightness(0.45) !important; }
      #sage-bubble.robot-offline .bm-breathe { animation: none !important; }
      #sage-bubble.robot-offline .sage-bg-loader { display: none !important; }
      #sage-bubble.robot-offline .bm-eye { transform: scaleY(0.12) !important; }

      @keyframes sageBotFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-8px) rotate(2deg); }
        50% { transform: translateY(-4px) rotate(-1deg); }
        75% { transform: translateY(-6px) rotate(1.5deg); }
      }
      @keyframes sageBotWiggle {
        0%, 100% { transform: rotate(0deg) scale(1); }
        15% { transform: rotate(-8deg) scale(1.05); }
        30% { transform: rotate(6deg) scale(1.05); }
        45% { transform: rotate(-4deg) scale(1.05); }
        60% { transform: rotate(2deg) scale(1.05); }
        75% { transform: rotate(-1deg) scale(1.02); }
      }
      @keyframes sageBotPulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,215,0,0.3)); }
        50% { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(255,215,0,0.8)); }
      }
      @keyframes sageBotSpin {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(8deg); }
        75% { transform: rotate(-8deg); }
      }

      /* ─── BAYMAX SVG STYLING ─── */
      .bm-svg {
        width: 60px;
        height: 60px;
        filter: drop-shadow(0 6px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 14px rgba(255,215,0,0.18));
        transition: filter 0.3s ease;
        pointer-events: none;
        overflow: visible;
        will-change: transform;
      }
      #sage-bubble:hover .bm-svg {
        filter: drop-shadow(0 8px 18px rgba(0,0,0,0.6)) drop-shadow(0 0 24px rgba(255,215,0,0.4));
      }

      /* Isolated parallax layers — GPU compositing only */
      #bm-body, #bm-head, #bm-face {
        will-change: transform;
        transform: translate3d(0,0,0);
      }
      #bm-body { transform-origin: 50% 100%; }
      #bm-head { transform-origin: 50% 70%; }

      /* Idle breathing — drives the whole figure */
      .bm-breathe {
        animation: bmBreathe 4.5s ease-in-out infinite;
        transform-origin: 50% 92%;
      }
      @keyframes bmBreathe {
        0%, 100% { transform: scale(1, 1); }
        50% { transform: scale(1.025, 1.04); }
      }

      /* Autonomous blink — smooth Y squash */
      .bm-eye {
        transform-box: fill-box;
        transform-origin: center;
        transition: transform 0.09s ease-in-out;
      }
      .bm-svg.is-blinking .bm-eye { transform: scaleY(0.08); }

      /* Click rubber-band pop feedback */
      .bm-svg.is-popping { animation: bmPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      @keyframes bmPop {
        0% { transform: scale(1); }
        35% { transform: scale(1.18, 0.86); }
        65% { transform: scale(0.94, 1.08); }
        100% { transform: scale(1); }
      }

      /* ─── NOTIFICATION ─── */
      #sage-notify {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
        background: var(--sg-accent);
        border-radius: 50%;
        border: 2px solid #121212;
        box-shadow: 0 0 12px var(--sg-accent);
        animation: notifyPulse 2s infinite;
        pointer-events: none;
      }
      @keyframes notifyPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.4; }
      }

      /* ─── CHAT WINDOW (Impeccable Design) ─── */
      #sage-window {
        position: absolute;
        bottom: 88px;
        ${CONFIG.POSITION.includes('right') ? 'right: 0;' : 'left: 0;'}
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 600px;
        max-height: calc(100vh - 120px);
        background: var(--sg-bg);
        border: 1px solid var(--sg-border);
        border-radius: 24px;
        backdrop-filter: blur(32px) saturate(1.8);
        -webkit-backdrop-filter: blur(32px) saturate(1.8);
        box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        transform: translateY(12px) scale(0.98);
        pointer-events: none;
        transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        transform-origin: bottom ${CONFIG.POSITION.includes('right') ? 'right' : 'left'};
      }
      #sage-window.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* ─── HEADER ─── */
      #sage-header {
        padding: 24px 24px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        display: flex;
        align-items: center;
        gap: 16px;
      }

      #sage-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(18,18,18,0.4);
        border: 1px solid rgba(255,215,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: inset 0 0 20px rgba(255,215,0,0.05);
      }
      #sage-avatar svg { width: 36px; height: 36px; }

      #sage-info { flex: 1; }
      #sage-name {
        font-family: var(--sg-font-head);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--sg-text);
        letter-spacing: 0.5px;
      }

      #sage-close {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: transparent;
        border: none;
        color: var(--sg-text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      #sage-close:hover {
        background: rgba(255,255,255,0.05);
        color: var(--sg-text);
        transform: rotate(90deg);
      }

      /* ─── MESSAGES ─── */
      #sage-messages {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        scrollbar-width: none;
      }
      #sage-messages::-webkit-scrollbar { display: none; }

      .sage-msg {
        max-width: 88%;
        padding: 14px 18px;
        border-radius: 20px;
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--sg-text);
        word-wrap: break-word;
        animation: sageMsgIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        font-weight: 400;
        letter-spacing: 0.2px;
      }
      @keyframes sageMsgIn {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .sage-msg-user {
        align-self: flex-end;
        background: linear-gradient(145deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05));
        border: 1px solid rgba(255,215,0,0.1);
        border-bottom-right-radius: 6px;
      }
      .sage-msg-bot {
        align-self: flex-start;
        background: var(--sg-surface);
        border: 1px solid rgba(255,255,255,0.04);
        border-bottom-left-radius: 6px;
      }
      .sage-msg-bot strong { color: var(--sg-accent); font-weight: 600; }
      .sage-msg-bot code {
        background: rgba(255,255,255,0.05);
        padding: 3px 6px;
        border-radius: 6px;
        color: var(--sg-text);
        font-family: monospace;
        font-size: 0.85em;
        border: 1px solid rgba(255,255,255,0.1);
      }

      /* ─── TYPING ─── */
      #sage-typing {
        display: none;
        align-self: flex-start;
        padding: 8px 14px;
        background: transparent;
        margin-left: 24px;
        margin-bottom: 8px;
      }
      #sage-typing.active { display: flex; align-items: center; justify-content: center; }

      .pl { width: 2.5em; height: 2.5em; }
      .pl__ring { animation: ringA 2s linear infinite; }
      .pl__ring--a { stroke: var(--sg-accent); }
      .pl__ring--b { animation-name: ringB; stroke: rgba(255,255,255,0.8); }
      .pl__ring--c { animation-name: ringC; stroke: var(--sg-accent-mid); }
      .pl__ring--d { animation-name: ringD; stroke: rgba(255,255,255,0.4); }

      @keyframes ringA {
        from, 4% { stroke-dasharray: 0 660; stroke-width: 20; stroke-dashoffset: -330; }
        12% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -335; }
        32% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -595; }
        40%, 54% { stroke-dasharray: 0 660; stroke-width: 20; stroke-dashoffset: -660; }
        62% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -665; }
        82% { stroke-dasharray: 60 600; stroke-width: 30; stroke-dashoffset: -925; }
        90%, to { stroke-dasharray: 0 660; stroke-width: 20; stroke-dashoffset: -990; }
      }
      @keyframes ringB {
        from, 12% { stroke-dasharray: 0 220; stroke-width: 20; stroke-dashoffset: -110; }
        20% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -115; }
        40% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -195; }
        48%, 62% { stroke-dasharray: 0 220; stroke-width: 20; stroke-dashoffset: -220; }
        70% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -225; }
        90% { stroke-dasharray: 20 200; stroke-width: 30; stroke-dashoffset: -305; }
        98%, to { stroke-dasharray: 0 220; stroke-width: 20; stroke-dashoffset: -330; }
      }
      @keyframes ringC {
        from { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: 0; }
        8% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -5; }
        28% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -175; }
        36%, 58% { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -220; }
        66% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -225; }
        86% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -395; }
        94%, to { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -440; }
      }
      @keyframes ringD {
        from, 8% { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: 0; }
        16% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -5; }
        36% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -175; }
        44%, 50% { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -220; }
        58% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -225; }
        78% { stroke-dasharray: 40 400; stroke-width: 30; stroke-dashoffset: -395; }
        86%, to { stroke-dasharray: 0 440; stroke-width: 20; stroke-dashoffset: -440; }
      }

      .sage-bg-loader {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 100%; height: 100%; z-index: -1; pointer-events: none;
      }
      .sage-circle {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 0px; height: 0px; border-radius: 100%; opacity: 0;
        animation: pulse_4923 4s infinite linear;
        border: 0.5px solid var(--sg-accent); box-shadow: 0px 0px 5px var(--sg-accent-mid);
      }
      .sage-circle:nth-child(1) { animation-delay: .2s; }
      .sage-circle:nth-child(2) { animation-delay: .4s; }
      .sage-circle:nth-child(3) { animation-delay: .8s; }
      .sage-circle:nth-child(4) { animation-delay: 1s; }
      @keyframes pulse_4923 {
        0% { opacity: 0.0; width: 0px; height: 0px; transform: translate(-50%, -50%) scale(1); }
        10% { opacity: 0.5; transform: translate(-50%, -50%) scale(2); }
        100% { opacity: 0.0; width: 120px; height: 120px; transform: translate(-50%, -50%) scale(1); }
      }

      /* ─── INPUT ─── */
      #sage-input-area {
        padding: 20px 24px;
        background: transparent;
        display: flex;
        gap: 12px;
        position: relative;
      }
      #sage-input-area::before {
        content: '';
        position: absolute;
        top: 0; left: 24px; right: 24px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      }
      #sage-input {
        flex: 1;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 24px;
        padding: 14px 20px;
        color: var(--sg-text);
        font-family: inherit;
        font-size: 0.95rem;
        outline: none;
        transition: all 0.3s ease;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
      }
      #sage-input::placeholder { color: rgba(255,255,255,0.25); }
      #sage-input:focus { 
        border-color: rgba(255,215,0,0.3); 
        background: rgba(255,255,255,0.04); 
        box-shadow: 0 0 0 3px rgba(255,215,0,0.05), inset 0 2px 4px rgba(0,0,0,0.2);
      }

      #sage-send {
        width: 48px; height: 48px;
        flex-shrink: 0;
        border-radius: 50%;
        background: var(--sg-accent);
        border: none;
        color: #121212;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 12px rgba(255,215,0,0.3);
      }
      #sage-send:hover { 
        transform: scale(1.08) translateY(-2px); 
        box-shadow: 0 8px 16px rgba(255,215,0,0.4);
      }
      #sage-send:disabled { 
        opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; filter: grayscale(1);
      }

      /* Mobile */
      @media (max-width: 520px) {
        #sage-root { right: 16px !important; left: 16px !important; bottom: 85px; }
        #sage-window {
          width: 100%; height: 60vh;
          bottom: 75px; right: 0 !important; left: 0 !important;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        #sage-bubble, .bm-svg *, .bm-breathe { animation: none !important; }
        .sage-msg { animation: none; }
      }
    `;
    document.head.appendChild(css);
  }

  /* ========== BAYMAX SVG (layered, parallax-ready) ========== */
  function getRobotSVG() {
    return `
      <svg class="bm-svg" viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <!-- Soft glossy volumetric body shading -->
          <radialGradient id="bmBodyGrad" cx="0.38" cy="0.3" r="0.85">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="55%" stop-color="#f3f4f6"/>
            <stop offset="100%" stop-color="#c8ccd4"/>
          </radialGradient>
          <radialGradient id="bmHeadGrad" cx="0.4" cy="0.32" r="0.9">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="58%" stop-color="#f1f2f5"/>
            <stop offset="100%" stop-color="#c4c8d1"/>
          </radialGradient>
          <linearGradient id="bmRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id="bmFloor" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stop-color="rgba(0,0,0,0.45)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
        </defs>

        <g class="bm-breathe">
          <!-- Contact shadow -->
          <ellipse cx="32" cy="69" rx="17" ry="3.5" fill="url(#bmFloor)"/>

          <!-- ===== BODY (anchor base) ===== -->
          <g id="bm-body">
            <!-- upper torso -->
            <path d="M14 50
                     C14 41 21 36 32 36
                     C43 36 50 41 50 50
                     L50 60
                     C50 67 43 70 32 70
                     C21 70 14 67 14 60 Z"
                  fill="url(#bmBodyGrad)" stroke="#b9bdc6" stroke-width="0.8"/>
            <!-- shoulder highlight -->
            <path d="M20 42 C25 38 39 38 44 42" stroke="url(#bmRim)" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7"/>
            <!-- subtle belly seam -->
            <path d="M32 44 L32 60" stroke="#d4d7de" stroke-width="0.8" opacity="0.5"/>
            <!-- little chest port (heart core) -->
            <circle cx="32" cy="52" r="3.4" fill="#fafbfc" stroke="#cfd3da" stroke-width="0.8"/>
            <circle cx="32" cy="52" r="1.4" fill="#FFD700" opacity="0.85"/>
          </g>

          <!-- ===== HEAD ===== -->
          <g id="bm-head">
            <!-- oval head outline -->
            <ellipse cx="32" cy="22" rx="20" ry="15" fill="url(#bmHeadGrad)" stroke="#b9bdc6" stroke-width="0.8"/>
            <!-- glossy top highlight -->
            <ellipse cx="26" cy="15" rx="9" ry="4.5" fill="#ffffff" opacity="0.65"/>

            <!-- ===== FACE (eyes + connecting slot) ===== -->
            <g id="bm-face">
              <!-- connecting horizontal slot line -->
              <line x1="20" y1="23" x2="44" y2="23" stroke="#111315" stroke-width="2.2" stroke-linecap="round"/>
              <!-- left eye -->
              <circle class="bm-eye" cx="22" cy="23" r="4.1" fill="#111315"/>
              <!-- right eye -->
              <circle class="bm-eye" cx="42" cy="23" r="4.1" fill="#111315"/>
            </g>
          </g>
        </g>
      </svg>
    `;
  }

  /* Flat minimalist mask profile for the chat header */
  function getMaskSVG() {
    return `
      <svg class="bm-mask" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="24" cy="18" rx="21" ry="15" fill="#f3f4f6" stroke="#c4c8d1" stroke-width="1"/>
        <line x1="9" y1="18" x2="39" y2="18" stroke="#111315" stroke-width="3" stroke-linecap="round"/>
        <circle cx="11" cy="18" r="4.2" fill="#111315"/>
        <circle cx="37" cy="18" r="4.2" fill="#111315"/>
      </svg>
    `;
  }

  /* ========== UI ========== */
  function createUI() {
    const root = document.createElement('div');
    root.id = 'sage-root';
    root.innerHTML = `
      <div id="sage-bubble" class="robot-idle" role="button" aria-label="Open AI Assistant">
        <div class="sage-bg-loader">
          <div class="sage-circle"></div><div class="sage-circle"></div>
          <div class="sage-circle"></div><div class="sage-circle"></div>
        </div>
        ${getRobotSVG()}
        <div id="sage-notify"></div>
      </div>
      <div id="sage-window" role="dialog" aria-label="Chat with Sage">
        <div id="sage-header">
          <div id="sage-avatar">
            ${getMaskSVG()}
          </div>
          <div id="sage-info">
            <div id="sage-name">SAGE</div>
          </div>
          <button id="sage-close" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="sage-messages">
          <div class="sage-msg sage-msg-bot">
            Hello. I am <strong>Baymax</strong>, your personal portfolio companion. How can I help you today?
          </div>
        </div>
        <div id="sage-typing">
          <svg class="pl" width="240" height="240" viewBox="0 0 240 240">
            <circle class="pl__ring pl__ring--a" cx="120" cy="120" r="105" fill="none" stroke-width="20" stroke-dasharray="0 660" stroke-dashoffset="-330" stroke-linecap="round"></circle>
            <circle class="pl__ring pl__ring--b" cx="120" cy="120" r="35" fill="none" stroke-width="20" stroke-dasharray="0 220" stroke-dashoffset="-110" stroke-linecap="round"></circle>
            <circle class="pl__ring pl__ring--c" cx="85" cy="120" r="70" fill="none" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
            <circle class="pl__ring pl__ring--d" cx="155" cy="120" r="70" fill="none" stroke-width="20" stroke-dasharray="0 440" stroke-linecap="round"></circle>
          </svg>
        </div>
        <div id="sage-input-area">
          <input id="sage-input" type="text" placeholder="Initialize query..." autocomplete="off">
          <button id="sage-send" aria-label="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  }

  /* ========== MESSAGES ========== */
  function addMessage(content, isUser) {
    const el = document.getElementById('sage-messages');
    const msg = document.createElement('div');
    msg.className = `sage-msg ${isUser ? 'sage-msg-user' : 'sage-msg-bot'}`;
    msg.innerHTML = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    el.appendChild(msg);
    el.scrollTop = el.scrollHeight;
  }

  function setTyping(show) {
    state.isTyping = show;
    document.getElementById('sage-typing').classList.toggle('active', show);
    if (show) {
      document.getElementById('sage-messages').scrollTop = document.getElementById('sage-messages').scrollHeight;
    }
  }

  /* ========== ROBOT STATE ========== */
  function setRobotState(newState) {
    const bubble = document.getElementById('sage-bubble');
    if (!bubble) return;
    bubble.classList.remove('robot-idle', 'robot-hover', 'robot-listening', 'robot-thinking', 'robot-offline');
    bubble.classList.add('robot-' + newState);
    state.robotState = newState;
  }

  /* ========== SEND HANDLER ========== */
  async function handleSend() {
    const input = document.getElementById('sage-input');
    const btn = document.getElementById('sage-send');
    const text = input.value.trim();
    if (!text || state.isTyping) return;

    addMessage(text, true);
    state.messages.push({ role: 'user', content: text });
    input.value = '';

    setTyping(true);
    btn.disabled = true;
    setRobotState('thinking');

    try {
      const res = await callAI(state.messages);
      setTyping(false);
      addMessage(res.content);
      state.messages.push({ role: 'assistant', content: res.content });
      setRobotState('idle');
      if (state.messages.length > 20) state.messages = state.messages.slice(-20);
    } catch (err) {
      setTyping(false);
      var isOffline = apiAvailable === false || err.name === 'TypeError' || /fetch|network|offline/i.test(err.message);
      if (isOffline) {
        addMessage('Sorry, the chat assistant is offline on static hosting.<br><br>You can reach Samuel directly:<br>� <strong>Email:</strong> naodtskuyomi@gmail.com<br>� <strong>Phone:</strong> +251 948 998 804<br>� Or use the <strong>contact form</strong> on this page.');
      } else {
        addMessage('Sorry, I\'m having trouble connecting. ' + err.message);
      }
      setRobotState('idle');
    } finally {
      btn.disabled = false;
      input.focus();
    }
  }

  /* ========== EVENTS ========== */
  function bindEvents() {
    const bubble = document.getElementById('sage-bubble');
    const close = document.getElementById('sage-close');
    const win = document.getElementById('sage-window');
    const input = document.getElementById('sage-input');
    const send = document.getElementById('sage-send');

    bubble.addEventListener('mouseenter', () => {
      if (!state.open) setRobotState('hover');
    });

    bubble.addEventListener('mouseleave', () => {
      if (!state.open) setRobotState('idle');
    });

    bubble.addEventListener('click', () => {
      state.open = !state.open;
      win.classList.toggle('open', state.open);
      setRobotState(state.open ? 'thinking' : 'idle');
      const n = document.getElementById('sage-notify');
      if (n) n.style.display = 'none';
      if (state.open) {
        setTimeout(() => input.focus(), 350);
        setTimeout(() => setRobotState('idle'), 800);
      }

      // Snappy rubber-band pop on every click for haptic-style feedback
      document.querySelectorAll('.bm-svg').forEach(svg => {
        svg.classList.remove('is-popping');
        // force reflow so the animation can restart
        void svg.offsetWidth;
        svg.classList.add('is-popping');
        setTimeout(() => svg.classList.remove('is-popping'), 520);
      });
    });

    close.addEventListener('click', () => {
      state.open = false;
      win.classList.remove('open');
      setRobotState('idle');
    });

    // Click outside to close (pointerdown for reliability)
    document.addEventListener('pointerdown', (e) => {
      if (state.open && !win.contains(e.target) && !bubble.contains(e.target)) {
        state.open = false;
        win.classList.remove('open');
        setRobotState('idle');
      }
    });

    input.addEventListener('focus', () => {
      setRobotState('listening');
    });

    input.addEventListener('blur', () => {
      if (!state.isTyping) setRobotState('idle');
    });

    send.addEventListener('click', handleSend);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.open) {
        state.open = false;
        win.classList.remove('open');
        setRobotState('idle');
      }
    });

    // ===== 3D PARALLAX STATE MACHINE =====
    initParallax();
    initBlinking();
  }

  /* ========== PARALLAX (60 FPS lerp loop) ========== */
  function initParallax() {
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // Normalized target & current pointer position (-1 .. 1)
    let targetX = 0, targetY = 0;
    let curX = 0, curY = 0;

    // Max translation (% of layer's own influence) — clamped so the face
    // can never clip past the head outline. Units are SVG userspace px.
    const BODY_MAX = { x: 0.6, y: 0.4 };   // ~2% — nearly static anchor
    const HEAD_MAX = { x: 3.0, y: 2.2 };   // moderate
    const FACE_MAX = { x: 4.0, y: 3.0 };   // significantly more → "turning" illusion

    const lerp = (a, b, t) => a + (b - a) * t;

    if (!isTouch) {
      // Desktop: track the cursor relative to the avatar center
      window.addEventListener('mousemove', (e) => {
        const bubble = document.getElementById('sage-bubble');
        if (!bubble) return;
        const rect = bubble.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // Normalize against a generous radius so it stays responsive on big screens
        const radius = Math.min(Math.max(window.innerWidth, window.innerHeight) / 2, 700);
        targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / radius));
        targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / radius));
      }, { passive: true });
    } else {
      // Touch: no cursor — map gentle scroll position + slow organic sway
      window.addEventListener('scroll', () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const p = (window.scrollY / max) * 2 - 1; // -1 .. 1
        targetY = Math.max(-1, Math.min(1, p));
      }, { passive: true });
    }

    function frame(now) {
      // Organic auto-sway on touch (and when the cursor is idle it adds life)
      if (isTouch) {
        targetX = Math.sin(now / 2600) * 0.6;
        targetY = (targetY * 0.7) + (Math.cos(now / 3400) * 0.3);
      }

      // Smooth ease toward target — the 0.12 factor keeps it fluid at 60fps
      curX = lerp(curX, targetX, 0.12);
      curY = lerp(curY, targetY, 0.12);

      const body = document.getElementById('bm-body');
      const head = document.getElementById('bm-head');
      const face = document.getElementById('bm-face');

      if (body) body.style.transform =
        `translate3d(${(curX * BODY_MAX.x).toFixed(2)}px, ${(curY * BODY_MAX.y).toFixed(2)}px, 0)`;
      if (head) head.style.transform =
        `translate3d(${(curX * HEAD_MAX.x).toFixed(2)}px, ${(curY * HEAD_MAX.y).toFixed(2)}px, 0)`;
      if (face) face.style.transform =
        `translate3d(${(curX * FACE_MAX.x).toFixed(2)}px, ${(curY * FACE_MAX.y).toFixed(2)}px, 0)`;

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ========== AUTONOMOUS BLINKING ========== */
  function initBlinking() {
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 4000; // every 4–8s
      setTimeout(() => {
        document.querySelectorAll('.bm-svg').forEach(svg => {
          svg.classList.add('is-blinking');
          setTimeout(() => svg.classList.remove('is-blinking'), 130);
        });
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
  }

  /* ========== INIT ========== */
  async function init() {
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r));
    }
    await loadKnowledge();
    injectStyles();
    createUI();
    bindEvents();

    // Check API health in background so we know if chat will work
    checkApiHealth().then(function(ok) {
      if (!ok) {
        console.log('[Sage Core] API unavailable — running in static mode');
        // Pre-emptively show a subtle offline indicator
        var input = document.getElementById('sage-input');
        if (input) input.placeholder = 'Chat offline — use contact form';
      } else {
        console.log('[Sage Core] API online — ready');
      }
    });

    console.log('[Sage Core] Ready — Impeccable HUD integrated');
  }

  init();
})();

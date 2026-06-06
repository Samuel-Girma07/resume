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

      /* ─── BAYMAX FULL-BODY BUTTON (fully transparent, no glow) ─── */
      #sage-bubble {
        width: 128px;
        height: 192px;
        max-height: 192px;
        border-radius: 0;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        cursor: pointer;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        pointer-events: auto;
        position: relative;
        overflow: visible;
        transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      }

      #sage-bubble:hover { transform: translateY(-4px); }
      #sage-bubble:active { transform: translateY(-1px); }

      /* Dynamic Animations mapped to states */
      #sage-bubble.robot-idle { animation: sageBotFloat 4s ease-in-out infinite; }
      #sage-bubble.robot-hover { animation: sageBotWiggle 0.6s ease-in-out; }
      #sage-bubble.robot-listening { animation: sageBotPulse 1.2s ease-in-out infinite; }
      #sage-bubble.robot-thinking { animation: sageBotSpin 3s ease-in-out infinite; }
      #sage-bubble.robot-offline { animation: none; pointer-events: none; }
      #sage-bubble.robot-offline .bm-svg { filter: grayscale(1) brightness(0.45) drop-shadow(0 10px 16px rgba(0,0,0,0.45)) !important; }
      #sage-bubble.robot-offline .bm-breathe { animation: none !important; }
      #sage-bubble.robot-offline #bm-face { transform: scaleY(0.12) !important; }

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

      /* ─── BAYMAX SVG STYLING (no glow, soft drop shadow only) ─── */
      .bm-svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 10px 16px rgba(0,0,0,0.45));
        transition: filter 0.3s ease;
        pointer-events: none;
        overflow: visible;
        will-change: transform;
      }

      /* Isolated parallax / animation layers — GPU compositing only */
      #bm-torso, #bm-head, #bm-face, #bm-left-arm, #bm-right-arm, #bm-legs {
        will-change: transform;
        transform-box: fill-box;
      }
      #bm-torso { transform-origin: 50% 80%; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
      #bm-head  { transform-origin: 50% 100%; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
      /* Arms pivot from the TOP-CENTER of the shoulder joint */
      #bm-left-arm  { transform-origin: 20% 10%; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
      #bm-right-arm { transform-origin: 80% 10%; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); }

      /* Idle breathing — drives the whole figure */
      .bm-breathe {
        animation: bmBreathe 4.5s ease-in-out infinite;
        transform-origin: 50% 95%;
      }
      @keyframes bmBreathe {
        0%, 100% { transform: scale(1, 1); }
        50% { transform: scale(1.015, 1.025); }
      }

      /* Autonomous blink — smooth Y squash on the face group */
      #bm-face {
        transform-box: fill-box;
        transform-origin: center;
        transition: transform 0.09s ease-in-out;
      }
      .bm-svg.is-blinking #bm-face { transform: scaleY(0.08); }

      /* STATE 1 — On-load greeting wave (right arm pivots from shoulder) */
      .bm-svg.is-waving #bm-right-arm {
        animation: bmWave 0.8s cubic-bezier(0.45, 0, 0.55, 1) 3;
      }
      @keyframes bmWave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(28deg); }
        75% { transform: rotate(8deg); }
      }

      /* STATE 3 — Sleep mode: head droops, eyes close */
      .bm-svg.is-sleeping #bm-head { transform: translateY(8px) rotate(-3deg) !important; transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1); }
      .bm-svg.is-sleeping #bm-face { transform: scaleY(0.1) !important; }
      .bm-svg.is-sleeping #bm-left-arm { transform: rotate(-5deg); transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1); }
      .bm-svg.is-sleeping #bm-right-arm { transform: rotate(5deg); transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1); }
      .bm-zzz { opacity: 0; transition: opacity 0.4s ease; }
      .bm-svg.is-sleeping .bm-zzz { opacity: 1; animation: bmZzz 2.4s ease-in-out infinite; }
      @keyframes bmZzz {
        0% { opacity: 0; transform: translate(0,0) scale(0.7); }
        40% { opacity: 0.9; }
        100% { opacity: 0; transform: translate(6px,-14px) scale(1.1); }
      }

      /* STATE 4 — Low-battery deflation slump */
      .bm-svg.is-deflating #bm-torso { animation: bmDeflate 2.2s cubic-bezier(0.34, 1.2, 0.64, 1); }
      .bm-svg.is-deflating #bm-head { animation: bmDeflateHead 2.2s cubic-bezier(0.34, 1.2, 0.64, 1); }
      @keyframes bmDeflate {
        0%, 100% { transform: scaleY(1) translateY(0); }
        45% { transform: scaleY(0.86) translateY(6px); }
      }
      @keyframes bmDeflateHead {
        0%, 100% { transform: scaleY(1) translateY(0); }
        45% { transform: scaleY(0.9) translateY(9px); }
      }

      /* STATE 6 — Fist-bump click: right arm extends + hand wiggles */
      .bm-svg.is-bumping #bm-right-arm { animation: bmBump 0.8s cubic-bezier(0.34,1.56,0.64,1); }
      @keyframes bmBump {
        0% { transform: rotate(0deg); }
        40% { transform: rotate(40deg); }
        55% { transform: rotate(34deg); }
        70% { transform: rotate(42deg); }
        85% { transform: rotate(36deg); }
        100% { transform: rotate(0deg); }
      }
      .bm-svg.is-bumping #bm-right-hand { animation: bmWiggle 0.8s cubic-bezier(0.34,1.56,0.64,1); transform-origin: center; }
      @keyframes bmWiggle {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        45% { transform: translateX(2px) rotate(8deg); }
        60% { transform: translateX(-2px) rotate(-8deg); }
        75% { transform: translateX(1px) rotate(4deg); }
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

  /* ========== BAYMAX FULL-BODY SVG (layered, parallax-ready) ========== */
  function getRobotSVG() {
    return `
      <svg class="bm-svg" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="bmBodyGrad" cx="0.4" cy="0.28" r="0.85">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="55%" stop-color="#eef0f3"/>
            <stop offset="100%" stop-color="#c2c6cf"/>
          </radialGradient>
          <radialGradient id="bmHeadGrad" cx="0.4" cy="0.3" r="0.9">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="58%" stop-color="#f1f2f5"/>
            <stop offset="100%" stop-color="#c4c8d1"/>
          </radialGradient>
          <radialGradient id="bmLimbGrad" cx="0.38" cy="0.3" r="0.95">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="60%" stop-color="#e9ebef"/>
            <stop offset="100%" stop-color="#bcc0c9"/>
          </radialGradient>
          <linearGradient id="bmRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(255,255,255,0.95)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id="bmFloor" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stop-color="rgba(0,0,0,0.4)"/>
            <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
          </radialGradient>
        </defs>

        <g class="bm-breathe">
          <!-- Contact shadow -->
          <ellipse cx="100" cy="286" rx="50" ry="8" fill="url(#bmFloor)"/>

          <!-- ===== LEGS (stubby) ===== -->
          <g id="bm-legs">
            <path d="M76 244 C68 246 66 254 67 266 C67 278 73 284 84 284 C94 284 98 278 97 268 L96 248 C95 242 84 242 76 244 Z"
                  fill="url(#bmLimbGrad)" stroke="#b9bdc6" stroke-width="1"/>
            <path d="M124 244 C132 246 134 254 133 266 C133 278 127 284 116 284 C106 284 102 278 103 268 L104 248 C105 242 116 242 124 244 Z"
                  fill="url(#bmLimbGrad)" stroke="#b9bdc6" stroke-width="1"/>
          </g>

          <!-- ===== RIGHT ARM (viewer-left, waves / fist-bumps) ===== -->
          <g id="bm-right-arm">
            <path d="M70 100
                     C52 102 40 120 37 150
                     C35 174 37 196 44 208
                     C40 214 39 224 46 230
                     C52 235 60 233 62 226
                     C66 230 73 228 73 220
                     C71 196 70 150 72 122
                     C73 110 76 100 70 100 Z"
                  fill="url(#bmLimbGrad)" stroke="#b9bdc6" stroke-width="1"/>
            <!-- stubby fingers -->
            <g id="bm-right-hand">
              <path d="M40 218
                       C40 230 46 236 53 236
                       C61 236 66 230 66 220
                       C63 224 60 224 58 220
                       C56 225 52 225 50 220
                       C48 224 44 224 42 219 Z"
                    fill="url(#bmLimbGrad)" stroke="#b9bdc6" stroke-width="1"/>
            </g>
          </g>

          <!-- ===== LEFT ARM (viewer-right) ===== -->
          <g id="bm-left-arm">
            <path d="M130 100
                     C148 102 160 120 163 150
                     C165 174 163 196 156 208
                     C160 214 161 224 154 230
                     C148 235 140 233 138 226
                     C134 230 127 228 127 220
                     C129 196 130 150 128 122
                     C127 110 124 100 130 100 Z"
                  fill="url(#bmLimbGrad)" stroke="#b9bdc6" stroke-width="1"/>
            <path d="M160 218
                     C160 230 154 236 147 236
                     C139 236 134 230 134 220
                     C137 224 140 224 142 220
                     C144 225 148 225 150 220
                     C152 224 156 224 158 219 Z"
                  fill="url(#bmLimbGrad)" stroke="#b9bdc6" stroke-width="1"/>
          </g>

          <!-- ===== TORSO (seamless pear-shaped balloon) ===== -->
          <g id="bm-torso">
            <path d="M64 104
                     C56 132 47 168 47 205
                     C47 240 62 258 100 258
                     C138 258 153 240 153 205
                     C153 168 144 132 136 104
                     C128 86 72 86 64 104 Z"
                  fill="url(#bmBodyGrad)" stroke="#b9bdc6" stroke-width="1.2"/>
            <!-- soft shoulder highlight -->
            <path d="M70 116 C82 104 118 104 130 116" stroke="url(#bmRim)" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.65"/>
            <!-- belly seam -->
            <path d="M100 128 L100 232" stroke="#d2d5dc" stroke-width="1.4" opacity="0.45"/>
            <!-- subtle access port / badge on left upper chest (viewer-right) -->
            <circle cx="122" cy="150" r="7.5" fill="#f4f5f7" stroke="#cdd1d8" stroke-width="1.2"/>
            <circle cx="122" cy="150" r="2.6" fill="#FFD700" opacity="0.8"/>
          </g>

          <!-- ===== HEAD (wide squashed oval) ===== -->
          <g id="bm-head">
            <ellipse cx="100" cy="62" rx="47" ry="34" fill="url(#bmHeadGrad)" stroke="#b9bdc6" stroke-width="1.2"/>
            <ellipse cx="80" cy="45" rx="22" ry="10" fill="#ffffff" opacity="0.55"/>

            <!-- sleep "z" marks near the head -->
            <g class="bm-zzz" fill="#9aa0ab">
              <text x="148" y="40" font-family="sans-serif" font-size="15" font-weight="700">z</text>
              <text x="158" y="26" font-family="sans-serif" font-size="19" font-weight="700">Z</text>
            </g>

            <!-- ===== FACE (small solid eyes + thin connecting line) ===== -->
            <g id="bm-face">
              <line x1="80" y1="63" x2="120" y2="63" stroke="#111315" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="80" cy="63" r="8" fill="#111315"/>
              <circle cx="120" cy="63" r="8" fill="#111315"/>
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

      // STATE 6 — fist-bump sequence on every click (arm extend + hand wiggle)
      wakeUp();
      document.querySelectorAll('.bm-svg').forEach(svg => {
        svg.classList.remove('is-bumping');
        void svg.offsetWidth; // force reflow so the animation restarts
        svg.classList.add('is-bumping');
        setTimeout(() => svg.classList.remove('is-bumping'), 720);
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

    // ===== ANIMATION STATE MACHINE =====
    initParallax();
    initBlinking();
    initLowBattery();
    initCuriosityHover();
    triggerGreeting();
  }

  /* ===== shared sleep state + wake helper ===== */
  let sleepTimer = null;
  let isSleeping = false;

  function wakeUp() {
    if (isSleeping) {
      isSleeping = false;
      document.querySelectorAll('.bm-svg').forEach(s => s.classList.remove('is-sleeping'));
    }
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
      isSleeping = true;
      document.querySelectorAll('.bm-svg').forEach(s => s.classList.add('is-sleeping'));
    }, 6000);
  }

  /* ========== PARALLAX (60 FPS lerp loop) ========== */
  function initParallax() {
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // Normalized target & current pointer position (-1 .. 1)
    let targetX = 0, targetY = 0;
    let curX = 0, curY = 0;

    // Per-layer parallax depth (SVG userspace px). Face moves most → "turning".
    const TORSO_MAX = { x: 3, y: 2 };    // slight
    const HEAD_MAX  = { x: 8, y: 5 };    // moderate
    const FACE_MAX  = { x: 13, y: 9 };   // heavy
    const lerpFactor = 0.05;             // low = buttery-smooth weighted delay

    const lerp = (a, b, t) => a + (b - a) * t;

    if (!isTouch) {
      // Global window listener so Baymax tracks the cursor everywhere
      window.addEventListener('mousemove', (e) => {
        wakeUp();
        const face = document.getElementById('bm-face');
        const ref = face || document.getElementById('sage-bubble');
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const radius = Math.min(Math.max(window.innerWidth, window.innerHeight) / 2, 720);
        targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / radius));
        targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / radius));
      }, { passive: true });
      // start the inactivity timer immediately
      wakeUp();
    } else {
      window.addEventListener('scroll', () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        targetY = Math.max(-1, Math.min(1, (window.scrollY / max) * 2 - 1));
      }, { passive: true });
    }

    function frame(now) {
      if (isTouch) {
        targetX = Math.sin(now / 2600) * 0.6;
        targetY = (targetY * 0.7) + (Math.cos(now / 3400) * 0.3);
      }

      // When asleep, ease back to neutral so the CSS sleep pose can take over
      const tX = isSleeping ? 0 : targetX;
      const tY = isSleeping ? 0 : targetY;
      curX = lerp(curX, tX, lerpFactor);
      curY = lerp(curY, tY, lerpFactor);

      const torso = document.getElementById('bm-torso');
      const head = document.getElementById('bm-head');
      const face = document.getElementById('bm-face');

      // Skip inline transforms while sleeping so the CSS pose isn't overridden
      if (!isSleeping) {
        if (torso) torso.style.transform =
          `translate(${(curX * TORSO_MAX.x).toFixed(2)}px, ${(curY * TORSO_MAX.y).toFixed(2)}px)`;
        if (head) head.style.transform =
          `translate(${(curX * HEAD_MAX.x).toFixed(2)}px, ${(curY * HEAD_MAX.y).toFixed(2)}px) rotate(${(curX * headTilt).toFixed(2)}deg)`;
        if (face) face.style.transform =
          `translate(${(curX * FACE_MAX.x).toFixed(2)}px, ${(curY * FACE_MAX.y).toFixed(2)}px)`;
      } else {
        if (torso) torso.style.transform = '';
        if (face) face.style.transform = '';
        if (head) head.style.transform = '';
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Extra head tilt amount, boosted during STATE 5 curiosity hover */
  let headTilt = 1.5;

  /* ========== STATE 5 — CURIOSITY HOVER ========== */
  function initCuriosityHover() {
    const onEnter = () => { headTilt = 9; };
    const onLeave = () => { headTilt = 1.5; };
    const attach = (el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    };
    document.querySelectorAll('a, button').forEach(el => {
      if (el.closest('#sage-root')) return; // skip our own widget
      attach(el);
    });
    // Catch dynamically added links/buttons too
    const obs = new MutationObserver(() => {
      document.querySelectorAll('a, button').forEach(el => {
        if (el.closest('#sage-root') || el.dataset.bmHover) return;
        el.dataset.bmHover = '1';
        attach(el);
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ========== STATE 1 — ON-LOAD GREETING WAVE ========== */
  function triggerGreeting() {
    setTimeout(() => {
      document.querySelectorAll('.bm-svg').forEach(svg => {
        svg.classList.add('is-waving');
        setTimeout(() => svg.classList.remove('is-waving'), 2200);
      });
    }, 700);
  }

  /* ========== STATE 4 — RARE LOW-BATTERY DEFLATION ========== */
  function initLowBattery() {
    setInterval(() => {
      if (isSleeping) return;
      if (Math.random() < 0.015) { // ~1.5% chance every 10s
        document.querySelectorAll('.bm-svg').forEach(svg => {
          svg.classList.add('is-deflating');
          setTimeout(() => svg.classList.remove('is-deflating'), 2000);
        });
      }
    }, 10000);
  }

  /* ========== STATE 2 — AUTONOMOUS BLINKING ========== */
  function initBlinking() {
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 2000; // every 4–6s
      setTimeout(() => {
        if (!isSleeping) {
          document.querySelectorAll('.bm-svg').forEach(svg => {
            svg.classList.add('is-blinking');
            setTimeout(() => svg.classList.remove('is-blinking'), 130);
          });
        }
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

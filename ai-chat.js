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

  const BAYMAX_IDLE_SRC = 'baymax-idle.webp';
  const BAYMAX_WAVE_SRC = 'baymax-wave.webp';
  const BAYMAX_WAVE_DURATION = 2500;

  let state = {
    open: false,
    messages: [],
    knowledge: null,
    isTyping: false,
    sessionId: 'session_' + Math.random().toString(36).slice(2, 11),
    robotState: 'idle'
  };

  let waveResetTimer = null;
  let curiousTimer = null;

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
        --baymax-avatar-width: 124px;
        --baymax-avatar-height: 150px;
        --baymax-avatar-gap: 16px;
        --sage-root-bottom: 28px;
        --sage-window-top-safe: 18px;

        position: fixed;
        z-index: 999999;
        ${CONFIG.POSITION.includes('right') ? 'right: 28px;' : 'left: 28px;'}
        bottom: var(--sage-root-bottom);
        font-family: var(--sg-font-body);
        pointer-events: none;
      }

      #sage-root { cursor: auto !important; }
      #sage-window, #sage-window * { cursor: auto !important; }
      #sage-input, #sage-input * { cursor: text !important; }
      #sage-close, #sage-close *, #sage-send, #sage-send * { cursor: pointer !important; }
      #sage-send:disabled, #sage-send:disabled * { cursor: not-allowed !important; }
      #sage-bubble, #sage-bubble * { cursor: pointer !important; }

      /* ─── AI COMPANION AVATAR ─── */
      #sage-bubble {
        --baymax-shift-x: 0px;
        --baymax-shift-y: 0px;
        --baymax-tilt: 0deg;
        --baymax-hover-y: 0px;
        --baymax-hover-scale: 1;
        width: var(--baymax-avatar-width);
        height: var(--baymax-avatar-height);
        border-radius: 18px;
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
        user-select: none;
        -webkit-user-select: none;
        transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), filter 0.28s ease;
      }

      #sage-bubble:hover {
        transform: translateY(-3px) scale(1.015);
        filter: drop-shadow(0 14px 22px rgba(0,0,0,0.45));
      }
      #sage-bubble:active { transform: translateY(-1px) scale(0.985); }
      #sage-bubble.robot-offline { opacity: 0.6; filter: grayscale(1); pointer-events: none; }

      .baymax-avatar {
        position: relative;
        width: var(--baymax-avatar-width);
        height: var(--baymax-avatar-height);
        max-width: 100%;
        transform-origin: 50% 88%;
        transform: translate3d(var(--baymax-shift-x), calc(var(--baymax-shift-y) + var(--baymax-hover-y)), 0) rotate(var(--baymax-tilt)) scale(var(--baymax-hover-scale));
        transition: transform 0.46s cubic-bezier(0.22, 1, 0.36, 1);
        will-change: transform;
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
      }

      .baymax-avatar::after {
        content: '';
        position: absolute;
        z-index: 0;
        left: 20%;
        right: 20%;
        bottom: 1px;
        height: 9px;
        border-radius: 999px;
        background: radial-gradient(ellipse at center, rgba(0,0,0,0.32), rgba(0,0,0,0) 72%);
        filter: blur(1px);
        opacity: 0.72;
        transform: scaleX(0.96);
        transform-origin: center;
        transition: transform 0.38s ease, opacity 0.38s ease;
      }

      .baymax-motion {
        position: absolute;
        z-index: 1;
        inset: 0;
        transform-origin: 50% 88%;
        animation: baymaxBreathe 4.8s ease-in-out infinite;
        will-change: transform;
      }

      .baymax-avatar-sm {
        width: 44px;
        height: 44px;
        aspect-ratio: auto;
      }

      #sage-avatar .baymax-avatar::after { display: none; }
      #sage-avatar .baymax-motion { animation: none; }

      .baymax-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        user-select: none;
        -webkit-user-select: none;
        pointer-events: none;
        transition: opacity 0.3s ease-in-out, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), filter 0.38s ease;
        will-change: opacity, transform;
      }

      .baymax-img-idle {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .baymax-img-wave {
        opacity: 0;
        transform: translateY(5px) scale(0.97);
        filter: blur(0.2px);
      }

      #sage-bubble.robot-hover {
        --baymax-hover-y: -4px;
        --baymax-hover-scale: 1.025;
      }

      #sage-bubble.robot-hover .baymax-avatar::after {
        opacity: 0.52;
        transform: scaleX(0.82);
      }

      #sage-bubble.robot-listening .baymax-motion {
        animation: baymaxListen 2.2s ease-in-out infinite;
      }

      #sage-bubble.robot-thinking:not(.is-waving) .baymax-motion {
        animation: baymaxThinking 1.35s cubic-bezier(0.22, 1, 0.36, 1) infinite;
      }

      #sage-bubble.is-curious:not(.is-waving) .baymax-avatar {
        animation: baymaxCurious 0.92s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      #sage-bubble.is-waving .baymax-avatar {
        animation: baymaxHello 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      #sage-bubble.is-waving .baymax-motion {
        animation: none;
      }

      #sage-bubble.is-waving .baymax-img-idle {
        opacity: 0;
        transform: translateY(-5px) scale(1.02);
        filter: blur(0.35px);
      }

      #sage-bubble.is-waving .baymax-img-wave {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: none;
      }

      @keyframes baymaxBreathe {
        0%, 100% { transform: translate3d(0, 0, 0) scaleX(1) scaleY(1); }
        45% { transform: translate3d(0, -2px, 0) scaleX(1.014) scaleY(0.992); }
        70% { transform: translate3d(0, -1px, 0) scaleX(1.006) scaleY(0.997); }
      }

      @keyframes baymaxListen {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
        35% { transform: translate3d(1px, -2px, 0) rotate(0.8deg) scale(1.008); }
        70% { transform: translate3d(-1px, -1px, 0) rotate(-0.45deg) scale(1.004); }
      }

      @keyframes baymaxThinking {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        25% { transform: translate3d(-1.5px, -2px, 0) rotate(-1deg); }
        55% { transform: translate3d(1.5px, -1px, 0) rotate(0.9deg); }
        78% { transform: translate3d(0, -2px, 0) rotate(0deg); }
      }

      @keyframes baymaxCurious {
        0%, 100% { transform: translate3d(var(--baymax-shift-x), calc(var(--baymax-shift-y) + var(--baymax-hover-y)), 0) rotate(var(--baymax-tilt)) scale(var(--baymax-hover-scale)); }
        28% { transform: translate3d(calc(var(--baymax-shift-x) - 2px), calc(var(--baymax-shift-y) + var(--baymax-hover-y) - 5px), 0) rotate(-2deg) scale(1.02); }
        58% { transform: translate3d(calc(var(--baymax-shift-x) + 2px), calc(var(--baymax-shift-y) + var(--baymax-hover-y) - 2px), 0) rotate(1.4deg) scale(1.01); }
      }

      @keyframes baymaxHello {
        0% { transform: translateY(0) rotate(0deg); }
        38% { transform: translateY(-4px) rotate(-1.4deg); }
        68% { transform: translateY(1px) rotate(0.8deg); }
        100% { transform: translateY(0) rotate(0deg); }
      }

      /* ─── NOTIFICATION ─── */
      #sage-notify {
        position: absolute;
        top: 8px;
        right: 4px;
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

      /* ─── CHAT WINDOW ─── */
      #sage-window {
        position: absolute;
        bottom: calc(var(--baymax-avatar-height) + var(--baymax-avatar-gap));
        ${CONFIG.POSITION.includes('right') ? 'right: 0;' : 'left: 0;'}
        width: 380px;
        max-width: calc(100vw - 40px);
        height: min(600px, calc(100vh - var(--baymax-avatar-height) - var(--baymax-avatar-gap) - var(--sage-root-bottom) - var(--sage-window-top-safe)));
        max-height: calc(100vh - var(--baymax-avatar-height) - var(--baymax-avatar-gap) - var(--sage-root-bottom) - var(--sage-window-top-safe));
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
      #sage-window, #sage-window * {
        box-sizing: border-box;
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
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(18,18,18,0.4);
        border: 1px solid rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: inset 0 0 20px rgba(255,255,255,0.05);
        overflow: hidden;
      }
      #sage-avatar .baymax-avatar { transform: translateY(3px); }

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
      .sage-msg-bot strong { color: var(--sg-text); font-weight: 600; }
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
        align-items: center;
        gap: 12px;
        position: relative;
        width: 100%;
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
        min-width: 0;
        width: 0;
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
        border-color: rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.04); 
        box-shadow: 0 0 0 3px rgba(255,255,255,0.05), inset 0 2px 4px rgba(0,0,0,0.2);
      }

      #sage-send {
        width: 48px; height: 48px;
        min-width: 48px;
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
        #sage-root {
          --sage-root-bottom: 85px;
          --sage-window-top-safe: 14px;
          right: 16px !important;
          left: 16px !important;
        }
        #sage-window {
          width: 100%;
          height: min(60vh, calc(100vh - var(--baymax-avatar-height) - var(--baymax-avatar-gap) - var(--sage-root-bottom) - var(--sage-window-top-safe)));
          max-width: 100%;
          border-radius: 20px;
          bottom: calc(var(--baymax-avatar-height) + var(--baymax-avatar-gap)); right: 0 !important; left: 0 !important;
        }
        #sage-header {
          padding: 16px 16px 14px;
          gap: 12px;
        }
        #sage-avatar {
          width: 42px;
          height: 42px;
        }
        #sage-name {
          font-size: 0.96rem;
        }
        #sage-close {
          width: 40px;
          height: 40px;
        }
        #sage-messages {
          padding: 16px;
          gap: 12px;
        }
        .sage-msg {
          max-width: 92%;
          padding: 12px 14px;
          border-radius: 17px;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        #sage-typing {
          margin-left: 16px;
          margin-bottom: 4px;
        }
        #sage-input-area {
          padding: 12px;
          gap: 8px;
        }
        #sage-input-area::before {
          left: 12px;
          right: 12px;
        }
        #sage-input {
          min-width: 0;
          width: 0;
          height: 44px;
          padding: 11px 14px;
          border-radius: 22px;
          font-size: 16px;
        }
        #sage-send {
          width: 44px;
          height: 44px;
          min-width: 44px;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        #sage-bubble { transition: none !important; }
        .baymax-avatar, .baymax-motion { transition: none !important; animation: none !important; }
        .baymax-img { transition: none !important; }
        #sage-bubble.is-waving .baymax-avatar { animation: none !important; }
        #sage-bubble.is-curious .baymax-avatar { animation: none !important; }
        .sage-msg { animation: none; }
      }
    `;
    document.head.appendChild(css);
  }

  function getBaymaxAvatarHTML(sizeClass = '') {
    const className = ['baymax-avatar', sizeClass].filter(Boolean).join(' ');
    return `
      <span class="${className}" aria-hidden="true">
        <span class="baymax-motion">
          <img class="baymax-img baymax-img-idle" src="${BAYMAX_IDLE_SRC}" alt="" draggable="false" decoding="async">
          <img class="baymax-img baymax-img-wave" src="${BAYMAX_WAVE_SRC}" alt="" draggable="false" decoding="async">
        </span>
      </span>
    `;
  }

  function preloadBaymaxAssets() {
    [BAYMAX_IDLE_SRC, BAYMAX_WAVE_SRC].forEach(src => {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    });
  }

  function restartBaymaxWaveLayer(bubble) {
    const wave = bubble.querySelector('.baymax-img-wave');
    if (!wave) return;
    wave.replaceWith(wave.cloneNode(false));
  }

  function stopBaymaxWave(bubble = document.getElementById('sage-bubble')) {
    if (!bubble) return;
    clearTimeout(waveResetTimer);
    waveResetTimer = null;
    bubble.classList.remove('is-waving');
  }

  function startBaymaxWave(bubble = document.getElementById('sage-bubble')) {
    if (!bubble) return;
    bubble.classList.remove('is-curious');
    stopBaymaxWave(bubble);
    restartBaymaxWaveLayer(bubble);
    void bubble.offsetWidth;
    bubble.classList.add('is-waving');
    waveResetTimer = setTimeout(() => {
      stopBaymaxWave(bubble);
    }, BAYMAX_WAVE_DURATION);
  }

  function setBaymaxLean(bubble, x = 0, y = 0, tilt = 0) {
    if (!bubble) return;
    bubble.style.setProperty('--baymax-shift-x', `${x.toFixed(2)}px`);
    bubble.style.setProperty('--baymax-shift-y', `${y.toFixed(2)}px`);
    bubble.style.setProperty('--baymax-tilt', `${tilt.toFixed(2)}deg`);
  }

  function resetBaymaxLean(bubble) {
    setBaymaxLean(bubble, 0, 0, 0);
  }

  function scheduleBaymaxCuriosity(bubble) {
    if (!bubble || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearTimeout(curiousTimer);
    curiousTimer = setTimeout(() => {
      if (state.open || bubble.classList.contains('is-waving') || state.robotState === 'offline') {
        scheduleBaymaxCuriosity(bubble);
        return;
      }
      bubble.classList.add('is-curious');
      setTimeout(() => {
        bubble.classList.remove('is-curious');
        scheduleBaymaxCuriosity(bubble);
      }, 950);
    }, 5200 + Math.random() * 3600);
  }

  function createUI() {
    const root = document.createElement('div');
    root.id = 'sage-root';
    root.innerHTML = `
      <div id="sage-bubble" class="robot-idle" role="button" aria-label="Open AI Assistant">
        ${getBaymaxAvatarHTML()}
        <div id="sage-notify"></div>
      </div>
      <div id="sage-window" role="dialog" aria-label="Chat with Baymax">
        <div id="sage-header">
          <div id="sage-avatar">
            ${getBaymaxAvatarHTML('baymax-avatar-sm')}
          </div>
          <div id="sage-info">
            <div id="sage-name">BAYMAX</div>
          </div>
          <button id="sage-close" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="sage-messages">
          <div class="sage-msg sage-msg-bot">
            Hello, I am <strong>Baymax</strong>, your personal frontend companion for Samuel's portfolio. How can I help you today?
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
          <input id="sage-input" type="text" placeholder="Ask Baymax..." autocomplete="off">
          <button id="sage-send" aria-label="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  }
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

  function openChat(win, input, bubble) {
    state.open = true;
    win.classList.add('open');
    setRobotState('thinking');
    const n = document.getElementById('sage-notify');
    if (n) n.style.display = 'none';
    startBaymaxWave(bubble);
    setTimeout(() => input.focus(), 350);
    setTimeout(() => {
      if (state.open) setRobotState('idle');
    }, 800);
  }

  function closeChat(win, bubble) {
    state.open = false;
    win.classList.remove('open');
    stopBaymaxWave(bubble);
    setRobotState('idle');
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
      clearTimeout(curiousTimer);
      bubble.classList.remove('is-curious');
      if (!state.open) setRobotState('hover');
    });

    bubble.addEventListener('pointermove', e => {
      if (bubble.classList.contains('is-waving')) return;
      const rect = bubble.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setBaymaxLean(bubble, nx * 4, ny * 2, nx * 2.2);
    });

    bubble.addEventListener('mouseleave', () => {
      resetBaymaxLean(bubble);
      if (!state.open) setRobotState('idle');
      scheduleBaymaxCuriosity(bubble);
    });

    bubble.addEventListener('click', () => {
      if (state.open) {
        closeChat(win, bubble);
        return;
      }
      openChat(win, input, bubble);
    });

    close.addEventListener('click', () => {
      closeChat(win, bubble);
    });

    // Click outside to close (pointerdown for reliability)
    document.addEventListener('pointerdown', (e) => {
      if (state.open && !win.contains(e.target) && !bubble.contains(e.target)) {
        closeChat(win, bubble);
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
        closeChat(win, bubble);
      }
    });

    scheduleBaymaxCuriosity(bubble);
  }

  /* ========== INIT ========== */
  async function init() {
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r));
    }
    await loadKnowledge();
    preloadBaymaxAssets();
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

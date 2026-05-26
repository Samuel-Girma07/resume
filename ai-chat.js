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

  /* ========== AI PROXY ========== */
  async function callAI(messages) {
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

      /* ─── SVG ROBOT STYLING ─── */
      .sage-robot {
        width: 60px;
        height: 60px;
        filter: drop-shadow(0 0 15px rgba(255,215,0,0.4));
        transition: filter 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }

      #sage-bubble:hover .sage-robot {
        filter: drop-shadow(0 0 24px rgba(255,215,0,0.7)) drop-shadow(0 0 48px rgba(255,215,0,0.4));
      }

      .sage-robot .robot-head {
        animation: robotHeadBob 3s ease-in-out infinite;
        transform-origin: center 26px;
      }
      @keyframes robotHeadBob {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-1.5px) rotate(1deg); }
        75% { transform: translateY(-0.5px) rotate(-0.5deg); }
      }

      .sage-robot .robot-eye-open { animation: robotEyeBlink 4s ease-in-out infinite; transform-origin: center; }
      @keyframes robotEyeBlink {
        0%, 45%, 55%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      .sage-robot .robot-eye-wink-path { display: none; }
      .sage-robot.is-winking .right-eye-open-group { display: none; }
      .sage-robot.is-winking .robot-eye-wink-path { display: block; }

      .sage-robot .robot-mouth { animation: robotSmile 3.5s ease-in-out infinite; transform-origin: center; }
      @keyframes robotSmile {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(1.1); }
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
        padding: 14px 18px;
        background: var(--sg-surface);
        border: 1px solid rgba(255,255,255,0.04);
        border-radius: 20px;
        border-bottom-left-radius: 6px;
        margin-left: 24px;
        margin-bottom: 8px;
      }
      #sage-typing.active { display: flex; gap: 6px; }
      .sage-dot {
        width: 5px; height: 5px;
        background: rgba(255,215,0,0.6);
        border-radius: 50%;
        animation: typingDot 1.4s infinite ease-in-out;
      }
      .sage-dot:nth-child(2) { animation-delay: 0.2s; }
      .sage-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingDot {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-4px); opacity: 1; }
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
        #sage-bubble, .sage-robot * { animation: none !important; }
        .sage-msg { animation: none; }
      }
    `;
    document.head.appendChild(css);
  }

  /* ========== SVG HUD ROBOT ========== */
  function getRobotSVG() {
    return `
      <svg class="sage-robot" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="botBodyGrad" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stop-color="#2a2a2a"/>
            <stop offset="50%" stop-color="#1a1a1a"/>
            <stop offset="100%" stop-color="#0d0d0d"/>
          </radialGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFE55C"/>
            <stop offset="100%" stop-color="#FFD700"/>
          </linearGradient>
          <radialGradient id="botGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stop-color="rgba(255,215,0,0.6)"/>
            <stop offset="100%" stop-color="rgba(255,215,0,0)"/>
          </radialGradient>
          <filter id="botGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <clipPath id="faceClip">
            <rect x="14" y="16" width="36" height="18" rx="9"/>
          </clipPath>
        </defs>

        <!-- Floor glow -->
        <ellipse cx="32" cy="60" rx="16" ry="4" fill="url(#botGlow)">
          <animate attributeName="rx" values="14;18;14" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
        </ellipse>

        <!-- Body -->
        <g class="robot-body">
          <path d="M20 38 C18 38 18 40 18 42 L18 52 C18 56 22 58 26 58 L38 58 C42 58 46 56 46 52 L46 42 C46 40 46 38 44 38 Z" fill="url(#botBodyGrad)"/>
          <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#111"/>
          <ellipse cx="32" cy="58" rx="10" ry="2.5" fill="url(#goldGrad)"/>
          <circle cx="32" cy="48" r="6" fill="#111" stroke="#FFD700" stroke-width="1"/>
          <!-- Dynamic Heart Core -->
          <circle cx="32" cy="48" r="3.5" fill="#FFD700" filter="url(#botGlowFilter)">
            <animate attributeName="r" values="3.5;5;3.5" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>

        <!-- Arms -->
        <g class="robot-arms">
          <path d="M18 44 Q10 48 12 54 Q14 56 16 54" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M46 44 Q54 48 52 54 Q50 56 48 54" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" fill="none"/>
        </g>

        <!-- Neck -->
        <rect x="28" y="34" width="8" height="5" rx="2" fill="url(#goldGrad)"/>

        <!-- HEAD GROUP -->
        <g class="robot-head">
          <g class="robot-head-tracker" style="transform-origin: 32px 22px; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);">
          <!-- Head back -->
          <rect x="12" y="8" width="40" height="28" rx="14" fill="url(#botBodyGrad)"/>
          <rect x="26" y="12" width="12" height="3" rx="1.5" fill="#FFD700" opacity="0.4"/>

          <!-- === FACE SCREEN === -->
          <rect x="14" y="16" width="36" height="18" rx="9" fill="#0d0d0d" stroke="#FFD700" stroke-width="1" opacity="0.9"/>

          <g class="robot-face-tracker" style="transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);" clip-path="url(#faceClip)">
            <!-- === LEFT EYE (OPEN) === -->
            <ellipse cx="24" cy="25" rx="5" ry="5.5" fill="rgba(255,215,0,0.15)"/>
            <ellipse cx="24" cy="25" rx="3.5" ry="4.5" fill="#FFD700" filter="url(#botGlowFilter)" class="robot-eye-open"/>
            <ellipse cx="25" cy="23.5" rx="1.2" ry="1.5" fill="#ffffff" opacity="0.8"/>

            <!-- === RIGHT EYE (DEFAULT OPEN) === -->
            <!-- Glow background -->
            <ellipse cx="40" cy="25" rx="5" ry="5.5" fill="rgba(255,215,0,0.15)"/>
            
            <g class="right-eye-open-group">
              <ellipse cx="40" cy="25" rx="3.5" ry="4.5" fill="#FFD700" filter="url(#botGlowFilter)" class="robot-eye-open"/>
              <ellipse cx="41" cy="23.5" rx="1.2" ry="1.5" fill="#ffffff" opacity="0.8"/>
            </g>

            <!-- Winking chevron -->
            <path d="M43 22 L38 25 L43 28" stroke="#FFD700" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#botGlowFilter)" class="robot-eye-wink-path"/>

            <!-- === SMILE === -->
            <path d="M26 32 Q32 36 38 32" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round" fill="none" filter="url(#botGlowFilter)" class="robot-mouth"/>
          </g>

          <!-- === HEADSET === -->
          <path d="M12 18 Q12 4 32 4 Q52 4 52 18" stroke="#FFD700" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <rect x="8" y="18" width="6" height="12" rx="3" fill="url(#goldGrad)">
            <animate attributeName="height" values="12;16;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="y" values="18;16;18" dur="2s" repeatCount="indefinite" />
          </rect>
          <rect x="50" y="18" width="6" height="12" rx="3" fill="url(#goldGrad)">
            <animate attributeName="height" values="12;16;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="y" values="18;16;18" dur="2s" repeatCount="indefinite" />
          </rect>
          <path d="M50 24 Q46 24 46 28 Q46 32 42 32 Q40 32 40 34" stroke="#FFD700" stroke-width="1.2" fill="none" stroke-linecap="round"/>
          <ellipse cx="39" cy="35" rx="3" ry="2" fill="url(#goldGrad)">
            <animate attributeName="rx" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="ry" values="2;3;2" dur="2s" repeatCount="indefinite" />
          </ellipse>
          </g>
        </g>
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
            ${getRobotSVG()}
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
            I'm <strong>Sage</strong>, the AI assistant for Samuel's portfolio. How can I help you today?
          </div>
        </div>
        <div id="sage-typing">
          <div class="sage-dot"></div>
          <div class="sage-dot"></div>
          <div class="sage-dot"></div>
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
    bubble.classList.remove('robot-idle', 'robot-hover', 'robot-listening', 'robot-thinking');
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
      addMessage(`Sorry, I'm having trouble connecting. ${err.message}`);
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
        
        // Wink on click!
        const robots = document.querySelectorAll('.sage-robot');
        robots.forEach(r => r.classList.add('is-winking'));
        setTimeout(() => {
          robots.forEach(r => r.classList.remove('is-winking'));
        }, 1200);
      }
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

    // Eye-tracking / Head-tracking logic
    document.addEventListener('mousemove', (e) => {
      const trackers = document.querySelectorAll('.robot-head-tracker');
      if (!trackers.length) return;

      trackers.forEach(tracker => {
        const svg = tracker.closest('.sage-robot');
        if (!svg) return;
        
        const rect = svg.getBoundingClientRect();
        // If SVG is not visible (e.g., chat window closed), skip to save compute
        if (rect.width === 0 || rect.height === 0) return;

        const svgCenterX = rect.left + rect.width / 2;
        const svgCenterY = rect.top + rect.height / 2;
        
        const deltaX = e.clientX - svgCenterX;
        const deltaY = e.clientY - svgCenterY;
        
        // Normalize delta based on a reasonable max radius (e.g. 500px)
        // so it feels responsive even on large screens
        const maxDistX = Math.min(window.innerWidth / 2, 600);
        const maxDistY = Math.min(window.innerHeight / 2, 600);
        
        const percentX = Math.max(-1, Math.min(1, deltaX / maxDistX));
        const percentY = Math.max(-1, Math.min(1, deltaY / maxDistY));
        
        // Transform params: Push the physics! Max 8px X, 5px Y, 18 deg tilt
        const tx = percentX * 8;
        const ty = percentY * 5;
        const rot = percentX * 18;
        
        tracker.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
        
        const faceTracker = tracker.querySelector('.robot-face-tracker');
        if (faceTracker) {
          // Extra parallax shift for the inner face (eyes & mouth)
          // We can push this very far (12px) because the SVG clipPath prevents overflow
          const faceTx = percentX * 12;
          const faceTy = percentY * 8;
          faceTracker.style.transform = `translate(${faceTx}px, ${faceTy}px)`;
        }
      });
    });
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
    console.log('[Sage Core] Ready — Impeccable HUD integrated');
  }

  init();
})();

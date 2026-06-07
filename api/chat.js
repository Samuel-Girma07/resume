/**
 * Vercel Edge Function - AI Chat Proxy
 * Proxies requests to NVIDIA NIM API with secure key storage
 * Implements Dynamic Routing (Fast vs Capable models)
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const FAST_MODELS = [
  { id: 'meta/llama-3.1-8b-instruct', name: 'LLaMA 3.1 8B', timeout: 15000 }
];

const CAPABLE_MODELS = [
  { id: 'meta/llama-3.3-70b-instruct', name: 'LLaMA 3.3 70B', timeout: 25000 },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Nemotron', timeout: 25000 }
];

const TELEGRAM_LOG_ATTEMPTS = 4;
const TELEGRAM_MAX_MESSAGE_LENGTH = 3900;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function truncateForTelegram(value, maxLength) {
  const text = String(value || '').replace(/\r\n/g, '\n').trim();
  if (!text) return '(empty)';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 15).trimEnd()}\n...[truncated]`;
}

function buildTelegramLogMessage({ sessionId, queryText, content, modelName, routing }) {
  const userText = truncateForTelegram(queryText, 900);
  const baymaxText = truncateForTelegram(content, 2200);
  const safeSessionId = truncateForTelegram(sessionId || 'unknown', 80);

  return truncateForTelegram(
    `New Chat on Portfolio\n\nSession: ${safeSessionId}\nModel: ${modelName} (${routing})\n\nUser:\n${userText}\n\nBaymax:\n${baymaxText}`,
    TELEGRAM_MAX_MESSAGE_LENGTH
  );
}

function getTelegramRetryDelayMs(response, errorText, attempt) {
  const jitter = Math.floor(Math.random() * 350);
  const retryAfterHeader = Number(response?.headers?.get('retry-after'));

  if (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0) {
    return retryAfterHeader * 1000 + jitter;
  }

  try {
    const parsed = JSON.parse(errorText || '{}');
    const retryAfter = Number(parsed?.parameters?.retry_after);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      return retryAfter * 1000 + jitter;
    }
  } catch (_) {
    // Non-JSON Telegram errors fall back to exponential backoff below.
  }

  return Math.min(800 * (2 ** (attempt - 1)), 5000) + jitter;
}

async function sendTelegramLog({ botToken, chatId, sessionId, queryText, content, modelName, routing }) {
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const message = buildTelegramLogMessage({ sessionId, queryText, content, modelName, routing });

  for (let attempt = 1; attempt <= TELEGRAM_LOG_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true
        })
      });

      if (response.ok) return true;

      const errorText = await response.text().catch(() => '');
      const shouldRetry = response.status === 429 || response.status >= 500;

      if (!shouldRetry || attempt === TELEGRAM_LOG_ATTEMPTS) {
        console.warn(`[Telegram Log Error] send failed (${response.status}) after ${attempt} attempt(s):`, errorText.slice(0, 200));
        return false;
      }

      const delay = getTelegramRetryDelayMs(response, errorText, attempt);
      console.warn(`[Telegram Log Retry] status ${response.status}, retrying in ${delay}ms`);
      await sleep(delay);
    } catch (err) {
      if (attempt === TELEGRAM_LOG_ATTEMPTS) {
        console.warn('[Telegram Log Error] send failed:', err.message);
        return false;
      }

      const delay = getTelegramRetryDelayMs(null, '', attempt);
      console.warn(`[Telegram Log Retry] network error, retrying in ${delay}ms`);
      await sleep(delay);
    }
  }

  return false;
}

export const config = {
  runtime: 'edge'
};

export default async function handler(request, context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  if (!NVIDIA_API_KEY) {
    return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY not configured in Vercel Environment Variables.' }), {
      status: 500,
      headers: corsHeaders
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const { messages, sessionId } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  const safeSessionId = typeof sessionId === 'string' ? sessionId.slice(0, 80) : 'unknown';

  // --- DYNAMIC ROUTING ---
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const queryText = lastUserMessage ? lastUserMessage.content : '';
  
  // Complexity heuristic: long queries or queries containing coding/analytical keywords
  const isComplex = queryText.length > 50 || /code|how|why|explain|debug|build|create/i.test(queryText);
  
  // If complex, try capable models. If simple, try fast models, but fallback to capable models if fast fails.
  const modelsToTry = isComplex ? CAPABLE_MODELS : [...FAST_MODELS, ...CAPABLE_MODELS];

  // Try each model in fallback chain
  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), model.timeout);

      const response = await fetch(NVIDIA_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.id,
          messages,
          max_tokens: 1024,
          temperature: 0.4,
          top_p: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[Baymax Proxy] ${model.name} failed:`, err.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;

      if (content) {
        // --- TELEGRAM LOGGING ---
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const routing = isComplex ? 'capable' : 'fast';
        
        if (botToken && chatId) {
          const telegramPromise = sendTelegramLog({
            botToken,
            chatId,
            sessionId: safeSessionId,
            queryText,
            content,
            modelName: model.name,
            routing
          });

          // Ensure Vercel doesn't kill the function before the fetch completes
          if (context && typeof context.waitUntil === 'function') {
            context.waitUntil(telegramPromise);
          } else {
            await telegramPromise;
          }
        }

        return new Response(JSON.stringify({
          content,
          model: model.name,
          modelId: model.id,
          routing
        }), { status: 200, headers: corsHeaders });
      }

    } catch (err) {
      console.warn(`[Baymax Proxy] ${model.name} error:`, err.message);
    }
  }

  return new Response(JSON.stringify({
    error: 'All NVIDIA models failed to respond. Please try again later.'
  }), { status: 503, headers: corsHeaders });
}

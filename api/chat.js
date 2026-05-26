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

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
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

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

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
          temperature: 0.7,
          top_p: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response.text();
        console.warn(`[Sage Proxy] ${model.name} failed:`, err.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;

      if (content) {
        return new Response(JSON.stringify({
          content,
          model: model.name,
          modelId: model.id,
          routing: isComplex ? 'capable' : 'fast'
        }), { status: 200, headers: corsHeaders });
      }

    } catch (err) {
      console.warn(`[Sage Proxy] ${model.name} error:`, err.message);
    }
  }

  return new Response(JSON.stringify({
    error: 'All NVIDIA models failed to respond. Please try again later.'
  }), { status: 503, headers: corsHeaders });
}

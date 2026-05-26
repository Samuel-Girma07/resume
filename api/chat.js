/**
 * Vercel Edge Function - AI Chat Proxy
 * Proxies requests to NVIDIA NIM API with secure key storage
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Model fallback chain
const MODELS = [
  { id: 'meta/llama-3.3-70b-instruct', name: 'LLaMA 3.3', timeout: 20000 },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Nemotron', timeout: 20000 },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4', timeout: 25000 }
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
    return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY not configured' }), {
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

  // Try each model in fallback chain
  for (const model of MODELS) {
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
          modelId: model.id
        }), { status: 200, headers: corsHeaders });
      }

    } catch (err) {
      console.warn(`[Sage Proxy] ${model.name} error:`, err.message);
    }
  }

  return new Response(JSON.stringify({
    error: 'All models failed. Please try again later.'
  }), { status: 503, headers: corsHeaders });
}

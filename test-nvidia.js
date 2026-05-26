const key = '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';
const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function test(model) {
  console.log('Testing model:', model);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 50
      })
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('FAIL:', res.status, text);
    } else {
      console.log('SUCCESS:', text.substring(0, 100) + '...');
    }
  } catch (err) {
    console.error('NETWORK ERROR:', err);
  }
}

test('nvidia/llama-3.3-nemotron-super-49b-v1.5');

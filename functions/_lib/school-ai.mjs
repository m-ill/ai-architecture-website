export const DEFAULT_MODEL = 'local/qwen3.8-flash';
export const DEFAULT_BASE_URL = 'https://dku-chat.kloud.zone/llm/v1';
export async function connectSchool(env, messages, stream, signal) {
  const base = String(env.SCHOOL_AI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  if (new URL(base).protocol !== 'https:') throw new Error('configuration');
  const response = await fetch(`${base}/chat/completions`, {
    method:'POST', signal,
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${env.SCHOOL_AI_API_KEY}`},
    body:JSON.stringify({model:env.SCHOOL_AI_MODEL || DEFAULT_MODEL, messages, stream, max_tokens:2048, temperature:0.2, chat_template_kwargs:{enable_thinking:false}})
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(response.status === 429 ? 'busy' : 'unavailable'); }
  return response;
}
export async function* readSSE(body) {
  const reader = body.getReader(), decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const {done,value} = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value,{stream:true});
      let end;
      while ((end=buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0,end).trim(); buffer=buffer.slice(end+1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        if (!data) continue;
        const value = JSON.parse(data);
        if (value.error) throw new Error('unavailable');
        const delta = value.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') yield delta;
      }
      if (done) throw new Error('incomplete-stream');
    }
  } finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
}

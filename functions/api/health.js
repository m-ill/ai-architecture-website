export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, service: 'ai-architecture-nlweb-lite' }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

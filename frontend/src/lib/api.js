const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export async function getJson(path, signal) {
  const response = await fetch(`${base}${path}`, {signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(10_000)]), headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error(`Backend request failed (${response.status}).`);
  const data = await response.json();
  return data;
}
export async function getHealth({signal}) {
  const data = await getJson('/api/health', signal);
  if (data.status !== 'ok' || typeof data.service !== 'string') throw new Error('Unexpected backend health response.');
  return data;
}
export async function getPreview(tab, signal) {
  const data = await getJson(`/api/preview/${encodeURIComponent(tab)}`, signal);
  if (data.mode !== 'sample' || typeof data.title !== 'string' || typeof data.description !== 'string' || typeof data.eyebrow !== 'string' || typeof data.note !== 'string' || !Array.isArray(data.rows) || !data.rows.every(row => typeof row.label === 'string' && typeof row.value === 'string') || !Array.isArray(data.messages) || !data.messages.every(message => ['user','assistant'].includes(message.role) && typeof message.text === 'string')) throw new Error('Unexpected backend preview response.');
  return data;
}

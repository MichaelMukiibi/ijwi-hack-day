export type PreviewTab = 'case' | 'conversation' | 'summary';
export interface Preview {
  mode: 'sample'; eyebrow: string; title: string; description: string; note: string;
  rows: {label: string; value: string}[];
  messages: {role: 'user' | 'assistant'; text: string}[];
}
export interface Health {status: 'ok'; service: string; capabilities: {preview: boolean; gemma: boolean; screening: boolean}}
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${base}${path}`, {signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(10_000)]), headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error(`Backend request failed (${response.status}).`);
  return response.json();
}
export async function getHealth({signal}: {signal: AbortSignal}): Promise<Health> {
  const data = await getJson('/api/health', signal);
  if (!record(data) || data.status !== 'ok' || typeof data.service !== 'string' || !record(data.capabilities) || !['preview','gemma','screening'].every(key => typeof (data.capabilities as Record<string,unknown>)[key] === 'boolean')) throw new Error('Unexpected backend health response.');
  return data as unknown as Health;
}
export async function getPreview(tab: PreviewTab, signal?: AbortSignal): Promise<Preview> {
  const data = await getJson(`/api/preview/${encodeURIComponent(tab)}`, signal);
  if (!record(data) || data.mode !== 'sample' || !['title','description','eyebrow','note'].every(key => typeof data[key] === 'string') || !Array.isArray(data.rows) || !data.rows.every(row => record(row) && typeof row.label === 'string' && typeof row.value === 'string') || !Array.isArray(data.messages) || !data.messages.every(message => record(message) && ['user','assistant'].includes(String(message.role)) && typeof message.text === 'string')) throw new Error('Unexpected backend preview response.');
  return data as unknown as Preview;
}

import { SYSTEM_PROMPT } from './prompt.js';
export const CLOUDFLARE_MODEL = '@cf/google/gemma-4-26b-a4b-it';
export const GOOGLE_MODEL = 'gemma-4-26b-a4b-it';
export class ProviderError extends Error {
  constructor(message, status=503) {super(message);this.status=status;}
}
class ProviderFailure extends Error {
  constructor(kind, status) {super(kind);this.kind=kind;this.status=status;}
}
const failureForStatus = status => new ProviderFailure(status===401||status===403?'authentication':status===429?'rate_limit':status===404?'model_unavailable':'request_failed',status);
const describeFailure = (provider, error) => {
  const name=provider==='cloudflare'?'Cloudflare':'Google';
  const kind=error instanceof ProviderFailure?error.kind:'request_failed';
  const descriptions={timeout:`${name} timed out.`,authentication:`${name} authentication or model permission failed. Check the backend credentials.`,rate_limit:`${name} quota or rate limit was reached.`,model_unavailable:`${name} model is unavailable. Check the configured model ID.`,empty_response:`${name} returned no usable answer.`,request_failed:`${name} could not complete the request.`};
  return {provider,kind,...(error?.status?{status:error.status}:{}),message:descriptions[kind]};
};
const configured = value => typeof value === 'string' && value.trim() !== '';
export function providerStatus(env) {
  return {cloudflare: Boolean(env.AI?.run || (configured(env.CLOUDFLARE_ACCOUNT_ID) && configured(env.CLOUDFLARE_API_TOKEN))), google:configured(env.GOOGLE_API_KEY)};
}
function cfText(data) {
  const value = data?.result ?? data;
  const choice = value?.choices?.[0];
  if (choice?.finish_reason === 'content_filter') throw new ProviderError('The model could not respond to this request.',422);
  const text = choice?.message?.content ?? value?.response;
  if (typeof text !== 'string' || !text.trim()) throw new ProviderFailure('empty_response');
  return text.trim();
}
function googleText(data) {
  if (data?.promptFeedback?.blockReason) throw new ProviderError('The model could not respond to this request.',422);
  const candidate = data?.candidates?.[0];
  if (['SAFETY','PROHIBITED_CONTENT','BLOCKLIST','RECITATION'].includes(candidate?.finishReason)) throw new ProviderError('The model could not respond to this request.',422);
  const text = candidate?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part=>part.text).join('').trim();
  if (!text) throw new ProviderFailure('empty_response');
  return text;
}
async function withDeadline(action, parentSignal) {
  const deadline = AbortSignal.timeout(30_000);
  const signal = parentSignal ? AbortSignal.any([parentSignal,deadline]) : deadline;
  // The binding does not accept AbortSignal; race its promise against the same deadline.
  let listener;
  const aborted = new Promise((_,reject)=>{
    listener=()=>reject(new ProviderFailure('timeout'));
    if (signal.aborted) listener(); else signal.addEventListener('abort',listener,{once:true});
  });
  try {return await Promise.race([Promise.resolve().then(()=>action(signal)),aborted]);}
  finally {signal.removeEventListener('abort',listener);}
}
export async function generateReply(messages, env, parentSignal, fetcher=fetch, options={}) {
  const providers = providerStatus(env);
  if (!providers.cloudflare && !providers.google) throw new ProviderError('Chat is not configured yet. Add the backend provider credentials.');
  const failures=[];
  const model = env.CLOUDFLARE_GEMMA_MODEL || CLOUDFLARE_MODEL;
  if (providers.cloudflare) {
    try {
      const output = await withDeadline(async signal=>{
        const input={messages:[{role:'system',content:options.systemPrompt ?? SYSTEM_PROMPT},...messages],max_completion_tokens:512,temperature:0.3,stream:false,chat_template_kwargs:{enable_thinking:false}};
        if (env.AI?.run) return env.AI.run(model,input);
        const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/run/${model}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`},body:JSON.stringify(input),signal});
        if (!response.ok) throw failureForStatus(response.status);
        const data=await response.json();if(data.success===false) throw new ProviderFailure('request_failed');return data;
      },parentSignal);
      return {reply:cfText(output),provider:'cloudflare',model,fallback:false};
    } catch(error) {
      if (error instanceof ProviderError || parentSignal?.aborted) throw error;
      failures.push(describeFailure('cloudflare',error));
      // Only static categories and HTTP status are retained, never upstream bodies or keys.
    }
  }
  if (providers.google) {
    try {
      const googleModel=env.GOOGLE_GEMMA_MODEL || GOOGLE_MODEL;
      const output=await withDeadline(async signal=>{
        const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(googleModel)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GOOGLE_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:options.systemPrompt ?? SYSTEM_PROMPT}]},contents:messages.map(message=>({role:message.role==='assistant'?'model':'user',parts:[{text:message.content}]})),generationConfig:{maxOutputTokens:512,temperature:0.3,thinkingConfig:{thinkingLevel:'minimal'}}}),signal});
        if(!response.ok) throw failureForStatus(response.status);return response.json();
      },parentSignal);
      return {reply:googleText(output),provider:'google',model:googleModel,fallback:true};
    } catch(error) {if(error instanceof ProviderError || parentSignal?.aborted) throw error;failures.push(describeFailure('google',error));}
  }
  const detail=failures.map(failure=>failure.message).join(' ');
  const fallbackNote=!providers.google?' Google fallback is not configured. Add GOOGLE_API_KEY to the backend environment.':'';
  throw new ProviderError(detail+fallbackNote);
}

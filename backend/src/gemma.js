export const CLOUDFLARE_MODEL = '@cf/google/gemma-4-26b-a4b-it';
export const GOOGLE_MODEL = 'gemma-4-26b-a4b-it';
const SYSTEM = `You are Ijwi, a research assistant supporting community health workers preparing retinal screening cases for specialist review. Be clear, concise, and respectful. Ask focused follow-up questions when information is missing. Distinguish supplied facts from uncertainty. No image, FastDRS prediction, clinical reference retrieval, or patient record is connected to this conversation. Never claim to have examined an image, run screening, retrieved evidence, or diagnosed a patient. Do not invent citations, test results, or referrals. Do not provide definitive diagnoses or prescribe treatment. Support gathering information and understanding the screening workflow; clinical decisions require a qualified professional. Use plain English unless the user requests another language; do not claim translated medical content has been validated. Do not request names, contact details, or identifiers. Explain that this prototype is not a substitute for clinical assessment when relevant.`;
export class ProviderError extends Error {
  constructor(message, status=503) {super(message);this.status=status;}
}
const configured = value => typeof value === 'string' && value.trim() !== '';
export function providerStatus(env) {
  return {cloudflare: Boolean(env.AI?.run || (configured(env.CLOUDFLARE_ACCOUNT_ID) && configured(env.CLOUDFLARE_API_TOKEN))), google:configured(env.GOOGLE_API_KEY)};
}
function cfText(data) {
  const value = data?.result ?? data;
  const choice = value?.choices?.[0];
  if (choice?.finish_reason === 'content_filter') throw new ProviderError('The model could not respond to this request.',422);
  const text = choice?.message?.content ?? value?.response;
  if (typeof text !== 'string' || !text.trim()) throw new Error('Empty Cloudflare response');
  return text.trim();
}
function googleText(data) {
  if (data?.promptFeedback?.blockReason) throw new ProviderError('The model could not respond to this request.',422);
  const candidate = data?.candidates?.[0];
  if (['SAFETY','PROHIBITED_CONTENT','BLOCKLIST','RECITATION'].includes(candidate?.finishReason)) throw new ProviderError('The model could not respond to this request.',422);
  const text = candidate?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part=>part.text).join('').trim();
  if (!text) throw new Error('Empty Google response');
  return text;
}
async function withDeadline(action, parentSignal) {
  const deadline = AbortSignal.timeout(20_000);
  const signal = parentSignal ? AbortSignal.any([parentSignal,deadline]) : deadline;
  // The binding does not accept AbortSignal; race its promise against the same deadline.
  let listener;
  const aborted = new Promise((_,reject)=>{
    listener=()=>reject(new Error('Provider request interrupted'));
    if (signal.aborted) listener(); else signal.addEventListener('abort',listener,{once:true});
  });
  try {return await Promise.race([Promise.resolve().then(()=>action(signal)),aborted]);}
  finally {signal.removeEventListener('abort',listener);}
}
export async function generateReply(messages, env, parentSignal, fetcher=fetch) {
  const providers = providerStatus(env);
  if (!providers.cloudflare && !providers.google) throw new ProviderError('Chat is not configured yet. Add the backend provider credentials.');
  const model = env.CLOUDFLARE_GEMMA_MODEL || CLOUDFLARE_MODEL;
  if (providers.cloudflare) {
    try {
      const output = await withDeadline(async signal=>{
        const input={messages:[{role:'system',content:SYSTEM},...messages],max_tokens:768,temperature:0.3,stream:false};
        if (env.AI?.run) return env.AI.run(model,input);
        const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/ai/run/${model}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`},body:JSON.stringify(input),signal});
        if (!response.ok) throw new Error('Cloudflare request failed');
        const data=await response.json();if(data.success===false) throw new Error('Cloudflare request failed');return data;
      },parentSignal);
      return {reply:cfText(output),provider:'cloudflare',model,fallback:false};
    } catch(error) {
      if (error instanceof ProviderError || parentSignal?.aborted) throw error;
      // Provider errors and credentials are deliberately excluded from public responses and logs.
    }
  }
  if (providers.google) {
    try {
      const googleModel=env.GOOGLE_GEMMA_MODEL || GOOGLE_MODEL;
      const output=await withDeadline(async signal=>{
        const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(googleModel)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GOOGLE_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM}]},contents:messages.map(message=>({role:message.role==='assistant'?'model':'user',parts:[{text:message.content}]})),generationConfig:{maxOutputTokens:768,temperature:0.3}}),signal});
        if(!response.ok) throw new Error('Google request failed');return response.json();
      },parentSignal);
      return {reply:googleText(output),provider:'google',model:googleModel,fallback:true};
    } catch(error) {if(error instanceof ProviderError) throw error;}
  }
  throw new ProviderError('Gemma is temporarily unavailable. Please try again.');
}

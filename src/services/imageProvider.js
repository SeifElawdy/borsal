// Same proven FLUX multipart contract as scripts/spike-cloudflare.js; no SDK/retry.
const {ProviderError}=require('../../experiments/design-language/ai-spike/provider');
const MODEL='@cf/black-forest-labs/flux-2-klein-4b';
function imageProvider({accountId,apiToken,freeTierConfirmed,fetchImpl=globalThis.fetch,timeoutMs=120000}){
  if(!accountId||!apiToken)throw new ProviderError('LIVE_TEST_BLOCKED_MISSING_CREDENTIALS');
  if(freeTierConfirmed!==true)throw new ProviderError('LIVE_TEST_BLOCKED_FREE_TIER_UNVERIFIED');
  return {model:MODEL,mode:'LIVE',async generate({prompt,sourceImage}){
    const form=new FormData();form.append('prompt',prompt);form.append('input_image_0',new Blob([sourceImage],{type:'image/png'}),'source.png');form.append('width','1024');form.append('height','1024');
    const controller=new AbortController(),started=performance.now(),timer=setTimeout(()=>controller.abort(),timeoutMs);let phase='REQUEST';
    try{
      const r=await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL}`,{method:'POST',headers:{Authorization:'Bearer '+apiToken},body:form,signal:controller.signal,redirect:'error'});
      phase='RESPONSE_BODY';if(!r.ok)throw new ProviderError('PROVIDER_HTTP_ERROR',r.status);
      if(Number(r.headers.get('content-length'))>40*1024*1024)throw new ProviderError('IMAGE_RESPONSE_TOO_LARGE',r.status);
      let bytes,usage=null;
      if((r.headers.get('content-type')||'').startsWith('image/'))bytes=Buffer.from(await r.arrayBuffer());
      else{const text=await r.text();if(text.length>40*1024*1024)throw new ProviderError('IMAGE_RESPONSE_TOO_LARGE',r.status);let body;try{body=JSON.parse(text);}catch{throw new ProviderError('INVALID_IMAGE_RESPONSE',r.status);}
        const encoded=body.result?.image||body.image;if(body.success===false||typeof encoded!=='string')throw new ProviderError('INVALID_IMAGE_RESPONSE',r.status);
        bytes=Buffer.from(encoded.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/,''),'base64');usage=body.usage||body.result?.usage||body.metrics||null;}
      if(!bytes.length||bytes.length>20*1024*1024)throw new ProviderError('INVALID_IMAGE_RESPONSE',r.status);
      return {bytes,usage,httpStatus:r.status,elapsedMs:Math.round(performance.now()-started),conditioning:'input_image_0',model:MODEL};
    }catch(e){if(e instanceof ProviderError)throw e;const code=controller.signal.aborted?'TIMEOUT':'NETWORK_ERROR';throw new ProviderError(code,null,[],{elapsedMs:Math.round(performance.now()-started),phase,outcome:'UNKNOWN_PROVIDER_EXECUTION'});}
    finally{clearTimeout(timer);}
  }};
}
module.exports={imageProvider,MODEL};

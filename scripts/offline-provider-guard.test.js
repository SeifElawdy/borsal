import {it,expect} from 'vitest';
const {execFileSync}=require('child_process'),path=require('path');
it('clears provider credentials and blocks provider fetch/http before outbound dispatch',()=>{
 const script=`let sent=0;globalThis.fetch=()=>{sent++;throw Error('UNSAFE_DISPATCH')};process.env.CF_API_TOKEN='TEST_ONLY';process.env.CLOUDFLARE_API_TOKEN='TEST_ONLY';require(${JSON.stringify(require.resolve('./offline-provider-guard.cjs'))});if(process.env.CF_API_TOKEN||process.env.CLOUDFLARE_API_TOKEN)throw Error('CREDENTIALS_RETAINED');let denied=0;for(const url of ['https://api.cloudflare.com/test','https://api.openai.com/test']){try{fetch(url)}catch(e){if(e.message==='OFFLINE_PROVIDER_NETWORK_FORBIDDEN')denied++;}try{require('https').get(url)}catch(e){if(e.message==='OFFLINE_PROVIDER_NETWORK_FORBIDDEN')denied++;}}if(sent||denied!==4)throw Error('GUARD_FAILURE');console.log('NO_PROVIDER_FETCH_DISPATCH');`;
 // This child installs the guard explicitly after a sentinel fetch, so do not
 // preload/cache it before that setup. No real credentials or transport is used.
 const output=execFileSync(process.execPath,['-e',script],{cwd:path.resolve(__dirname,'..'),env:{...process.env,NODE_OPTIONS:''},encoding:'utf8',windowsHide:true});expect(output.trim()).toBe('NO_PROVIDER_FETCH_DISPATCH');
});

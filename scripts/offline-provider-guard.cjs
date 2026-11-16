// Opt-in preload for offline verification. Allows loopback API/DB tests, no outbound HTTP.
// NODE_OPTIONS=--require=<absolute path to this file>; inherited by test/build workers.
function clearCredentials(){for(const key of Object.keys(process.env))if(/^(CF_|CLOUDFLARE_)/.test(key)||['BORSAL_TECHNICAL_LIVE','BORSAL_WORKERS_FREE_CONFIRMED'].includes(key))delete process.env[key];}
clearCredentials();
const dotenv=require('dotenv'),config=dotenv.config;
dotenv.config=function(...args){const result=config.apply(this,args);clearCredentials();return result;};
const allowed=new Set(['127.0.0.1','localhost','[::1]','::1']);
function local(input){try{return allowed.has(new URL(typeof input==='string'||input instanceof URL?input:input.url).hostname);}catch{return false;}}
function blocked(){throw Error('OFFLINE_PROVIDER_NETWORK_FORBIDDEN');}
const fetch=globalThis.fetch;
globalThis.fetch=function(input,...args){return local(input)?fetch(input,...args):blocked();};
for(const name of ['http','https']){const module=require(name);for(const method of ['request','get']){const original=module[method];module[method]=function(input,...args){const host=typeof input==='object'&&!(input instanceof URL)?input.hostname||input.host:null;return (host?allowed.has(host):local(input))?original.call(this,input,...args):blocked();};}}

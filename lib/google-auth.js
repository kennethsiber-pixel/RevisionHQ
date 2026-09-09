import crypto from 'node:crypto';

const TOKEN_COOKIE = 'rhq_google';
const OAUTH_STATE_COOKIE = 'rhq_oauth_state';
const OAUTH_RETURN_COOKIE = 'rhq_oauth_return';

export function isGoogleConfigured(){
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_SECRET);
}

function key(){
  if(!process.env.APP_SECRET) throw new Error('APP_SECRET missing');
  return crypto.createHash('sha256').update(process.env.APP_SECRET).digest();
}

function parseCookies(req){
  const raw=req.headers?.cookie||'';
  return Object.fromEntries(raw.split(';').map(x=>x.trim()).filter(Boolean).map(part=>{
    const i=part.indexOf('=');
    return i<0?[part,'']:[part.slice(0,i),decodeURIComponent(part.slice(i+1))];
  }));
}

function encode(payload){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return Buffer.concat([iv,tag,body]).toString('base64url');
}

function decode(value){
  try{
    const data=Buffer.from(value,'base64url');
    const iv=data.subarray(0,12),tag=data.subarray(12,28),body=data.subarray(28);
    const decipher=crypto.createDecipheriv('aes-256-gcm',key(),iv); decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(body),decipher.final()]).toString('utf8'));
  }catch{return null;}
}

function cookie(name,value,{maxAge=60*60*24*30,httpOnly=true}={}){
  const bits=[`${name}=${encodeURIComponent(value)}`,'Path=/','SameSite=Lax'];
  if(httpOnly)bits.push('HttpOnly');
  if(process.env.NODE_ENV==='production')bits.push('Secure');
  if(maxAge!==undefined)bits.push(`Max-Age=${maxAge}`);
  return bits.join('; ');
}

function appendSetCookie(res,value){
  const current=res.getHeader('Set-Cookie');
  if(!current)res.setHeader('Set-Cookie',[value]);
  else res.setHeader('Set-Cookie',Array.isArray(current)?[...current,value]:[current,value]);
}

export function clearCookie(res,name){ appendSetCookie(res,cookie(name,'',{maxAge:0})); }
export function setOAuthState(res,state,returnTo='/'){ appendSetCookie(res,cookie(OAUTH_STATE_COOKIE,state,{maxAge:600})); appendSetCookie(res,cookie(OAUTH_RETURN_COOKIE,returnTo,{maxAge:600})); }
export function getOAuthState(req){ const c=parseCookies(req); return {state:c[OAUTH_STATE_COOKIE]||'',returnTo:c[OAUTH_RETURN_COOKIE]||'/'}; }
export function clearOAuthState(res){ clearCookie(res,OAUTH_STATE_COOKIE);clearCookie(res,OAUTH_RETURN_COOKIE); }

export function getRedirectUri(req){
  if(process.env.GOOGLE_REDIRECT_URI)return process.env.GOOGLE_REDIRECT_URI;
  const proto=(req.headers['x-forwarded-proto']||'http').split(',')[0].trim();
  const host=req.headers['x-forwarded-host']||req.headers.host;
  return `${proto}://${host}/api/google/callback`;
}

export function getToken(req){
  if(!isGoogleConfigured())return null;
  const raw=parseCookies(req)[TOKEN_COOKIE]; return raw?decode(raw):null;
}

export function setToken(res,token){ appendSetCookie(res,cookie(TOKEN_COOKIE,encode(token),{maxAge:60*60*24*45})); }
export function clearToken(res){ clearCookie(res,TOKEN_COOKIE); }

export async function exchangeCode(code,redirectUri){
  const params=new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri,grant_type:'authorization_code'});
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params});
  if(!r.ok)throw new Error(`Google token exchange failed: ${r.status}`);
  const data=await r.json();
  return {...data,expires_at:Date.now()+(Number(data.expires_in||3600)*1000)-60000};
}

async function refreshToken(token){
  if(!token?.refresh_token)throw new Error('No refresh token');
  const params=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,refresh_token:token.refresh_token,grant_type:'refresh_token'});
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params});
  if(!r.ok)throw new Error(`Google token refresh failed: ${r.status}`);
  const data=await r.json();
  return {...token,...data,refresh_token:token.refresh_token,expires_at:Date.now()+(Number(data.expires_in||3600)*1000)-60000};
}

export async function ensureAccessToken(req,res){
  let token=getToken(req); if(!token?.access_token)return null;
  if(Number(token.expires_at||0)<=Date.now()){
    try{token=await refreshToken(token);setToken(res,token);}catch{clearToken(res);return null;}
  }
  return token;
}

export async function googleJson(url,token,options={}){
  const headers={...(options.headers||{}),Authorization:`Bearer ${token.access_token}`};
  const r=await fetch(url,{...options,headers});
  if(!r.ok){const text=await r.text();throw new Error(`Google API ${r.status}: ${text.slice(0,200)}`);}
  return r.status===204?null:r.json();
}

import {clearOAuthState,exchangeCode,getOAuthState,getRedirectUri,setToken} from '../../lib/google-auth.js';

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).send('Method not allowed');
  const {state:expected,returnTo}=getOAuthState(req); const received=String(req.query?.state||''); const code=String(req.query?.code||'');
  clearOAuthState(res);
  if(!code||!expected||received!==expected)return res.status(400).send('Google connection could not be verified.');
  try{const token=await exchangeCode(code,getRedirectUri(req));setToken(res,token);res.redirect(302,returnTo||'/');}
  catch(e){res.status(500).send('Google connection failed.');}
}

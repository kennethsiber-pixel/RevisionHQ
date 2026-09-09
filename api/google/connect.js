import crypto from 'node:crypto';
import {getRedirectUri,isGoogleConfigured,setOAuthState} from '../../lib/google-auth.js';

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!isGoogleConfigured())return res.status(503).json({error:'Google integration is not configured'});
  const returnTo=typeof req.query?.return==='string' && req.query.return.startsWith('/')?req.query.return:'/';
  const state=crypto.randomBytes(24).toString('hex'); setOAuthState(res,state,returnTo);
  const params=new URLSearchParams({
    client_id:process.env.GOOGLE_CLIENT_ID,
    redirect_uri:getRedirectUri(req),
    response_type:'code',
    access_type:'offline',
    prompt:'consent',
    scope:[
      'openid','email','profile',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/drive.appdata'
    ].join(' '),
    state
  });
  res.redirect(302,`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

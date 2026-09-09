import {ensureAccessToken,googleJson,isGoogleConfigured} from '../../lib/google-auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!isGoogleConfigured())return res.status(200).json({configured:false,connected:false});
  const token=await ensureAccessToken(req,res); if(!token)return res.status(200).json({configured:true,connected:false});
  try{const profile=await googleJson('https://openidconnect.googleapis.com/v1/userinfo',token);return res.status(200).json({configured:true,connected:true,email:profile.email||'',name:profile.name||''});}
  catch{return res.status(200).json({configured:true,connected:true});}
}

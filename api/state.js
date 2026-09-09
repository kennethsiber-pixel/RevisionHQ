import {ensureAccessToken,googleJson} from '../lib/google-auth.js';

const FILE_NAME='revision-hq-state.json';

async function findStateFile(token){
  const q=`name='${FILE_NAME}' and trashed=false`;
  const params=new URLSearchParams({spaces:'appDataFolder',q,fields:'files(id,name,modifiedTime)',pageSize:'1'});
  const data=await googleJson(`https://www.googleapis.com/drive/v3/files?${params}`,token);
  return data.files?.[0]||null;
}

async function readState(token,file){
  if(!file)return null;
  const r=await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,{headers:{Authorization:`Bearer ${token.access_token}`}});
  if(r.status===404)return null; if(!r.ok)throw new Error(`Drive read failed ${r.status}`);
  return r.json();
}

async function writeMedia(token,fileId,state){
  const r=await fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,{method:'PATCH',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(state)});
  if(!r.ok)throw new Error(`Drive write failed ${r.status}`);
}

async function createStateFile(token,state){
  const meta=await googleJson('https://www.googleapis.com/drive/v3/files?fields=id',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:FILE_NAME,parents:['appDataFolder']})});
  await writeMedia(token,meta.id,state); return meta.id;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const token=await ensureAccessToken(req,res); if(!token)return res.status(401).json({error:'Not connected'});
  try{
    const file=await findStateFile(token);
    if(req.method==='GET')return res.status(200).json({state:await readState(token,file)});
    if(req.method==='PUT'){
      const incoming=req.body?.state;
      if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))return res.status(400).json({error:'State object required'});
      const body=JSON.stringify(incoming); if(body.length>750000)return res.status(413).json({error:'State too large'});
      if(file)await writeMedia(token,file.id,incoming);else await createStateFile(token,incoming);
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({error:'Method not allowed'});
  }catch(e){return res.status(502).json({error:'Cloud state sync failed'});}
}

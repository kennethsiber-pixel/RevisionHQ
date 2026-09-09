import {ensureAccessToken,googleJson} from '../../lib/google-auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const token=await ensureAccessToken(req,res); if(!token)return res.status(401).json({error:'Not connected'});
  const start=String(req.query?.start||''),end=String(req.query?.end||'');
  if(!start||!end||Number.isNaN(Date.parse(start))||Number.isNaN(Date.parse(end)))return res.status(400).json({error:'Valid start and end are required'});
  const qs=new URLSearchParams({timeMin:new Date(start).toISOString(),timeMax:new Date(end).toISOString(),singleEvents:'true',orderBy:'startTime',maxResults:'100',fields:'items(id,summary,start,end,location,htmlLink,hangoutLink,description)'});
  try{
    const data=await googleJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${qs}`,token);
    const events=(data.items||[]).map(e=>({id:e.id,summary:e.summary||'Busy',start:e.start?.dateTime||e.start?.date||'',end:e.end?.dateTime||e.end?.date||'',allDay:Boolean(e.start?.date&&!e.start?.dateTime),location:e.location||'',htmlLink:e.htmlLink||'',hangoutLink:e.hangoutLink||''}));
    res.status(200).json({events});
  }catch(e){res.status(502).json({error:'Calendar sync failed'});}
}

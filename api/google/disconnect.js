import {clearToken} from '../../lib/google-auth.js';
export default async function handler(req,res){ if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});clearToken(res);res.status(200).json({ok:true}); }

(()=>{'use strict';
const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
const CORE_KEY='revisionHQ_v8',ENG_KEY='revisionHQ_engagement_v10';
const MODES={5:{required:5,target:8},8:{required:8,target:15},15:{required:12,target:30},25:{required:18,target:50}};
const SPECS=[
{id:'his-charles',prompt:'Why did Personal Rule become unsustainable by 1640?',checks:[
 {strong:['ship money','prerogative finance','taxation'],terms:['tax*','financ*','revenue','money','prerogative']},
 {strong:['william laud','archbishop laud','laudian'],terms:['laud*','relig*','catholic*','arminian*']},
 {strong:['bishops war','scottish crisis','scotland'],terms:['scot*','war','military','parliament*','1640']}
]},
{id:'his-war',prompt:'What turned political conflict into civil war in 1641–42?',checks:[
 {strong:['militia ordinance','control of the militia'],terms:['militia','army','armed','force*','military']},
 {strong:['grand remonstrance'],terms:['remonstrance','relig*','division*','parliament*']},
 {strong:['five members','attempted arrest'],terms:['arrest*','members','mobilis*','mobiliz*','troop*','1642']}
]},
{id:'his-apartheid',prompt:'What made apartheid after 1948 more than earlier segregation?',checks:[
 {strong:['national party','apartheid state'],terms:['national','party','system*','state','1948']},
 {strong:['population registration','group areas'],terms:['classification','classif*','race','racial','area*']},
 {strong:['pass laws','bantu education'],terms:['pass*','education','labour','labor','work*','control*']}
]},
{id:'his-resistance',prompt:'Why did resistance to apartheid become increasingly difficult to contain?',checks:[
 {strong:['anc','pac'],terms:['protest*','mass','campaign*','mobilis*','mobiliz*']},
 {strong:['sharpeville','armed struggle'],terms:['repress*','ban*','violence','underground','armed']},
 {strong:['soweto','international pressure'],terms:['international','sanction*','economic','econom*','pressure','soweto']}
]},
{id:'his-transition',prompt:'Why did South Africa move from apartheid to negotiated transition?',checks:[
 {strong:['de klerk','nelson mandela'],terms:['unban*','release*','1990','mandela']},
 {strong:['codesa','negotiations'],terms:['negotiat*','talk*','violence','agreement*','compromise']},
 {strong:['1994 election','truth and reconciliation','trc'],terms:['election*','democra*','reconciliation','1994']}
]},
{id:'eng-rep',prompt:'What makes a strong representation analysis rather than feature spotting?',checks:[
 {strong:['lexical choices','grammatical choices','discourse choices'],terms:['lexic*','grammar*','discourse','pattern*','language']},
 {strong:['construct representation','constructs representation'],terms:['construct*','represent*','portray*','present*','identity']},
 {strong:['audience purpose','genre and context'],terms:['audience','purpose','genre','context']}
]},
{id:'eng-child',prompt:'What should a strong child-language answer connect together?',checks:[
 {strong:['phonology','pragmatics'],terms:['phonolog*','lexis','lexical','grammar*','pragmatic*','syntax']},
 {strong:['caregiver','scaffolding'],terms:['caregiver*','parent*','interaction','model*','scaffold*']},
 {strong:['chomsky','skinner','vygotsky','bruner'],terms:['theor*','innate','behaviour*','behavior*','interaction*']}
]},
{id:'eng-div',prompt:'What are the three moves in a strong language-diversity argument?',checks:[
 {strong:['regional variation','social variation'],terms:['region*','social','occupation*','identity','dialect*','sociolect*']},
 {strong:['code switching','code-switching','audience design'],terms:['accommodat*','switch*','audience','design']},
 {strong:['prescriptive','descriptive'],terms:['attitude*','prescript*','descript*','standard','prestige']}
]},
{id:'eng-change',prompt:'What drives language change, and how should you evaluate it?',checks:[
 {strong:['semantic change','lexical change','phonological change'],terms:['lexic*','semantic*','grammar*','phonolog*','change']},
 {strong:['technology','social change'],terms:['social','technolog*','culture*','internal','external','contact']},
 {strong:['prescriptive','descriptive'],terms:['attitude*','prescript*','descript*','decline','innovation']}
]},
{id:'eng-write',prompt:'What makes persuasive writing controlled rather than simply “rhetorical”?',checks:[
 {strong:['audience purpose','audience and purpose'],terms:['audience','purpose','genre']},
 {strong:['structural patterning','structure'],terms:['structur*','pattern*','progress*','emphasis','sequence']},
 {strong:['consistent stance','representation'],terms:['stance','represent*','voice','position*','viewpoint']}
]},
{id:'rs-god',prompt:'How can Christian authority be justified when sources appear to conflict?',checks:[
 {strong:['scripture','the bible','bible'],terms:['scriptur*','biblical','word','text']},
 {strong:['church tradition','tradition'],terms:['church','tradition','teaching','authority']},
 {strong:['reason and experience','religious experience'],terms:['reason','experience','interpret*','conscience']}
]},
{id:'rs-self',prompt:'What needs comparing in Christian views of self, death and afterlife?',checks:[
 {strong:['resurrection','the soul','soul'],terms:['soul','resurrect*','identity','body']},
 {strong:['heaven and hell','judgement','judgment'],terms:['heaven','hell','judg*','afterlife']},
 {strong:['salvation'],terms:['ethic*','behavio*','salvation','moral*','life']}
]},
{id:'rs-arguments',prompt:'How do you turn an argument for God into an evaluative paragraph?',checks:[
 {strong:['cosmological','teleological','ontological'],terms:['premise*','argument','infer*','reason*']},
 {strong:['counterargument','objection'],terms:['objection','critic*','challenge','counter*','weakness']},
 {strong:['evaluate','evaluation'],terms:['judge','judgement','judgment','conclusion','limit*','defeat*']}
]},
{id:'rs-evil',prompt:'What are the key distinctions needed in an essay on evil?',checks:[
 {strong:['logical problem','evidential problem'],terms:['logical','evidential','problem','evil']},
 {strong:['free will','soul making','soul-making','theodicy'],terms:['free','will','theodic*','defence','defense']},
 {strong:['natural evil','moral evil'],terms:['natural','moral','suffering','scale','pain']}
]},
{id:'rs-ethics',prompt:'What makes comparison of ethical theories analytical?',checks:[
 {strong:['decision rule','central principle'],terms:['principle','rule','theor*','duty','utility','virtue']},
 {strong:['apply each theory','application'],terms:['apply','application','case','scenario','dilemma']},
 {strong:['consequences','character','intention'],terms:['consisten*','consequence*','character','intention','outcome']}
]}
];
let analysis=null;
const read=(key,fallback={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
const write=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val))}catch{}};
function normalize(s){return String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9\-\s']/g,' ').replace(/\s+/g,' ').trim()}
function tokensOf(s){return normalize(s).split(' ').filter(Boolean)}
function hasTerm(text,tokens,term){if(term.includes(' '))return text.includes(term);if(term.endsWith('*')){const stem=term.slice(0,-1);return tokens.some(w=>w.startsWith(stem))}return tokens.includes(term)}
function checkConcept(c,text,tokens){if(c.strong.some(t=>hasTerm(text,tokens,t)))return true;let hits=0;for(const t of c.terms)if(hasTerm(text,tokens,t))hits++;return hits>=2}
function looksGarbage(tokens){if(tokens.length<3)return true;const counts={};tokens.forEach(w=>counts[w]=(counts[w]||0)+1);const max=Math.max(...Object.values(counts)),unique=Object.keys(counts).length;if(tokens.length>=6&&max/tokens.length>.48)return true;if(tokens.length>=8&&unique/tokens.length<.38)return true;if(tokens.some(w=>/(.)\1{4,}/.test(w)))return true;return false}
function currentSpec(){const prompt=normalize(q('#missionPrompt')?.textContent||'');return SPECS.find(s=>prompt.includes(normalize(s.prompt)))||null}
function currentMinutes(){const m=(q('#missionClock')?.textContent||'').match(/(\d+)/);return m?Number(m[1]):15}
function assess(){const answer=q('#missionAnswer')?.value||'',text=normalize(answer),tokens=tokensOf(answer),mins=currentMinutes(),mode=MODES[mins]||MODES[15],spec=currentSpec();if(!spec)return{valid:false,message:'I cannot identify this mission topic, so I will not award a score.'};if(looksGarbage(tokens))return{valid:false,message:'That does not look like a scorable attempt yet. Write a real answer in your own words.'};if(tokens.length<mode.required)return{valid:false,message:`Too thin to score yet: ${tokens.length} words. Give me at least ${mode.required} words with one specific idea, example or named concept.`};const matched=spec.checks.map(c=>checkConcept(c,text,tokens)),count=matched.filter(Boolean).length;if(count===0)return{valid:false,message:'I cannot find a relevant topic idea in that answer yet. Add a specific event, concept, theory, example or piece of terminology from this topic.'};let score=[0,38,72,94][count];if(tokens.length>=mode.target)score=Math.min(100,score+6);const anchors=qa('.mission-anchor').map(b=>b.querySelector('span')?.textContent||b.textContent);const missed=matched.map((x,i)=>x?null:anchors[i]).filter(Boolean);return{valid:true,spec,mins,words:tokens.length,matched,count,score,missed,answer}}
function showAnalysis(a){analysis=a;q('#missionNudge').textContent='';q('#missionAnswer').hidden=true;q('#missionCheck').hidden=true;q('#missionCheckStage').hidden=false;qa('.mission-progress i').forEach(x=>x.classList.add('on'));setText('#missionBestLabel','AUTO-CHECKED');const head=q('#missionCheckStage h3');if(head)head.textContent=`Revision HQ found ${a.count} of 3 key ideas`;const honesty=q('.mission-honesty');if(honesty)honesty.textContent=a.count===3?'Strong coverage. The typed answer contains all three target ideas.':a.count===2?'Good coverage. One important idea is still missing.':'Partial recall. One relevant idea is there, but two important areas are missing.';qa('.mission-anchor').forEach((b,i)=>{b.disabled=true;b.classList.toggle('selected',a.matched[i]);b.classList.toggle('missed',!a.matched[i]);const icon=b.querySelector('i');if(icon)icon.textContent=a.matched[i]?'✓':'—'});const finish=q('#missionFinish');if(finish)finish.textContent='Score this answer →'}
function setText(sel,text){const el=q(sel);if(el)el.textContent=text}
function handleCheck(e){e.preventDefault();e.stopImmediatePropagation();const a=assess();if(!a.valid){analysis=null;setText('#missionNudge',a.message);q('#missionAnswer')?.focus();return}showAnalysis(a)}
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function mondayKey(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return localKey(d)}
function localKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function momentum(log){const start=mondayKey(),endDate=new Date(`${start}T12:00:00`);endDate.setDate(endDate.getDate()+6);const end=localKey(endDate);return Math.min(5,new Set((log||[]).filter(x=>x.date>=start&&x.date<=end).map(x=>x.date)).size)}
function handleFinish(e){e.preventDefault();e.stopImmediatePropagation();if(!analysis||!analysis.valid)return;const a=analysis,id=a.spec.id,oldMatch=(q('#missionTopic')?.textContent||'').match(/(\d+)% mastery/),old=oldMatch?Number(oldMatch[1]):0,gain=a.score>=90?(a.mins>=15?4:3):a.score>=65?2:1,newScore=Math.min(95,old+gain),xp=Math.round(8+a.mins*1.25+a.count*18+(a.score>=90?14:a.score>=65?7:0));
 const eng=read(ENG_KEY,{version:10,xp:0,missionCount:0,missionBests:{},missionLog:[],lastMissionTopic:''});eng.missionBests=eng.missionBests||{};eng.missionLog=Array.isArray(eng.missionLog)?eng.missionLog:[];const prev=Number(eng.missionBests[id]||0),isPb=a.score>prev;eng.xp=Number(eng.xp||0)+xp;eng.missionCount=Number(eng.missionCount||0)+1;eng.missionBests[id]=Math.max(prev,a.score);eng.lastMissionTopic=id;eng.missionLog.push({date:localDate(),topic:id,score:a.score,xp,mins:a.mins,words:a.words,source:'typed-rubric-v1'});eng.missionLog=eng.missionLog.slice(-100);write(ENG_KEY,eng);
 const core=read(CORE_KEY,{});core.topicScores={...(core.topicScores||{}),[id]:newScore};core.lastReviewed={...(core.lastReviewed||{}),[id]:0};core.focusedMinutes=Number(core.focusedMinutes||0)+a.mins;core.weekMinutes=Array.isArray(core.weekMinutes)&&core.weekMinutes.length===7?[...core.weekMinutes]:[0,0,0,0,0,0,0];const day=(new Date().getDay()+6)%7;core.weekMinutes[day]=Number(core.weekMinutes[day]||0)+a.mins;if(core.completedDate!==localDate()){core.completedDate=localDate();core.completedToday=[]}core.completedToday=Array.isArray(core.completedToday)?core.completedToday:[];if(!core.completedToday.includes(id))core.completedToday.push(id);write(CORE_KEY,core);
 q('#missionRun').hidden=true;q('#missionResult').hidden=false;setText('#resultScore',`${a.score}%`);setText('#resultMastery',`${old} → ${newScore}`);setText('#resultXp',`+${xp}`);setText('#resultMomentum',`${momentum(eng.missionLog)} / 5`);const pb=q('#resultPb');if(pb){pb.hidden=!isPb;if(isPb)pb.textContent=prev?'NEW PERSONAL BEST':'FIRST SCORE LOGGED'}setText('#resultHeadline',a.score>=90?'Strong recall. The answer covered the key ground.':a.score>=65?'Good answer. One important gap remains.':'Relevant start, but the answer is still incomplete.');setText('#resultNext',a.missed.length?`What was missing: ${a.missed[0]}`:'All three target ideas were present.');analysis=null}
function installFiveMinute(){const row=q('.mission-buttons');if(!row||q('[data-five-minute]'))return;const b=document.createElement('button');b.type='button';b.dataset.fiveMinute='1';b.innerHTML='<span>Just give me something</span><b>5m</b>';b.addEventListener('click',()=>q('#tinyMission')?.click());row.prepend(b)}
function installStyles(){if(q('#missionEvaluatorStyles'))return;const st=document.createElement('style');st.id='missionEvaluatorStyles';st.textContent='.mission-anchor.missed{opacity:.58;border-color:#5a3b38!important;background:rgba(120,50,42,.08)!important}.mission-anchor:disabled{cursor:default}.mission-compose-meta #missionNudge{max-width:76%;text-align:right;line-height:1.35}.mission-buttons [data-five-minute]{border-color:#5d7280;background:#08151e}.mission-buttons [data-five-minute] b{color:#c8d4da}';document.head.appendChild(st)}
function install(){installStyles();installFiveMinute();const check=q('#missionCheck'),finish=q('#missionFinish');if(check&&!check.dataset.evaluator){check.dataset.evaluator='1';check.addEventListener('click',handleCheck,true)}if(finish&&!finish.dataset.evaluator){finish.dataset.evaluator='1';finish.addEventListener('click',handleFinish,true)}q('#missionAnswer')?.addEventListener('input',()=>{analysis=null})}
install();
})();
const SUBJECTS = [
  {
    id:'english', name:'English Language', board:'AQA 7702', subtitle:'Language, the individual and society · Diversity and change', confidence:63,
    topics:[
      {id:'eng-rep',name:'Textual variations & representations',unit:'Paper 1',score:72,last:'3 days ago'},
      {id:'eng-child',name:"Children's language development",unit:'Paper 1',score:58,last:'8 days ago'},
      {id:'eng-div',name:'Language diversity',unit:'Paper 2',score:68,last:'5 days ago'},
      {id:'eng-change',name:'Language change',unit:'Paper 2',score:52,last:'12 days ago'},
      {id:'eng-disc',name:'Language discourses',unit:'Paper 2',score:61,last:'7 days ago'},
      {id:'eng-write',name:'Opinion / persuasive writing',unit:'Paper 2',score:66,last:'6 days ago'},
      {id:'eng-nea',name:'Language in Action NEA',unit:'NEA',score:70,last:'14 days ago'}
    ]
  },
  {
    id:'history', name:'History', board:'OCR H505', subtitle:'Y108 Early Stuarts · Y224 Apartheid & Reconciliation', confidence:55,
    topics:[
      {id:'his-james',name:'James I: monarchy & Parliament',unit:'Y108',score:64,last:'6 days ago'},
      {id:'his-charles',name:'Charles I & Personal Rule, 1629–1640',unit:'Y108',score:39,last:'15 days ago'},
      {id:'his-war',name:'Origins & outbreak of Civil War',unit:'Y108',score:47,last:'11 days ago'},
      {id:'his-cromwell',name:'Interregnum & Cromwell',unit:'Y108',score:59,last:'9 days ago'},
      {id:'his-apartheid',name:'Creation & consolidation of apartheid',unit:'Y224',score:56,last:'7 days ago'},
      {id:'his-resistance',name:'Resistance, repression & reform',unit:'Y224',score:51,last:'10 days ago'},
      {id:'his-transition',name:'Negotiation, transition & reconciliation',unit:'Y224',score:69,last:'4 days ago'}
    ]
  },
  {
    id:'rs', name:'Religious Studies', board:'AQA 7062 · 2B', subtitle:'Christianity · Philosophy of religion · Ethics', confidence:60,
    topics:[
      {id:'rs-god',name:'Sources of wisdom & authority',unit:'Christianity 2B',score:67,last:'5 days ago'},
      {id:'rs-self',name:'Self, death & afterlife',unit:'Christianity 2B',score:54,last:'9 days ago'},
      {id:'rs-good',name:'Good conduct & key moral principles',unit:'Christianity 2B',score:61,last:'7 days ago'},
      {id:'rs-expression',name:'Expressions of religious identity',unit:'Christianity 2B',score:64,last:'8 days ago'},
      {id:'rs-arguments',name:'Arguments for the existence of God',unit:'Philosophy',score:48,last:'13 days ago'},
      {id:'rs-evil',name:'Problem of evil',unit:'Philosophy',score:57,last:'10 days ago'},
      {id:'rs-ethics',name:'Normative ethical theories',unit:'Ethics',score:70,last:'4 days ago'}
    ]
  }
];

const CARDS = [
  {subject:'History',tag:'OCR H505 · Y108',q:'Why did Charles I rely on prerogative taxation during the Personal Rule?',a:'Parliament was not sitting, while ordinary Crown revenue was inadequate. Charles expanded older fiscal devices such as Ship Money and forest fines to fund government without parliamentary taxation.'},
  {subject:'History',tag:'OCR H505 · Y108',q:'Why was Ship Money politically dangerous even when collection initially succeeded?',a:'It extended an emergency coastal levy inland and then made it annual, turning a financial device into a constitutional dispute about whether the king could tax without Parliament.'},
  {subject:'English',tag:'AQA 7702 · PAPER 2',q:'What is the difference between language diversity and language change?',a:'Diversity concerns variation between users and contexts at a given time; change concerns how language forms and attitudes develop over time. In essays, the two can interact but should not be treated as the same process.'},
  {subject:'RS',tag:'AQA 7062 · CHRISTIANITY 2B',q:'Give one tension between exclusivist and inclusivist Christian views of salvation.',a:'Exclusivism links salvation explicitly to Christ and often conscious faith; inclusivism can hold Christ as the means of salvation while allowing people outside explicit Christianity to be saved.'},
  {subject:'History',tag:'OCR H505 · Y224',q:'Why did the National Party victory of 1948 matter beyond simply introducing segregation?',a:'Segregation already existed, but the NP systematised and intensified racial separation through a more coherent legal and administrative programme of apartheid.'},
  {subject:'English',tag:'AQA 7702 · PAPER 1',q:'When analysing representation, what should you move beyond after identifying a feature?',a:'Move from feature to pattern, then to how language constructs people/events/relationships, linking choices to audience, purpose, genre and context rather than naming techniques in isolation.'},
  {subject:'RS',tag:'AQA 7062 · PHILOSOPHY',q:'What makes the logical problem of evil different from the evidential problem?',a:'The logical version claims God and evil are incompatible; the evidential version argues the amount or kinds of evil make God’s existence less probable, even if not strictly contradictory.'},
  {subject:'History',tag:'OCR H505 · Y108',q:'What made the Scottish crisis of 1637–40 fatal to the Personal Rule?',a:'Religious policy provoked resistance and war, which required money Charles could not raise adequately without Parliament. The financial and military crisis forced him to recall Parliament in 1640.'}
];

const DEFAULT_STATE = {
  streak:6,
  sessions:18,
  minutes:565,
  cardsDone:74,
  deepDives:9,
  cardIndex:0,
  currentCardFilter:'All',
  today:[
    {id:'t1',text:'History · Personal Rule Deep Dive',mins:30,done:false},
    {id:'t2',text:'English · 8 retrieval cards',mins:15,done:true},
    {id:'t3',text:'RS · Problem of Evil essay plan',mins:25,done:false}
  ],
  week:[35,40,0,55,75,0,0],
  topicScores:{},
  repairCards:[],
  plannerItems:[],
  updatedAt:0
};

const STORAGE_KEY = 'revisionHQ_v3';
let cloudConnected = false;
let googleConfigured = false;
let googleEmail = '';
let plannerWeekOffset = 0;
let calendarEvents = [];
let cloudSaveTimer = null;
let state = loadState();
let currentDeep = {subject:'history',topic:'his-charles'};
let deepStep = 1;
let confidenceChoice = null;
let timerSeconds = 25*60, timerId=null;

function cloneDefaults(){ return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
function mondayOf(input){
  const d=new Date(input); d.setHours(0,0,0,0);
  const delta=(d.getDay()+6)%7; d.setDate(d.getDate()-delta); return d;
}
function addDays(input,n){ const d=new Date(input); d.setDate(d.getDate()+n); return d; }
function isoDate(input){ const d=new Date(input); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function uid(prefix='item'){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function esc(value=''){ return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function safeUrl(value=''){ try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';} }
function seedPlannerItems(){
  const mon=mondayOf(new Date());
  const seed=[
    [0,'English','Language change cards','17:30',20,true],
    [1,'History','Y224 retrieval set','18:00',30,true],
    [2,'RS','Problem of Evil essay plan','17:30',25,false],
    [3,'History','Personal Rule Deep Dive','17:30',35,false],
    [3,'English','Representation question','18:15',25,false],
    [4,'RS','Christianity 2B cards','16:30',20,false],
    [5,'History','Civil War timed plan','11:00',35,false]
  ];
  return seed.map(([day,subject,title,start,duration,done],i)=>({id:`seed-${i}-${isoDate(mon)}`,type:'revision',subject,title,date:isoDate(addDays(mon,day)),start,duration,done}));
}
function migrateState(raw={}){
  const base=cloneDefaults();
  const merged={...base,...raw};
  merged.today=Array.isArray(raw.today)?raw.today:base.today;
  merged.week=Array.isArray(raw.week)?raw.week:base.week;
  merged.topicScores=raw.topicScores&&typeof raw.topicScores==='object'?raw.topicScores:{};
  merged.repairCards=Array.isArray(raw.repairCards)?raw.repairCards:[];
  merged.plannerItems=Array.isArray(raw.plannerItems)?raw.plannerItems:seedPlannerItems();
  merged.updatedAt=Number(raw.updatedAt)||Date.now();
  return merged;
}
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem('revisionHQ_v2')||'{}');
    return migrateState(raw);
  }catch(e){ return migrateState({}); }
}
function writeLocalOnly(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){} }
function updateSaveLabel(){
  const el=document.getElementById('saveStateLabel'); if(!el)return;
  el.textContent=cloudConnected?(googleEmail?`Cloud sync · ${googleEmail}`:'Cloud sync connected'):'Saved locally · Google not connected';
}
function save(){
  state.updatedAt=Date.now(); writeLocalOnly(); updateSaveLabel();
  if(cloudConnected){ clearTimeout(cloudSaveTimer); cloudSaveTimer=setTimeout(pushCloudState,650); }
}
async function pushCloudState(){
  if(!cloudConnected)return;
  try{
    const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state})});
    if(!r.ok)throw new Error('cloud save failed');
    const el=document.getElementById('saveStateLabel'); if(el){el.classList.remove('sync-flash');void el.offsetWidth;el.classList.add('sync-flash');}
  }catch(e){ /* local copy remains authoritative until connectivity returns */ }
}
async function hydrateFromCloud(){
  if(!cloudConnected)return;
  try{
    const r=await fetch('/api/state',{cache:'no-store'}); if(!r.ok)return;
    const payload=await r.json(); const cloud=payload.state;
    if(cloud && Number(cloud.updatedAt||0)>Number(state.updatedAt||0)){
      state=migrateState(cloud); writeLocalOnly(); renderAll(); showToast('Progress synced from Google.');
    }else if(!cloud || Number(state.updatedAt||0)>=Number(cloud.updatedAt||0)){
      await pushCloudState();
    }
  }catch(e){}
}
function scoreFor(t){ return state.topicScores[t.id] ?? t.score; }
function allTopics(){ return SUBJECTS.flatMap(s=>s.topics.map(t=>({...t,subject:s.name,board:s.board,subjectId:s.id}))); }
function stateName(score){ return score<50?'weak':score<68?'building':'secure'; }
function stateLabel(score){ return score<50?'Weak':score<68?'Building':'Secure'; }
function showToast(msg){ const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),1800); }

function navTo(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  const titles={overview:['REVISION HQ','Command Centre'],subjects:['CURRICULUM','Subjects'],deepdive:['ACTIVE RECALL','Deep Dive'],cards:['RETRIEVAL','Cards'],planner:['REVISION PLAN','Planner'],mastery:['EVIDENCE','Mastery']};
  document.getElementById('viewKicker').textContent=titles[id][0];document.getElementById('viewTitle').textContent=titles[id][1];
  document.querySelector('.sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.view)));
document.getElementById('mobileMenu').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));

function renderOverview(){
  const topics=[...allTopics()].sort((a,b)=>scoreFor(a)-scoreFor(b));
  const avg=Math.round(topics.reduce((a,t)=>a+scoreFor(t),0)/topics.length);
  document.getElementById('streakTop').textContent=`${state.streak} days`;
  const target = new Date('2027-05-17T00:00:00');
  const days=Math.max(0,Math.ceil((target-new Date())/86400000));
  document.getElementById('daysToSeason').textContent=days;
  const metrics=[['Mastery',`${avg}%`,'across 21 mapped topics'],['Deep Dives',state.deepDives,'completed'],['Retrieval cards',state.cardsDone,'scored'],['Focused time',`${Math.floor(state.minutes/60)}h ${state.minutes%60}m`,'logged']];
  document.getElementById('metricGrid').innerHTML=metrics.map(m=>`<div class="metric"><span class="metric-label">${m[0]}</span><strong>${m[1]}</strong><small>${m[2]}</small></div>`).join('');
  document.getElementById('priorityStack').innerHTML=topics.slice(0,5).map((t,i)=>`<div class="priority-item ${scoreFor(t)<50?'urgent':''}"><div class="priority-score">${scoreFor(t)}</div><div class="priority-copy"><strong>${t.name}</strong><span>${t.subject} · ${t.unit} · ${t.last}</span></div><button class="priority-action" data-topic="${t.id}" data-subject="${t.subjectId}">DEEP DIVE →</button></div>`).join('');
  document.querySelectorAll('.priority-action').forEach(b=>b.addEventListener('click',()=>startDeep(b.dataset.subject,b.dataset.topic)));
  document.getElementById('weekChart').innerHTML=['M','T','W','T','F','S','S'].map((d,i)=>`<div class="day-bar ${i===3?'today':''}"><div class="bar" style="height:${Math.max(4,state.week[i])}px"></div><span>${d}</span></div>`).join('');
  document.getElementById('weeklyMinutes').textContent=`${state.week.reduce((a,b)=>a+b,0)} min`;
  renderToday();
}
function renderToday(){
  document.getElementById('todayTasks').innerHTML=state.today.map(t=>`<div class="today-task ${t.done?'done':''}"><button class="check" data-id="${t.id}">${t.done?'✓':''}</button><span class="task-text">${t.text}</span><span class="task-time">${t.mins}m</span></div>`).join('');
  const done=state.today.filter(t=>t.done).length;document.getElementById('todayProgress').textContent=`${done} / ${state.today.length}`;
  document.querySelectorAll('.check').forEach(b=>b.addEventListener('click',()=>{const t=state.today.find(x=>x.id===b.dataset.id);t.done=!t.done;save();renderToday();}));
}

document.getElementById('heroStart').addEventListener('click',()=>startDeep('history','his-charles'));
document.getElementById('topStart').addEventListener('click',()=>startDeep('history','his-charles'));

function renderSubjects(){
  document.getElementById('subjectGrid').innerHTML=SUBJECTS.map(s=>{
    const vals=s.topics.map(scoreFor); const avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length); const weak=vals.filter(v=>v<50).length;
    return `<article class="subject-card" data-id="${s.id}"><span class="subject-code">${s.board}</span><h3>${s.name}</h3><p>${s.subtitle}</p><div class="subject-meter"><div class="subject-meter-head"><span>Current mastery</span><strong>${avg}%</strong></div><div class="meter-track"><div class="meter-fill" style="width:${avg}%"></div></div></div><div class="subject-foot"><span>${s.topics.length} mapped topics</span><strong>${weak?`${weak} weak`:'No critical gaps'}</strong></div></article>`;
  }).join('');
  document.querySelectorAll('.subject-card').forEach(c=>c.addEventListener('click',()=>openSubject(c.dataset.id)));
}
function openSubject(id){
  const s=SUBJECTS.find(x=>x.id===id), drawer=document.getElementById('topicDrawer');
  drawer.hidden=false;drawer.innerHTML=`<div class="drawer-head"><div><p class="eyebrow">${s.board}</p><h3>${s.name} · topic map</h3></div><button class="drawer-close">×</button></div><div class="topic-list">${s.topics.map(t=>{const sc=scoreFor(t);return `<div class="topic-row"><div><strong>${t.name}</strong><span>${t.unit} · last revised ${t.last}</span></div><button class="priority-action" data-topic="${t.id}" data-subject="${s.id}"><span class="topic-state ${stateName(sc)}">${stateLabel(sc)} · ${sc}%</span></button></div>`}).join('')}</div>`;
  drawer.querySelector('.drawer-close').addEventListener('click',()=>drawer.hidden=true);
  drawer.querySelectorAll('.priority-action').forEach(b=>b.addEventListener('click',()=>startDeep(b.dataset.subject,b.dataset.topic)));
  drawer.scrollIntoView({behavior:'smooth',block:'nearest'});
}

const DEEP_CONTENT={
  'his-charles':{subject:'OCR HISTORY H505 · Y108',title:'Charles I & Personal Rule, 1629–1640',prompt:"Why did Charles I's Personal Rule create serious political and financial tension by 1640?",anchors:['Charles governed without Parliament from 1629, removing the normal route for parliamentary taxation and political grievance.','Fiscal expedients such as Ship Money, distraint of knighthood and forest fines raised revenue but widened constitutional resentment.','Laudian religious reforms alarmed many Protestants and were associated with fears of Catholicising tendencies and arbitrary government.','The attempt to impose a new prayer book on Scotland triggered rebellion and the Bishops’ Wars; military failure created an urgent financial crisis.','The Scottish crisis forced Charles to recall Parliament in 1640, ending the Personal Rule.'],question:'“Financial weakness was the main reason Charles I\'s Personal Rule collapsed.” Assess this view.'},
  'his-war':{subject:'OCR HISTORY H505 · Y108',title:'Origins & outbreak of Civil War',prompt:'Why did political crisis turn into armed conflict in 1642 rather than a negotiated settlement?',anchors:['Long-term disputes over religion, finance and the royal prerogative intensified mistrust.','The collapse of royal authority in 1640–41 opened space for Parliament to attack ministers and institutional safeguards.','The Irish Rebellion sharpened the question of who should control the army.','The Grand Remonstrance exposed deep division within Parliament as well as between Parliament and Crown.','The failed arrest of the Five Members destroyed remaining trust and accelerated preparations for war.'],question:'How far was the breakdown of trust more important than religious division in causing civil war by 1642?'},
  'rs-arguments':{subject:'AQA RELIGIOUS STUDIES 7062 · PHILOSOPHY',title:'Arguments for the existence of God',prompt:'Which assumptions do cosmological arguments make, and where are they most vulnerable?',anchors:['Cosmological arguments move from features of the universe to a necessary or first cause.','Aquinas rejects infinite regress in ordered causal series and argues towards a first cause / necessary being.','Leibniz uses the Principle of Sufficient Reason and distinguishes contingent things from a necessary explanation.','Critics question whether the universe itself needs the sort of explanation demanded of its parts.','Even if a first cause is established, further argument is needed to identify it with the God of classical theism.'],question:'“Cosmological arguments succeed only by defining God into the explanation.” Evaluate this claim.'},
  'eng-change':{subject:'AQA ENGLISH LANGUAGE 7702 · PAPER 2',title:'Language change',prompt:'What forces drive language change, and how can you avoid turning an essay into a list of examples?',anchors:['Change can be lexical, semantic, grammatical, phonological and pragmatic.','External forces include technology, contact, migration, media and social change; internal system pressures can also matter.','Attitudes to change are themselves examinable: prescriptivism, descriptivism and debates about decline / decay.','Strong answers connect examples to patterns and explanations rather than presenting isolated novelty words.','Data and texts should be evaluated in relation to audience, purpose, mode, time and social context.'],question:'“Technology is now the most important cause of language change.” Evaluate this view using relevant linguistic concepts and evidence.'}
};
function startDeep(subjectId,topicId){
  currentDeep={subject:subjectId,topic:topicId};deepStep=1;confidenceChoice=null;
  const topic=SUBJECTS.find(s=>s.id===subjectId)?.topics.find(t=>t.id===topicId);
  const content=DEEP_CONTENT[topicId]||{subject:`${SUBJECTS.find(s=>s.id===subjectId)?.board||''}`,title:topic?.name||'Focused revision',prompt:`What are the most important arguments, evidence and debates for ${topic?.name||'this topic'}?`,anchors:['Define the core concept accurately.','Retrieve the strongest specific evidence you can use.','Identify at least one counterargument or limitation.','Explain why the evidence matters, rather than listing it.','Finish with a judgement that answers the exact question.'],question:`What would a high-quality exam answer on ${topic?.name||'this topic'} need to prove?`};
  document.getElementById('deepSubject').textContent=content.subject;document.getElementById('deepTopic').textContent=content.title;document.getElementById('deepPrompt').textContent=content.prompt;document.getElementById('anchorList').innerHTML=content.anchors.map((a,i)=>`<div class="anchor"><b>${String(i+1).padStart(2,'0')}</b><p>${a}</p></div>`).join('');document.getElementById('examQuestion').textContent=content.question;
  document.getElementById('brainDump').value='';document.getElementById('gapBox').value='';document.getElementById('examPlan').value='';
  setDeepStep(1);navTo('deepdive');
}
function setDeepStep(n){deepStep=n;document.querySelectorAll('.deep-step').forEach(s=>s.classList.toggle('active',+s.dataset.step===n));document.getElementById('deepStepNum').textContent=n;}
document.getElementById('commitRecall').addEventListener('click',()=>{if(document.getElementById('brainDump').value.trim().length<20){showToast('Write a genuine recall attempt first.');return;}setDeepStep(2);});
document.getElementById('commitRepair').addEventListener('click',()=>{const gap=document.getElementById('gapBox').value.trim();if(gap.length<8){showToast('Capture at least one real gap.');return;}state.repairCards.push({subject:document.getElementById('deepSubject').textContent,q:`Repair gap: ${document.getElementById('deepTopic').textContent}`,a:gap});save();setDeepStep(3);showToast('Repair card created.');});
document.getElementById('confidenceButtons').innerHTML=[['45','Weak'],['60','Building'],['75','Secure']].map(([v,l])=>`<button data-v="${v}">${l}</button>`).join('');
document.querySelectorAll('#confidenceButtons button').forEach(b=>b.addEventListener('click',()=>{confidenceChoice=+b.dataset.v;document.querySelectorAll('#confidenceButtons button').forEach(x=>x.classList.toggle('selected',x===b));}));
document.getElementById('finishDive').addEventListener('click',()=>{if(document.getElementById('examPlan').value.trim().length<20){showToast('Add a short exam plan before finishing.');return;}const topic=allTopics().find(t=>t.id===currentDeep.topic);const old=scoreFor(topic);const next=confidenceChoice||Math.min(100,old+6);state.topicScores[currentDeep.topic]=Math.max(old,next);state.deepDives++;state.sessions++;state.minutes+=25;save();renderAll();showToast('Deep Dive complete. Mastery updated.');navTo('mastery');});

function allCards(){return [...state.repairCards.map(c=>({subject:c.subject.split(' ')[1]||'Repair',tag:'REPAIR CARD',q:c.q,a:c.a})),...CARDS];}
function renderCards(){
  const filters=['All','History','English','RS','Repair'];
  document.getElementById('cardFilters').innerHTML=filters.map(f=>`<button class="filter-tab ${state.currentCardFilter===f?'active':''}" data-f="${f}">${f}</button>`).join('');
  document.querySelectorAll('.filter-tab').forEach(b=>b.addEventListener('click',()=>{state.currentCardFilter=b.dataset.f;state.cardIndex=0;save();renderCards();}));
  const cards=filteredCards();document.getElementById('dueCount').textContent=cards.length; if(!cards.length)return;
  state.cardIndex=Math.min(state.cardIndex,cards.length-1); const c=cards[state.cardIndex];
  document.getElementById('cardSubject').textContent=c.tag;document.getElementById('cardIndex').textContent=`${state.cardIndex+1} / ${cards.length}`;document.getElementById('cardQuestion').textContent=c.q;document.getElementById('cardAnswer').textContent=c.a;document.getElementById('cardAnswer').hidden=true;document.getElementById('cardFooter').innerHTML='<button class="primary-btn" id="revealCard">Reveal answer</button>';document.getElementById('revealCard').addEventListener('click',revealCard);
}
function filteredCards(){const cards=allCards();const f=state.currentCardFilter;if(f==='All')return cards;if(f==='Repair')return cards.filter(c=>c.tag==='REPAIR CARD');return cards.filter(c=>c.subject===f);}
function revealCard(){document.getElementById('cardAnswer').hidden=false;document.getElementById('cardFooter').innerHTML='<button class="rate-btn" data-rate="0">Again</button><button class="rate-btn" data-rate="1">Hard</button><button class="rate-btn" data-rate="2">Got it</button>';document.querySelectorAll('.rate-btn').forEach(b=>b.addEventListener('click',()=>rateCard(+b.dataset.rate)));}
function rateCard(rate){state.cardsDone++;state.cardIndex=(state.cardIndex+1)%filteredCards().length;save();renderCards();showToast(rate===2?'Marked secure for now.':rate===1?'Kept in the rotation.':'Card will come back soon.');}

function weekDates(){ const start=addDays(mondayOf(new Date()),plannerWeekOffset*7); return Array.from({length:7},(_,i)=>addDays(start,i)); }
function formatWeekRange(days){
  const a=days[0],b=days[6]; const opts={day:'numeric',month:'short'};
  return `${a.toLocaleDateString(undefined,opts)} – ${b.toLocaleDateString(undefined,{...opts,year:'numeric'})}`;
}
function timeOfCalendarEvent(ev){ if(ev.allDay)return 'All day'; const d=new Date(ev.start); return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
function calendarDate(ev){ return ev.allDay?ev.start.slice(0,10):isoDate(new Date(ev.start)); }
function calendarMinutes(ev){ if(ev.allDay||!ev.end)return 0; return Math.max(0,Math.round((new Date(ev.end)-new Date(ev.start))/60000)); }
function renderLocalPlannerItem(item){
  const isTutor=item.type==='tutor';
  return `<div class="plan-task ${isTutor?'tutor':'revision'} ${item.done?'done':''}" data-id="${esc(item.id)}" data-type="${item.type}">
    ${item.start?`<div class="plan-task-time">${esc(item.start)}</div>`:''}
    <div class="plan-task-subject">${esc(isTutor?`Tutor · ${item.subject||'General'}`:item.subject)}</div>
    <div class="plan-task-title">${esc(item.title)}</div>
    <div class="plan-task-meta">${Number(item.duration)||0} min${item.location?` · ${esc(item.location)}`:''}${!isTutor?` · ${item.done?'complete':'tap to complete'}`:''}</div>
    ${isTutor?`<div class="plan-task-actions"><button class="edit-link" data-edit-tutor="${esc(item.id)}">EDIT</button></div>`:''}
  </div>`;
}
function renderCalendarItem(ev){
  const link=safeUrl(ev.htmlLink||ev.hangoutLink||'');
  return `<div class="plan-task calendar"><div class="plan-task-time">${esc(timeOfCalendarEvent(ev))}</div><div class="plan-task-subject">Google Calendar</div><div class="plan-task-title">${esc(ev.summary||'Busy')}</div><div class="plan-task-meta">${ev.location?esc(ev.location):ev.allDay?'All-day event':`${calendarMinutes(ev)} min`}</div>${link?`<div class="plan-task-actions"><a class="calendar-link" href="${esc(link)}" target="_blank" rel="noopener">OPEN EVENT ↗</a></div>`:''}</div>`;
}
function renderPlanner(){
  const days=weekDates();
  document.getElementById('weekRange').textContent=formatWeekRange(days);
  document.getElementById('plannerGrid').innerHTML=days.map((day,i)=>{
    const date=isoDate(day), today=date===isoDate(new Date());
    const local=state.plannerItems.filter(x=>x.date===date).sort((a,b)=>(a.start||'99:99').localeCompare(b.start||'99:99'));
    const google=calendarEvents.filter(x=>calendarDate(x)===date).sort((a,b)=>String(a.start).localeCompare(String(b.start)));
    const minutes=local.reduce((sum,x)=>sum+(Number(x.duration)||0),0)+google.reduce((sum,x)=>sum+calendarMinutes(x),0);
    const items=[...local.map(renderLocalPlannerItem),...google.map(renderCalendarItem)].join('');
    return `<div class="day-column"><div class="day-head ${today?'today':''}"><div><strong>${day.toLocaleDateString(undefined,{weekday:'short'})}</strong><div class="day-date"><b>${day.getDate()}</b><span>${day.toLocaleDateString(undefined,{month:'short'})}</span></div></div><span class="day-total">${minutes?`${minutes}m`:''}</span></div>${items||'<div class="empty-day">No fixed work</div>'}</div>`;
  }).join('');

  document.querySelectorAll('.plan-task.revision').forEach(el=>el.addEventListener('click',()=>{
    const item=state.plannerItems.find(x=>x.id===el.dataset.id); if(!item)return; item.done=!item.done; save(); renderPlanner();
  }));
  document.querySelectorAll('[data-edit-tutor]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openTutorModal(btn.dataset.editTutor);}));
}

function openTutorModal(id=null){
  const modal=document.getElementById('tutorModal'), item=id?state.plannerItems.find(x=>x.id===id&&x.type==='tutor'):null;
  document.getElementById('tutorModalTitle').textContent=item?'Edit tutor session':'Add tutor session';
  document.getElementById('tutorId').value=item?.id||'';
  document.getElementById('tutorName').value=item?.title||'';
  document.getElementById('tutorSubject').value=item?.subject||'History';
  document.getElementById('tutorDate').value=item?.date||isoDate(new Date());
  document.getElementById('tutorStart').value=item?.start||'17:00';
  document.getElementById('tutorDuration').value=String(item?.duration||60);
  document.getElementById('tutorLocation').value=item?.location||'';
  document.getElementById('tutorNotes').value=item?.notes||'';
  document.getElementById('tutorRepeat').value='1';
  document.getElementById('repeatField').hidden=!!item;
  document.getElementById('deleteTutor').hidden=!item;
  modal.hidden=false; setTimeout(()=>document.getElementById('tutorName').focus(),0);
}
function closeTutorModal(){ document.getElementById('tutorModal').hidden=true; }
function saveTutorFromForm(e){
  e.preventDefault();
  const id=document.getElementById('tutorId').value;
  const base={type:'tutor',title:document.getElementById('tutorName').value.trim(),subject:document.getElementById('tutorSubject').value,date:document.getElementById('tutorDate').value,start:document.getElementById('tutorStart').value,duration:Number(document.getElementById('tutorDuration').value),location:document.getElementById('tutorLocation').value.trim(),notes:document.getElementById('tutorNotes').value.trim(),done:false};
  if(!base.title||!base.date||!base.start)return;
  if(id){ const idx=state.plannerItems.findIndex(x=>x.id===id); if(idx>=0)state.plannerItems[idx]={...state.plannerItems[idx],...base,id}; }
  else{
    const repeats=Number(document.getElementById('tutorRepeat').value)||1;
    const first=new Date(`${base.date}T12:00:00`);
    for(let i=0;i<repeats;i++)state.plannerItems.push({...base,id:uid('tutor'),date:isoDate(addDays(first,i*7))});
  }
  save(); closeTutorModal(); renderPlanner(); showToast(id?'Tutor session updated.':'Tutor session added.');
}

async function checkGoogleStatus(){
  if(location.protocol==='file:'){updateGoogleUi();return;}
  try{
    const r=await fetch('/api/google/status',{cache:'no-store'}); const data=await r.json().catch(()=>({}));
    googleConfigured=!!data.configured; cloudConnected=!!data.connected; googleEmail=data.email||'';
    updateGoogleUi(); updateSaveLabel();
    if(cloudConnected){ await hydrateFromCloud(); await fetchCalendarEvents(); }
  }catch(e){ updateGoogleUi(); }
}
function updateGoogleUi(){
  const status=document.getElementById('calendarStatus'),hint=document.getElementById('calendarHint'),dot=document.getElementById('calendarDot'),action=document.getElementById('calendarAction'),disconnect=document.getElementById('calendarDisconnect');
  dot.className='calendar-dot';
  if(cloudConnected){dot.classList.add('connected');status.textContent=googleEmail?`Google connected · ${googleEmail}`:'Google connected';hint.textContent='Calendar events + Revision HQ progress sync automatically.';action.textContent='Refresh';disconnect.hidden=false;}
  else if(googleConfigured){dot.classList.add('configured');status.textContent='Google ready to connect';hint.textContent='Connect once to sync Calendar and progress across devices.';action.textContent='Connect Google';disconnect.hidden=true;}
  else{status.textContent=location.protocol==='file:'?'Google sync activates on the hosted app':'Google integration not configured yet';hint.textContent='Tutor sessions can still be added manually.';action.textContent=location.protocol==='file:'?'Hosted version':'Setup pending';disconnect.hidden=true;}
}
async function fetchCalendarEvents(){
  if(!cloudConnected){calendarEvents=[];renderPlanner();return;}
  const days=weekDates(),start=new Date(days[0]),end=addDays(days[6],1); start.setHours(0,0,0,0); end.setHours(0,0,0,0);
  try{
    const r=await fetch(`/api/google/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,{cache:'no-store'});
    if(!r.ok)throw new Error('calendar fetch'); const data=await r.json(); calendarEvents=Array.isArray(data.events)?data.events:[];
  }catch(e){calendarEvents=[];}
  renderPlanner();
}
async function disconnectGoogle(){
  try{await fetch('/api/google/disconnect',{method:'POST'});}catch(e){}
  cloudConnected=false;googleEmail='';calendarEvents=[];updateGoogleUi();updateSaveLabel();renderPlanner();showToast('Google disconnected. Local progress remains on this device.');
}

document.getElementById('addTutor').addEventListener('click',()=>openTutorModal());
document.getElementById('closeTutorModal').addEventListener('click',closeTutorModal);
document.getElementById('cancelTutor').addEventListener('click',closeTutorModal);
document.getElementById('tutorModal').addEventListener('click',e=>{if(e.target.id==='tutorModal')closeTutorModal();});
document.getElementById('tutorForm').addEventListener('submit',saveTutorFromForm);
document.getElementById('deleteTutor').addEventListener('click',()=>{const id=document.getElementById('tutorId').value;if(!id)return;state.plannerItems=state.plannerItems.filter(x=>x.id!==id);save();closeTutorModal();renderPlanner();showToast('Tutor session deleted.');});
document.getElementById('prevWeek').addEventListener('click',async()=>{plannerWeekOffset--;calendarEvents=[];renderPlanner();await fetchCalendarEvents();});
document.getElementById('nextWeek').addEventListener('click',async()=>{plannerWeekOffset++;calendarEvents=[];renderPlanner();await fetchCalendarEvents();});
document.getElementById('todayWeek').addEventListener('click',async()=>{plannerWeekOffset=0;calendarEvents=[];renderPlanner();await fetchCalendarEvents();});
document.getElementById('calendarAction').addEventListener('click',async()=>{
  if(cloudConnected){showToast('Refreshing Google Calendar…');await fetchCalendarEvents();return;}
  if(location.protocol==='file:'){showToast('Google connection will activate on the hosted web app.');return;}
  if(!googleConfigured){showToast('Google OAuth still needs its deployment credentials.');return;}
  location.href='/api/google/connect?return=%2F%3Fview%3Dplanner';
});
document.getElementById('calendarDisconnect').addEventListener('click',disconnectGoogle);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('tutorModal').hidden)closeTutorModal();});

function renderMastery(){
  const topics=allTopics();const vals=topics.map(scoreFor);const weak=vals.filter(v=>v<50).length,secure=vals.filter(v=>v>=68).length,avg=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  document.getElementById('masterySummary').innerHTML=[['Overall mastery',`${avg}%`],['Weak topics',weak],['Secure topics',secure]].map(x=>`<div class="summary-card"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
  document.getElementById('masteryRows').innerHTML=topics.sort((a,b)=>scoreFor(a)-scoreFor(b)).map(t=>{const sc=scoreFor(t);return `<div class="mastery-row"><div class="mastery-subject">${t.subject}<br><span>${t.unit}</span></div><div class="mastery-topic"><strong>${t.name}</strong><span>${stateLabel(sc)} · last revised ${t.last}</span></div><div class="mastery-score"><div class="mini-track"><div class="mini-fill" style="width:${sc}%"></div></div><span>${sc}</span></div></div>`}).join('');
}
function renderAll(){renderOverview();renderSubjects();renderCards();renderPlanner();renderMastery();}

function tickTimer(){timerSeconds--;if(timerSeconds<=0){clearInterval(timerId);timerId=null;timerSeconds=0;showToast('Session complete. Stop and score the work.');}renderTimer();}
function renderTimer(){const m=Math.floor(timerSeconds/60),s=timerSeconds%60;document.getElementById('sessionTimer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;document.getElementById('timerToggle').textContent=timerId?'Pause':'Start';}
document.getElementById('timerToggle').addEventListener('click',()=>{if(timerId){clearInterval(timerId);timerId=null}else timerId=setInterval(tickTimer,1000);renderTimer();});
document.getElementById('timerReset').addEventListener('click',()=>{clearInterval(timerId);timerId=null;timerSeconds=25*60;renderTimer();});

renderAll();renderTimer();startDeep('history','his-charles');navTo(new URLSearchParams(location.search).get('view')||'overview');updateSaveLabel();updateGoogleUi();checkGoogleStatus();

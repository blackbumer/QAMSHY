const missions = [
  { title: 'Жоғалған бөлшектер', icon: '🧩', reward: 100, archive: 'Қамшы бірнеше бөліктен тұрады: сап, алақан, өрім және бау. Әр бөліктің өз қызметі бар.' },
  { title: 'Шебердің сынағы', icon: '🛠️', reward: 120, archive: 'Дәстүрлі қамшы жасау — теріні илеу, таспа тілу, өру және сапқа бекітуді қажет ететін шеберлік.' },
  { title: 'Батырдың қамшысы', icon: '🐎', reward: 100, archive: 'Қамшы көшпелі өмірде ат басқару құралы әрі иесінің мәртебесін танытатын бұйым болған.' },
  { title: 'Дүре мен қамшы', icon: '⚖️', reward: 120, archive: 'Қамшы — күнделікті ат әбзелі мен мәдени нышан; дүре — жазалау ұғымына байланысты атау. Екеуін теңестіруге болмайды.' },
  { title: 'Қамшының тілі', icon: '💬', reward: 140, archive: 'Қамшыға қатысты тіркестер тілде жылдамдықты, қайратты, шешім мен дәстүрді бейнелейді.' },
  { title: 'Жасырын символдар', icon: '🔍', reward: 120, archive: 'Қазақ оюлары заттың көркемдігін арттырып қана қоймай, береке, қорғаныш және өмір жалғастығы идеяларын жеткізеді.' },
  { title: 'Уақыт машинасы', icon: '⌛', reward: 120, archive: 'Қамшының тұрмыстық қызметі азайғанымен, ол қолөнер, ұлттық жады және мәдени мұра ретінде сақталды.' },
  { title: 'AI шебер', icon: '✨', reward: 150, archive: 'Материал, өру үлгісі, түс пен ою біріккенде әр қамшының көркемдік сипаты қалыптасады.' },
  { title: 'Аманат', icon: '🏆', reward: 130, archive: 'Мәдени мұра оны танып, құрметтеп, келесі ұрпаққа мағынасын түсіндіру арқылы жалғасады.' }
];

const defaultState = { current: 0, completed: [], score: 0, sound: true, archives: [], achievements: [], builder: null, legacy: '' };
let state = loadState();
let missionLocal = {};
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function loadState() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem('qamshy-save') || '{}') }; }
  catch { return { ...defaultState }; }
}
function saveState() { localStorage.setItem('qamshy-save', JSON.stringify(state)); }
function escapeHtml(text='') { const d=document.createElement('div'); d.textContent=text; return d.innerHTML; }
function playTone(type='good') {
  if (!state.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = type === 'good' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(type === 'good' ? 520 : 190, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(type === 'good' ? 780 : 130, ctx.currentTime + .16);
    gain.gain.setValueAtTime(.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .24);
    osc.start(); osc.stop(ctx.currentTime + .25);
  } catch {}
}
function toast(message) { const t=$('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),2500); }
function openModal(html) { $('#modalBody').innerHTML=html; $('#modal').classList.remove('hidden'); $('.modal-close').focus(); }
function closeModal() { $('#modal').classList.add('hidden'); }

function updateChrome() {
  $('#scoreValue').textContent = state.score;
  $('#journeyFraction').textContent = `${state.completed.length} / ${missions.length}`;
  $('#progressBar').style.width = `${state.completed.length / missions.length * 100}%`;
  $('#archiveCount').textContent = `${state.archives.length} дерек ашылды`;
  $('#achievementCount').textContent = `${state.achievements.length} марапат`;
  $('#soundBtn').textContent = state.sound ? '♪' : '♩';
  $('#soundBtn').setAttribute('aria-pressed', String(state.sound));
  $('#soundBtn').title = state.sound ? 'Дыбысты өшіру' : 'Дыбысты қосу';
  $('#missionNav').innerHTML = missions.map((m,i)=>{
    const done=state.completed.includes(i), unlocked=i===0 || state.completed.includes(i-1);
    return `<button class="mission-link ${i===state.current?'active':''} ${done?'done':''}" data-mission="${i}" ${!unlocked?'disabled':''}>
      <span class="mission-number">${done?'✓':i+1}</span><span class="mission-name">${m.title}</span><span class="mission-state">${unlocked?(done?'':'•'):'🔒'}</span>
    </button>`;
  }).join('');
  $$('.mission-link').forEach(b=>b.addEventListener('click',()=>{ state.current=+b.dataset.mission; saveState(); renderMission(); $('#sidebar').classList.remove('open'); }));
}

function beginGame(continueSaved=false) {
  if (!continueSaved) { state={...defaultState}; saveState(); }
  $('#intro').classList.add('hidden'); $('#gameApp').classList.remove('hidden');
  updateChrome(); renderMission();
}

function missionHero(i, text) {
  const m=missions[i];
  return `<div class="mission-hero"><div><h2>${m.title}</h2><p>${text}</p></div><div class="mission-icon" aria-hidden="true">${m.icon}</div></div>`;
}
function panel(title, desc, body) { return `<div class="task-panel"><h3>${title}</h3><p>${desc}</p>${body}</div>`; }
function completeMission(index, achievement) {
  if (!state.completed.includes(index)) {
    state.completed.push(index); state.score += missions[index].reward; state.archives.push(index);
    if (achievement && !state.achievements.includes(achievement)) state.achievements.push(achievement);
    saveState(); updateChrome(); playTone('good'); toast(`+${missions[index].reward} мұра ұпайы · Архив ашылды!`);
  }
}
function nextButton(index, label='Келесі миссия') {
  return `<button class="next-btn" data-next="${index+1}">${label}</button>`;
}
function bindNext() { $$('[data-next]').forEach(btn=>btn.addEventListener('click',()=>{ state.current=Math.min(+btn.dataset.next, missions.length-1); saveState(); updateChrome(); renderMission(); window.scrollTo(0,0); })); }

function renderMission() {
  const i=state.current, m=missions[i]; missionLocal={};
  $('#missionKicker').textContent=`${i+1}-миссия · ${m.icon}`; $('#missionReward').textContent=`+${m.reward} мұра ұпайы`;
  const renderers=[renderParts,renderWorkshop,renderHero,renderDifference,renderLanguage,renderSymbols,renderTime,renderBuilder,renderLegacy];
  renderers[i](); updateChrome(); $('#gameStage').focus({preventScroll:true});
}

function renderParts() {
  const done=state.completed.includes(0); missionLocal.found=new Set(); missionLocal.order=[];
  $('#missionContent').innerHTML=missionHero(0,'Ескі сандықтағы қамшы бөлшектеніп қалыпты. Төрт бөлікті танып, кейін оларды дұрыс ретке келтір.')+
  panel('1-қадам: бөлшектерді тап','Әр карточканы басып, оның қызметін анықта.',`<div class="card-grid" id="partsGrid">
    ${[['▬','Сап','Қолмен ұстайтын қатты бөлік'],['🖐️','Алақан','Сап пен өрімді жалғайтын бөлік'],['🧵','Өрім','Қайыс таспалардан өрілетін негізгі бөлік'],['⌁','Бау','Қолға ілетін немесе бекітетін бау']].map((x,n)=>`<button class="item-card" data-part="${n}"><span class="emoji">${x[0]}</span><span><strong>${x[1]}</strong><small>${x[2]}</small></span><span class="find-check"></span></button>`).join('')}
  </div><div id="partsSequence"></div>`);
  if(done){ completePartsView(); return; }
  $$('[data-part]').forEach(btn=>btn.addEventListener('click',()=>{ missionLocal.found.add(+btn.dataset.part); btn.classList.add('found'); $('.find-check',btn).textContent='✓'; playTone(); if(missionLocal.found.size===4) showOrderTask(); }));
}
function showOrderTask(){ $('#partsSequence').innerHTML=`<div class="feedback">Жарайсың! Негізгі бөліктерді біріктіріп, соңында қолға ілетін бауды сапқа бекіт.</div><div class="sequence" id="orderZone"><span class="sequence-empty">Бөлшектерді ретімен таңда</span></div><div class="choice-list" id="orderChoices">${['Өрім','Бау','Сап','Алақан'].map(x=>`<button class="choice-btn" data-order="${x}">${x}</button>`).join('')}</div>`; bindOrder(); }
function bindOrder(){ $$('[data-order]').forEach(b=>b.addEventListener('click',()=>{ missionLocal.order.push(b.dataset.order); b.disabled=true; $('#orderZone').innerHTML=missionLocal.order.map((x,i)=>`<span class="sequence-pill"><b>${i+1}</b>${x}</span>`).join(''); if(missionLocal.order.length===4){ if(missionLocal.order.join('|')==='Сап|Алақан|Өрім|Бау'){ completeMission(0,'Дала зерттеушісі'); $('#partsSequence').insertAdjacentHTML('beforeend',`<div class="feedback"><strong>Дұрыс!</strong> Қамшының негізгі құрылысын таныдың, бауды сапқа бекіттің.</div><div class="actions-row"><span class="hint">🏅 «Дала зерттеушісі» жетістігі</span>${nextButton(0)}</div>`); bindNext(); } else { playTone('bad'); toast('Реті сәйкес келмеді. Қайта байқап көр!'); missionLocal.order=[]; $$('[data-order]').forEach(x=>x.disabled=false); $('#orderZone').innerHTML='<span class="sequence-empty">Саптан баста</span>'; } } })); }
function completePartsView(){ $('#partsSequence').innerHTML=`<div class="feedback"><strong>Миссия орындалды.</strong> Сап → Алақан → Өрім; соңында бау (бүлдіргі) сапқа тағылады.</div><div class="actions-row"><span class="hint">Архивтегі дерек ашық</span>${nextButton(0)}</div>`; bindNext(); }

function renderWorkshop(){ const done=state.completed.includes(1); missionLocal.step=0; const steps=['Теріні таңдау','Қайыс дайындау','Таспа тілу','Өрім өру','Сап таңдау','Құрастыру'];
  $('#missionContent').innerHTML=missionHero(1,'Шеберханада ұқыптылық пен реттілік сыналады. Материалды дұрыс таңдап, қамшы жасау кезеңдерінен өт.')+panel('Шеберлік жолы','Алдымен дәстүрлі негізгі материалды таңда.',`<div class="choice-list" id="materialChoices">${['Мал терісінен иленген қайыс','Пластик таспа','Қағаз жолақ'].map((x,i)=>`<button class="choice-btn" data-material="${i}">${x}</button>`).join('')}</div><div id="workshopArea"></div>`);
  if(done){ $('#materialChoices').remove(); $('#workshopArea').innerHTML=`<div class="workshop-steps">${steps.map((s,i)=>`<div class="workshop-step done"><span>${i+1}</span><strong>${s}</strong></div>`).join('')}</div><div class="feedback">✅ Шеберлік деңгейі артты!</div><div class="actions-row"><span class="hint">Барлық кезең дұрыс орындалды</span>${nextButton(1)}</div>`; bindNext(); return; }
  $$('[data-material]').forEach(b=>b.addEventListener('click',()=>{ if(+b.dataset.material!==0){ b.classList.add('wrong'); playTone('bad'); $('#workshopArea').innerHTML='<div class="feedback error">❌ Бұл материал дәстүрлі қамшы жасауға сәйкес келмейді.</div>'; return; } $$('#materialChoices .choice-btn').forEach(x=>x.disabled=true); b.classList.add('correct'); $('#workshopArea').innerHTML=`<div class="feedback">Дұрыс! Қайыс — иленіп, өңделген тері.</div><p class="hint">Кезеңдерді ретімен бас:</p><div class="workshop-steps">${steps.map((s,i)=>`<button class="workshop-step" data-step="${i}"><span>${i+1}</span><strong>${s}</strong></button>`).join('')}</div><div id="stepFeedback"></div>`; bindWorkshopSteps(steps); })); }
function bindWorkshopSteps(steps){ $$('[data-step]').forEach(b=>b.addEventListener('click',()=>{ const n=+b.dataset.step; if(n!==missionLocal.step){ playTone('bad'); $('#stepFeedback').innerHTML='<div class="feedback error">Әлі ерте. Кезең нөміріне назар аудар.</div>'; return;} b.classList.add('done'); b.disabled=true; missionLocal.step++; playTone(); if(missionLocal.step===steps.length){ completeMission(1,'Қамшы шебері'); $('#stepFeedback').innerHTML=`<div class="feedback">✅ <strong>Шеберлік деңгейі артты!</strong> Сен жасау ретін меңгердің.</div><div class="actions-row"><span class="hint">🏅 «Қамшы шебері» жетістігі</span>${nextButton(1)}</div>`; bindNext(); } })); }

const heroQuestions=[
  {q:'Салт атты адам үшін қамшының негізгі тұрмыстық қызметі қандай?',a:['Атты бағыттауға көмектесу','Кітап белгісі болу','Музыкалық аспап болу'],c:0,e:'Дұрыс. Қамшы атқа міну мәдениетінде басқаруға көмектесетін құрал болған. Оны жануарға орынсыз күш көрсету деп түсінбеу керек.'},
  {q:'Сәнді сап пен ұқыпты өрім нені білдіруі мүмкін?',a:['Иесінің талғамы мен мәртебесін','Тек қамшының салмағын','Жыл мезгілін'],c:0,e:'Дұрыс. Қолөнер сапасы иесінің әлеуметтік беделі мен талғамын таныта алған.'},
  {q:'Қамшыны тек қару деп қарастыру дұрыс па?',a:['Жоқ, оның тұрмыстық және рәміздік қызметтері де бар','Иә, басқа қызметі болмаған','Тек мерекеде қолданылған'],c:0,e:'Дұрыс. Қамшының мәні бір ғана қызметпен шектелмейді.'}
];
function renderHero(){ const done=state.completed.includes(2); missionLocal.q=0; $('#missionContent').innerHTML=missionHero(2,'Сен дала жолаушысының рөліндесің. Қамшының ат мәдениетіндегі үш қырын ажырат.')+`<div class="culture-cards"><div class="culture-card"><span>🐎</span><h4>Құрал</h4><p>Салт аттылықта атты бағыттауға көмектескен.</p></div><div class="culture-card"><span>🛡️</span><h4>Қорғаныс</h4><p>Қажет кезде өзін қорғауға жараған.</p></div><div class="culture-card"><span>◆</span><h4>Мәртебе</h4><p>Шебер жасалған бұйым иесінің беделін танытқан.</p></div></div><div id="quizPanel"></div>`; if(done) showCompletedQuiz(2); else showQuestion(heroQuestions,2); }

const diffQuestions=[
  {q:'Жолаушы атын бағыттап келеді. Бұл жерде не қолданылды?',a:['Қамшы — ат басқару құралы','Дүре — жаза түрі','Екеуі де бір ұғым'],c:0,e:'Қамшы бұл жағдайда ат әбзеліне қатысты құрал. Дүре — жазалау мағынасындағы бөлек ұғым.'},
  {q:'Тарихи мәтінде адамға жаза қолдану баяндалды. Дұрыс атауды тап.',a:['Қамшының сәндік қызметі','Дүре ұғымы','Ат басқару'],c:1,e:'Дұрыс. Дүре жазалау тәжірибесіне қатысты айтылады; оны қамшының барлық мәдени қызметімен теңестіруге болмайды.'},
  {q:'Мұражайда өрнекті қамшы көрсетілді. Оның қызметі қалай түсіндіріледі?',a:['Мәдени мұра және қолөнер туындысы','Тек жаза құралы','Қазіргі техника бөлшегі'],c:0,e:'Дұрыс. Мұндай бұйым тарих, шеберлік және рәміздік мән арқылы таныстырылады.'}
];
function renderDifference(){ const done=state.completed.includes(3); missionLocal.q=0; $('#missionContent').innerHTML=missionHero(3,'Тарихи ұғымдарды шатастырма: контекстке қарап, қамшы мен дүренің айырмасын анықта.')+`<div id="quizPanel"></div>`; if(done) showCompletedQuiz(3); else showQuestion(diffQuestions,3); }
function showQuestion(list,mission){ const q=list[missionLocal.q]; $('#quizPanel').innerHTML=panel(`Сұрақ ${missionLocal.q+1} / ${list.length}`,'Жауаптан кейін түсіндірмені оқы.',`<div class="question-title">${q.q}</div><div class="choice-list">${q.a.map((x,i)=>`<button class="choice-btn" data-answer="${i}">${x}</button>`).join('')}</div><div id="quizFeedback"></div>`); $$('[data-answer]').forEach(b=>b.addEventListener('click',()=>{ if(+b.dataset.answer===q.c){ b.classList.add('correct'); $$('#quizPanel [data-answer]').forEach(x=>x.disabled=true); $('#quizFeedback').innerHTML=`<div class="feedback">✅ ${q.e}</div><div class="actions-row"><span></span><button class="next-btn" id="nextQuestion">${missionLocal.q===list.length-1?'Миссияны аяқтау':'Келесі сұрақ'}</button></div>`; playTone(); $('#nextQuestion').onclick=()=>{ missionLocal.q++; if(missionLocal.q===list.length){ completeMission(mission, mission===3?'Тарих білгірі':null); showCompletedQuiz(mission); } else showQuestion(list,mission); }; } else { b.classList.add('wrong'); $('#quizFeedback').innerHTML='<div class="feedback error">Бұл жауап контекстке сәйкес емес. Тағы ойлан.</div>'; playTone('bad'); } })); }
function showCompletedQuiz(mission){ const labels={2:'Сен қамшының құрал, қорғаныс және мәртебе нышаны болғанын ажыраттың.',3:'Сен қамшы мен дүренің айырмасын түсіндің.'}; $('#quizPanel').innerHTML=panel('Миссия орындалды','Білімің архивке қосылды.',`<div class="feedback">${labels[mission]}</div><div class="actions-row"><span class="hint">${mission===3?'🏅 «Тарих білгірі» жетістігі':''}</span>${nextButton(mission)}</div>`); bindNext(); }

const phrases=[
  {words:['Қамшы','салдырмады'], scrambled:['салдырмады','Қамшы'], note:'«Қамшы салдырмады» — өте жылдам қимылдады, өзгеге мүмкіндік бермеді деген мәнде.'},
  {words:['Қамшының','сабындай','қысқа'], scrambled:['қысқа','Қамшының','сабындай'], note:'Бұл теңеу уақыттың немесе ғұмырдың қысқалығын бейнелі жеткізеді.'},
  {words:['Қамшы','тастау'], scrambled:['тастау','Қамшы'], note:'«Қамшы тастау» дәстүрлі ортада өтініш, талап не ерекше ниет білдіретін ишара ретінде кездескен.'}
];
function renderLanguage(){ const done=state.completed.includes(4); missionLocal.p=0; missionLocal.answer=[]; $('#missionContent').innerHTML=missionHero(4,'Сөздердің орнын тауып, қамшыға қатысты тіркестерді қалпына келтір. Әр дұрыс жауап «Ұлттық сөз қорын» байытады.')+`<div id="phrasePanel"></div>`; if(done) showLanguageDone(); else showPhrase(); }
function showPhrase(){ const p=phrases[missionLocal.p]; missionLocal.answer=[]; $('#phrasePanel').innerHTML=panel(`Ұлттық сөз қоры · ${missionLocal.p+1}/${phrases.length}`,'Сөздерді дұрыс ретпен бас.',`<div class="answer-bank" id="answerBank"><span class="sequence-empty">Тіркес осында жиналады</span></div><div class="word-bank">${p.scrambled.map((w,i)=>`<button class="word-chip" data-word="${i}" data-value="${w}">${w}</button>`).join('')}</div><div id="phraseFeedback"></div>`); $$('[data-word]').forEach(b=>b.addEventListener('click',()=>{ missionLocal.answer.push(b.dataset.value); b.disabled=true; $('#answerBank').innerHTML=missionLocal.answer.map(w=>`<span class="sequence-pill">${w}</span>`).join(''); if(missionLocal.answer.length===p.words.length){ if(missionLocal.answer.join('|')===p.words.join('|')){ playTone(); $('#phraseFeedback').innerHTML=`<div class="feedback">📖 ${p.note}</div><div class="actions-row"><span></span><button class="next-btn" id="phraseNext">${missionLocal.p===phrases.length-1?'Сөз қорын ашу':'Келесі тіркес'}</button></div>`; $('#phraseNext').onclick=()=>{ missionLocal.p++; if(missionLocal.p===phrases.length){ completeMission(4); showLanguageDone(); } else showPhrase(); }; } else { playTone('bad'); $('#phraseFeedback').innerHTML='<div class="feedback error">Сөз реті ауысып кетті. Қайта байқап көр.</div>'; setTimeout(showPhrase,900); } } })); }
function showLanguageDone(){ $('#phrasePanel').innerHTML=panel('Ұлттық сөз қоры ашылды','Үш тіркесті сәтті қалпына келтірдің.',`<div class="feedback">💬 Тіл — мәдени жадының ең ұзақ сақталатын жолдарының бірі.</div><div class="actions-row"><span class="hint">3 жаңа тіркес</span>${nextButton(4)}</div>`); bindNext(); }

const symbols=[['Қошқармүйіз','Молшылық пен береке идеясымен байланыстырылатын кең тараған ою.'],['Тұмарша','Қорғау, сақтану идеясын білдіретін үшбұрыш пішінді өрнек.'],['Ирек','Су, қозғалыс және өмір ағынын елестететін өрнек.']];
function renderSymbols(){ const done=state.completed.includes(5); missionLocal.symbols=new Set(); $('#missionContent').innerHTML=missionHero(5,'Үлкейткішің дайын. Өрнек арасындағы үш жасырын белгіні тауып, олардың мәдени мағынасын аш.')+panel('Өрнекті зертте','Жарқырап тұрған нүктелерді тап. Пернетақтамен де таңдауға болады.',`<div class="symbol-field">${[[18,22],[72,18],[48,66]].map((p,i)=>`<button class="symbol-hotspot" style="left:${p[0]}%;top:${p[1]}%" data-symbol="${i}" aria-label="Жасырын белгіні зерттеу">${i+1}</button>`).join('')}</div><div id="symbolInfo"></div>`); if(done){ $$('[data-symbol]').forEach(b=>b.classList.add('found')); $('#symbolInfo').innerHTML=`<div class="feedback">Үш белгі табылды: қошқармүйіз, тұмарша және ирек.</div><div class="actions-row"><span class="hint">🔍 Зерттеу аяқталды</span>${nextButton(5)}</div>`; bindNext(); return; } $$('[data-symbol]').forEach(b=>b.addEventListener('click',()=>{ const n=+b.dataset.symbol; if(missionLocal.symbols.has(n))return; missionLocal.symbols.add(n); b.classList.add('found'); playTone(); $('#symbolInfo').innerHTML=`<div class="feedback"><strong>${symbols[n][0]}:</strong> ${symbols[n][1]}</div>${missionLocal.symbols.size===3?`<div class="actions-row"><span class="hint">Барлық символ ашылды</span>${nextButton(5)}</div>`:''}`; if(missionLocal.symbols.size===3){ completeMission(5); bindNext(); } })); }

const timeQs=[
  {q:'Қамшының күнделікті тұрмыста сирек қолданылуының басты себебі не?',a:['Өмір салты мен көлік түрлерінің өзгеруі','Өрнектердің жоғалуы','Түстердің азаюы'],c:0,e:'Дұрыс. Қоғам мен қозғалыс құралдары өзгерген сайын қамшының күнделікті қызметі де азайды.'},
  {q:'Бүгін қамшының мәдени мәні қалай жалғасады?',a:['Қолөнер, музей, мереке және ұлттық жады арқылы','Тек спорт арқылы','Ешқандай түрде жалғаспайды'],c:0,e:'Дұрыс. Қызметі өзгерсе де, қамшы мұра мен шеберлік нышаны ретінде сақталады.'}
];
function renderTime(){ const done=state.completed.includes(6); missionLocal.q=0; $('#missionContent').innerHTML=missionHero(6,'Бір бұйым, екі дәуір. Не өзгерді және неге өзгерді? Қамшының тарихи трансформациясын зертте.')+`<div class="timeline"><div class="era past"><h4>БҰРЫН</h4>${['🐎 Ат мәдениеті','🛡️ Қорғаныс','◆ Мәртебе','⚖️ Әлеуметтік қызмет'].map(x=>`<div class="era-item">${x}</div>`).join('')}</div><div class="timeline-bridge">⇢</div><div class="era now"><h4>ҚАЗІР</h4>${['🇰🇿 Ұлттық нышан','🎨 Қолөнер','🏛️ Мәдени мұра','🎉 Мерекелік сый'].map(x=>`<div class="era-item">${x}</div>`).join('')}</div></div><div id="quizPanel" style="margin-top:18px"></div>`; if(done) showCompletedTime(); else showQuestionTime(); }
function showQuestionTime(){ const q=timeQs[missionLocal.q]; $('#quizPanel').innerHTML=panel(`Не өзгерді? · ${missionLocal.q+1}/2`,'Себеп пен салдарды байланыстыр.',`<div class="question-title">${q.q}</div><div class="choice-list">${q.a.map((x,i)=>`<button class="choice-btn" data-time-answer="${i}">${x}</button>`).join('')}</div><div id="timeFeedback"></div>`); $$('[data-time-answer]').forEach(b=>b.addEventListener('click',()=>{ if(+b.dataset.timeAnswer!==q.c){ b.classList.add('wrong'); playTone('bad'); $('#timeFeedback').innerHTML='<div class="feedback error">Тағы ойланып көр: қоғамдағы өзгеріске назар аудар.</div>'; return;} $$('#quizPanel .choice-btn').forEach(x=>x.disabled=true); b.classList.add('correct'); $('#timeFeedback').innerHTML=`<div class="feedback">${q.e}</div><div class="actions-row"><span></span><button class="next-btn" id="timeNext">${missionLocal.q===1?'Қорытындылау':'Келесі сұрақ'}</button></div>`; $('#timeNext').onclick=()=>{ missionLocal.q++; if(missionLocal.q===2){ completeMission(6); showCompletedTime(); } else showQuestionTime(); }; })); }
function showCompletedTime(){ $('#quizPanel').innerHTML=panel('Трансформацияны түсіндің','Қызмет өзгеруі — мағына жоғалды деген сөз емес.',`<div class="feedback">Қамшы күнделікті құралдан мәдени мұра нышанына айналды.</div><div class="actions-row"><span></span>${nextButton(6)}</div>`); bindNext(); }

function renderBuilder(){ const done=state.completed.includes(7); const b=state.builder||{material:'Ағаш',braid:'8',ornament:'Қошқармүйіз',color:'Қоңыр',decor:'Жез сақина'}; $('#missionContent').innerHTML=missionHero(7,'Өз цифрлық қамшыңды құрастыр. AI шебер таңдауыңды талдап, мәдени байланысын түсіндіреді.')+panel('Жеке қамшыңды жаса','Элементтерді таңда — көрініс бірден өзгереді.',`<div class="builder"><div class="builder-controls">
    ${builderSelect('material','Сап материалы',['Ағаш','Сүйек нақышы','Металл өрнекті'],b.material)}
    ${builderSelect('braid','Өрім түрі',['4','8','12'],b.braid)}
    ${builderSelect('ornament','Өрнек',['Қошқармүйіз','Тұмарша','Ирек'],b.ornament)}
    ${builderSelect('color','Негізгі түс',['Қоңыр','Қара','Көк'],b.color)}
    ${builderSelect('decor','Сәндік элемент',['Жез сақина','Шашақ','Күміс түйме'],b.decor)}
    <button class="primary-btn" id="analyzeBtn">AI шеберге талдату</button>
  </div><div><div class="qamshy-preview"><div class="digital-qamshy"><div class="whip-handle"></div><div class="whip-braid braid-${b.braid}"></div><div class="whip-tassel">≋</div></div></div><div id="aiReading">${done?builderReading(b):''}</div></div></div>${done?`<div class="actions-row"><span class="hint">Цифрлық бұйым сақталды</span>${nextButton(7)}</div>`:''}`);
  $$('[data-builder]').forEach(s=>s.addEventListener('change',updateWhipPreview)); $('#analyzeBtn').onclick=analyzeWhip; bindNext(); }
function builderSelect(id,label,opts,value){ return `<div class="field"><label for="${id}">${label}</label><select id="${id}" data-builder>${opts.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}</select></div>`; }
function currentBuilder(){ return {material:$('#material').value,braid:$('#braid').value,ornament:$('#ornament').value,color:$('#color').value,decor:$('#decor').value}; }
function updateWhipPreview(){ const b=currentBuilder(), braid=$('.whip-braid'); braid.className=`whip-braid braid-${b.braid}`; const colors={Қоңыр:'#8f3e27',Қара:'#171a1d',Көк:'#236b85'}; braid.style.borderColor=colors[b.color]; $('.whip-handle').style.filter=b.material==='Сүйек нақышы'?'brightness(1.7) saturate(.4)':b.material==='Металл өрнекті'?'grayscale(.7) brightness(1.3)':'none'; }
function builderReading(b){ const meanings={Қошқармүйіз:'береке мен молшылық',Тұмарша:'сақтану мен қорғаныш',Ирек:'қозғалыс пен өмір ағыны'}; return `<div class="ai-reading"><strong>AI шебердің талдауы:</strong> ${b.material} сап — бұйымның беріктігі мен сәнін айқындайды. ${b.braid} таспалы өрім шеберліктің күрделілігін көрсетеді. «${b.ornament}» өрнегі ${meanings[b.ornament]} идеясымен байланысты. ${b.color.toLowerCase()} түс пен ${b.decor.toLowerCase()} қамшыңа дара сипат берді.</div>`; }
function analyzeWhip(){ const b=currentBuilder(); state.builder=b; saveState(); $('#aiReading').innerHTML=builderReading(b); if(!state.completed.includes(7)){ completeMission(7,'Қамшы шебері'); $('#missionContent .task-panel').insertAdjacentHTML('beforeend',`<div class="actions-row"><span class="hint">✨ Жеке цифрлық қамшы дайын</span>${nextButton(7)}</div>`); bindNext(); } playTone(); }

function renderLegacy(){ const done=state.completed.includes(8); $('#missionContent').innerHTML=missionHero(8,'Саяхат соңындағы ең маңызды шешім өзіңде. Мұраны келесі ұрпаққа қалай жеткізер едің?')+`<div class="task-panel final-panel" id="legacyPanel">${done?certificateView():`<div class="final-emblem">✦</div><h3>Сен нені аманат етер едің?</h3><p>«Егер сен қамшының тарихын келесі ұрпаққа жеткізсең, оның қандай мағынасын сақтап қалар едің?»</p><textarea id="legacyText" maxlength="420" placeholder="Мен келесі ұрпаққа..."></textarea><div class="actions-row"><span class="hint">Кемінде 20 таңба</span><button class="next-btn" id="finishBtn">Аманатты тапсыру</button></div>`}</div>`; if(!done) $('#finishBtn').onclick=finishLegacy; }
function finishLegacy(){ const text=$('#legacyText').value.trim(); if(text.length<20){ playTone('bad'); toast('Ойыңды тағы бір сөйлеммен толықтыр.'); return;} state.legacy=text; completeMission(8,'Ұлттық мұра сақшысы'); $('#legacyPanel').innerHTML=certificateView(); }
function certificateView(){ const secretDone=state.achievements.includes('Құпияны ашушы'); return `<div class="certificate"><div class="final-emblem">🏆</div><p>Виртуалды мәртебе</p><h3>ҰЛЫ ДАЛА МҰРАСЫН ҚОРҒАУШЫ</h3><div class="certificate-name">QAMSHY зерттеушісі</div><p>«${escapeHtml(state.legacy || 'Мәдени мұраны танып, құрметпен сақтаймын.')}»</p><div class="achievement-strip">${state.achievements.map(x=>`<span class="achievement">✦ ${x}</span>`).join('')}</div><p class="hint">Жиналған ұпай: ${state.score}${secretDone?' / 1300':' / 1100'}</p><div class="intro-actions" style="justify-content:center"><button class="primary-btn" id="secretBtn">${secretDone?'Құпия деңгей аяқталды':'Құпия деңгейді ашу'}</button><button class="choice-btn" id="restartBtn">Ойынды қайта бастау</button></div></div>`; }

function archiveView(){ openModal(`<h2 id="modalTitle">Құпия архив</h2><p>Әр миссиядан кейін ашылатын тарихи-мәдени деректер.</p><div class="archive-list">${missions.map((m,i)=>state.archives.includes(i)?`<div class="archive-entry"><strong>${i+1}. ${m.title}</strong>${m.archive}</div>`:`<div class="archive-entry locked-entry"><strong>🔒 ${i+1}-дерек</strong>Миссияны аяқтағанда ашылады.</div>`).join('')}</div><p class="hint" style="margin-top:20px">Материалды дайындауда пайдаланылған ашық деректер: <a href="https://e-history.kz/kz/seo-materials/show/29090" target="_blank" rel="noopener">Қазақстан тарихы порталы</a> және <a href="https://el.kz/content-3421_2675/" target="_blank" rel="noopener">El.kz материалы</a>.</p>`); }
function achievementsView(){ openModal(`<h2 id="modalTitle">Жетістіктер</h2><div class="achievement-strip">${state.achievements.length?state.achievements.map(x=>`<span class="achievement">🏅 ${x}</span>`).join(''):'<p>Алғашқы миссияны аяқтағанда жетістік ашылады.</p>'}</div>`); }

function openSecretLevel(){
  if(state.achievements.includes('Құпияны ашушы')){ toast('Құпия деңгей бұрын аяқталған!'); return; }
  openModal(`<h2 id="modalTitle">🔐 Құпия деңгей</h2><p>Тоғыз таңба жанды. Соңғы мәдени кодты шеш:</p><div class="question-title">Қамшының бүгінгі ең маңызды құндылығы қайсы?</div><div class="choice-list"><button class="choice-btn" data-secret="0">Тек ескі тұрмыстық құрал</button><button class="choice-btn" data-secret="1">Ұлттық жады мен қолөнер мұрасы</button><button class="choice-btn" data-secret="2">Тек спорт жабдығы</button></div><div id="secretFeedback"></div>`);
  $$('[data-secret]').forEach(b=>b.addEventListener('click',()=>{ if(+b.dataset.secret!==1){ b.classList.add('wrong'); $('#secretFeedback').innerHTML='<div class="feedback error">Қамшының бүгінгі мәдени қызметтерін есіңе түсір.</div>'; playTone('bad'); return;} b.classList.add('correct'); state.score+=200; state.achievements.push('Құпияны ашушы'); saveState(); updateChrome(); playTone(); $('#legacyPanel').innerHTML=certificateView(); $('#secretFeedback').innerHTML='<div class="feedback"><strong>Мәдени код ашылды!</strong> +200 мұра ұпайы. Сен бұйымның заттық қана емес, рухани мағынасын да түсіндің.</div>'; }));
}

function registerProgressTool(){
  const context = typeof document === 'undefined' ? undefined : document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  try {
    void Promise.resolve(context.registerTool({
      name:'read_qamshy_progress', title:'QAMSHY прогресін оқу',
      description:'Оқушының аяқталған миссияларын, мұра ұпайын және жетістіктерін оқиды.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:true,untrustedContentHint:false},
      execute:async()=>({completedMissions:state.completed.length,totalMissions:missions.length,heritageScore:state.score,achievements:[...state.achievements]})
    },{signal:lifecycle.signal})).catch(()=>{});
  } catch {}
}

$('#startBtn').addEventListener('click',()=>beginGame(false));
$('#continueBtn').addEventListener('click',()=>beginGame(true));
$('#homeBtn').addEventListener('click',()=>{ $('#gameApp').classList.add('hidden'); $('#intro').classList.remove('hidden'); });
$('#soundBtn').addEventListener('click',()=>{ state.sound=!state.sound; saveState(); updateChrome(); if(state.sound) playTone(); });
$('#menuBtn').addEventListener('click',()=>{ const open=$('#sidebar').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded',String(open)); });
$('#archiveBtn').addEventListener('click',archiveView);
$('#achievementsBtn').addEventListener('click',achievementsView);
$('#modal').addEventListener('click',e=>{ if(e.target.matches('[data-close-modal]')) closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
document.addEventListener('click',e=>{ if(e.target.id==='restartBtn'){ state={...defaultState}; saveState(); closeModal(); beginGame(false); } if(e.target.id==='secretBtn') openSecretLevel(); });

if(state.completed.length){ $('#continueBtn').classList.remove('hidden'); $('#continueBtn').textContent=`Жалғастыру · ${state.completed.length}/9`; }
registerProgressTool();
if(new URLSearchParams(location.search).has('play')) beginGame(true);

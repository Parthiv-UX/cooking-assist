/* Cooking Assist — interactive prototype
 * Real: YouTube playback + step-segment seeking, browser speech recognition (Chrome),
 *       spoken feedback, timers, layouts, state. Pre-authored: the recipe data & answers.
 * Simulated (labelled in facilitator panel): YouTube page, share sheet, "preparing" analysis.
 */
(function(){
"use strict";
const R = window.RECIPE;
const $ = (s, el=document) => el.querySelector(s);
const app = $('#app');

/* ---------------- Icons: Material Symbols Outlined (design system) ---------------- */
const MS = { close:'e14c', list:'e242', back:'e5c4', fwd:'e5c8', arrowR:'e5c8', chev:'e409', replay:'e042', mic:'e029', micoff:'e02b',
  check:'e5ca', ccheck:'e86c', radio:'e836', radioon:'e837', play:'e037', pause:'e034', timer:'e425', volume:'e050', book:'ea19',
  bulb:'e0f0', hear:'f104', voice:'e1b8', off:'e04c', rotate:'e1c1', lock:'e88d', share:'e80d', like:'e817', save:'e866',
  dots:'e5d3', home:'e88a', plus:'e147', skillet:'f543', add:'e145' };
const FILLED = { ccheck:1, play:1 };
function ic(name, size=24, color){
  const st = `font-size:${size}px` + (color && color!=='currentColor' ? `;color:${color}` : '');
  return `<span class="ms${FILLED[name]?' fill':''}" style="${st}" aria-hidden="true">&#x${MS[name]||'e145'};</span>`;
}
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = s => { s=Math.max(0,Math.floor(s||0)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
const thumbURL = `https://i.ytimg.com/vi/${R.id}/hqdefault.jpg`;

/* ---------------- Marks (step timestamps) ---------------- */
function loadMarks(){
  let m = null;
  const q = new URLSearchParams(location.search).get('marks');
  if (q) { m = q.split(',').map(Number); try{localStorage.setItem('ca_marks', JSON.stringify(m));}catch(e){} }
  else { try{ m = JSON.parse(localStorage.getItem('ca_marks')||'null'); }catch(e){} }
  if (Array.isArray(m) && m.length === R.steps.length+1 && m.every(n=>isFinite(n))) {
    R.steps.forEach((s,i)=>{ s.t = [m[i], m[i+1]]; });
    R.marksSource = 'marked on this device';
  } else R.marksSource = 'placeholder';
}
loadMarks();

/* ---------------- Session log (for usability testing) ---------------- */
const LOG = { events: [], t0: Date.now() };
function log(type, detail='', via=''){
  LOG.events.push({ t: Date.now(), type, detail, via, step: S.step+1 });
  if (LOG.events.length > 2000) LOG.events.shift();
}

/* ---------------- State ---------------- */
const S = {
  step: 0, maxStep: 0, handsFree: false, voice: 'off', voiceText: '', voiceSub: '',
  overlay: null, overviewOpen: false, jumpTarget: null, watching: false,
  timers: {},           // stepIndex -> {total, remaining, running, endAt, done}
  startedAt: 0, hintShown: false, videoOk: true, playerReady: false,
  segEnd: null, segLabel: null, playing: false, landscape: false, wantPlay: false,
  mute: (()=>{ try{ return localStorage.getItem('ca_mute')==='1'; }catch(e){ return false; } })()
};

/* ================================================================
   SCREEN 1 — mock YouTube watch page (conceptual, not brand-accurate)
   ================================================================ */
function showSource(){
  stopEverything();
  app.innerHTML = `
  <div class="screen yt">
    <div class="yt-scroll">
      <div class="yt-player" style="background-image:url('${thumbURL}')">
        <div class="bigplay">${ic('play',30)}</div>
      </div>
      <div class="yt-progress"></div>
      <div class="yt-body">
        <div class="yt-title">${esc(R.fullTitle)}</div>
        <div class="yt-sub">YouTube · …more</div>
        <div class="yt-channel"><div class="avatar">${R.initials}</div><b>${esc(R.creator)}</b><button class="yt-subscribe">Subscribe</button></div>
        <div class="yt-actions">
          <div class="pill">${ic('like',18)}Like</div>
          <button class="pill hl" data-act="share">${ic('share',18)}Share</button>
          <div class="pill">${ic('save',18)}Save</div>
          <div class="pill" style="padding:0 12px">${ic('dots',18)}</div>
        </div>
        <div class="yt-comments"><b>Comments</b>Tap Share to send this recipe to Cooking Assist.</div>
        <div class="yt-rel"><div class="t"></div><div class="l"><i style="width:90%"></i><i style="width:60%"></i></div></div>
        <div class="yt-rel"><div class="t"></div><div class="l"><i style="width:80%"></i><i style="width:50%"></i></div></div>
      </div>
    </div>
    <div class="yt-nav">
      <div>${ic('home',24)}Home</div><div>${ic('play',24)}Shorts</div><div>${ic('plus',32)}</div><div>${ic('save',24)}Subscriptions</div><div><span class="avatar" style="width:24px;height:24px;font-size:9px">You</span>You</div>
    </div>
    <div id="sheetHost"></div>
  </div>`;
  $('[data-act=share]').onclick = () => { log('share_tap','', 'touch'); openShare(); };
}

function openShare(){
  const apps = [['Messages','#3f6fd8','M'],['Gmail','#d44638','G'],['WhatsApp','#2e9e5b','W'],['CA','',''],['Nearby','#5b6bd6','N'],['Files','#e2a21b','F'],['Drive','#6d7470','D'],['More','#bdb8af','…']];
  const people = [['Maya','#e8dccb','M'],['Arjun','#dde6f0','A'],['Family chat','#f0dde2','FC'],['Sana','#dcebdd','S']];
  $('#sheetHost').innerHTML = `<div class="scrim" data-act="close"></div>
  <div class="sheet" style="padding-top:30px">
    <div class="grab"></div>
    <div class="share-top"><div class="th" style="background-image:url('${thumbURL}')"></div><div><b>${esc(R.fullTitle)}</b><small>youtu.be/${R.id}</small></div></div>
    <div class="share-row">${people.map(p=>`<div class="target dim"><div class="ic round" style="background:${p[1]}">${p[2]}</div>${p[0]}</div>`).join('')}</div>
    <div class="share-row">${apps.slice(0,4).map(a=>a[0]==='CA'
      ? `<button class="target ca" data-act="ca"><div class="ic">${ic('skillet',28)}</div>Cooking Assist</button>`
      : `<div class="target dim"><div class="ic" style="background:${a[1]}">${a[2]}</div>${a[0]}</div>`).join('')}</div>
    <div class="share-row">${apps.slice(4).map(a=>`<div class="target dim"><div class="ic" style="background:${a[1]}">${a[2]}</div>${a[0]}</div>`).join('')}</div>
  </div>`;
  $('#sheetHost [data-act=close]').onclick = () => $('#sheetHost').innerHTML='';
  $('#sheetHost [data-act=ca]').onclick = () => { log('share_target','Cooking Assist','touch'); openActivation(); };
}

function sourceCard(){
  return `<div class="source-card"><div class="th" style="background-image:url('${thumbURL}')"></div>
    <div><b>${esc(R.title)}</b><small>${ic('play',14)}${R.platform}</small><small style="margin-top:2px">${esc(R.creator)}</small></div></div>`;
}
function sheetHead(){ return `<div class="grab"></div><div class="sheet-head"><span class="appicon">${ic('skillet',16)}</span>Cooking Assist</div>`; }

function openActivation(){
  $('#sheetHost').innerHTML = `<div class="scrim" data-act="cancel"></div>
  <div class="sheet" id="actSheet">${sheetHead()}${sourceCard()}
    <h2 class="t-title">Cook this recipe?</h2>
    <p class="lead t-body">Cooking Assist turns this recipe into steps you can follow at your pace.</p>
    <button class="btn primary" data-act="start">Start Cooking Assist</button>
    <button class="btn tertiary" data-act="cancel">Cancel</button>
  </div>`;
  document.querySelectorAll('#sheetHost [data-act=cancel]').forEach(b=>b.onclick=()=>{ log('activation_cancel','','touch'); $('#sheetHost').innerHTML=''; });
  $('#sheetHost [data-act=start]').onclick = () => { log('activation_start','','touch'); unlockAudio(); buildCook(true); preparing(); };
}

function preparing(){
  const sh = $('#actSheet');
  const nIng = new Set(Object.values(R.ingredients).map(g=>g.name.split(',')[0].replace(/\s*\(.*\)/,'').toLowerCase())).size, nSt = R.steps.length;
  const stages = [['Finding ingredients', `${nIng} found`],['Organising steps', `${nSt} steps`],['Matching video moments','']];
  let k = 0;
  const draw = () => {
    sh.innerHTML = `${sheetHead()}${sourceCard()}
      <h2 class="t-section" style="font-size:24px;line-height:30px">Getting your recipe ready…</h2>
      <div style="margin-top:12px">${stages.map((s,i)=>`<div class="stage ${i<k?'':'work'} ${i>k?'todo':''}">
        ${i<k?ic('ccheck',24):'<div class="spin"></div>'}<span>${s[0]}</span><em>${i<k?s[1]:(i===k?'Working':'')}</em></div>`).join('')}</div>
      <button class="btn tertiary" data-act="cancel">Cancel</button>`;
    $('[data-act=cancel]',sh).onclick = () => { clearTimeout(tm); $('#sheetHost').innerHTML=''; destroyCook(); };
  };
  draw();
  let tm = setTimeout(function step(){ k++; if (k<3){ draw(); tm=setTimeout(step, 900);} else ready(); }, 900);
}

function ready(){
  const sh = $('#actSheet');
  sh.innerHTML = `${sheetHead()}${sourceCard()}
    <div class="okdot">${ic('check',24)}</div>
    <h2 class="t-title" style="margin-top:var(--s3)">${R.steps.length} steps ready</h2>
    <p class="lead t-body">Takes about ${R.aboutMin} min. Each step links to its part of the video.</p>
    <button class="btn primary" data-act="go">Start cooking${ic('chev',24)}</button>
    <button class="btn tertiary" data-act="review">${ic('list',22)}Review steps</button>`;
  $('[data-act=go]',sh).onclick = () => { log('start_cooking','','touch'); enterCook(false); };
  $('[data-act=review]',sh).onclick = () => { log('review_steps','','touch'); enterCook(true); };
}

/* ================================================================
   COOKING MODE
   ================================================================ */
let cookEl = null;
function buildCook(hidden){
  if (cookEl) return;
  S.step = 0; S.maxStep = 0; S.timers = {}; S.overlay = null; S.watching=false; S.videoOk = true; S.playerReady=false;
  cookEl = document.createElement('div');
  cookEl.className = 'screen cook';
  if (hidden) cookEl.style.visibility = 'hidden';
  cookEl.innerHTML = `
    <div class="ltop">
      <button class="tb-btn" data-act="exit">${ic('close',22)}Exit</button>
      <div class="lprog"><b id="lStepLbl"></b><div class="segs" id="lSegs"></div></div>
      <div id="lChip"></div>
      <div class="spacer"></div>
      <div id="vpillHost"></div>
      <button class="tb-btn r" data-act="steps">${ic('list',22)}Steps</button>
    </div>
    <div class="topbar">
      <button class="tb-btn" data-act="exit">${ic('close',22)}Exit</button>
      <div class="ttl" id="ttl">${esc(R.title)}</div>
      <button class="tb-btn r" data-act="steps">${ic('list',22)}Steps</button>
    </div>
    <div class="progress">
      <div class="lbl"><span id="stepLbl" class="facTap"></span><span id="chipHost"></span></div>
      <div class="segs" id="segs"></div>
    </div>
    <div class="main" id="main">
      <div class="lcol">
        <div class="player-slot">
          <div class="player" id="player">
            <div id="yt"></div>
            <div class="tapcatch" data-act="toggleplay"></div>
            <div id="plabel"></div>
            <div id="unavail"></div>
          </div>
          <div class="ovl" id="ovl"></div>
        </div>
        <div class="strip" id="strip"></div>
        <div class="tl"><div class="bg"></div><div class="played" id="pplayed"></div><div class="seg" id="pseg"></div><div class="thumb" id="pthumb"></div></div>
        <div id="lbody"></div>
      </div>
      <div class="rcol" id="rcol"><div class="rscroll" id="rbody"></div><div id="rctrls"></div></div>
    </div>
    <div class="bottom" id="bottom"><div id="pctrls"></div><div id="vbarHost"></div></div>
    <div id="cookSheet"></div>`;
  app.appendChild(cookEl);
  cookEl.addEventListener('click', onCookClick);
  initPlayer();
}
function destroyCook(){
  if (!cookEl) return;
  try{ player && player.destroy && player.destroy(); }catch(e){}
  player = null; cookEl.remove(); cookEl = null;
}

function enterCook(withOverview){
  const sh = $('#sheetHost'); if (sh) sh.innerHTML = '';
  const yt = document.querySelector('.screen.yt'); if (yt) yt.remove();
  cookEl.style.visibility = '';
  S.startedAt = Date.now();
  requestWake();
  render();
  goStep(0, { play: false, via: 'auto' });
  if (withOverview) { openOverview(); }
  else if (SR) { showHandsFreePrompt(); }
  else { setVoice('unavailable'); maybeOrientationHint(); playSegment(false); }
}

/* ---------- click routing ---------- */
function onCookClick(e){
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, arg = b.dataset.arg;
  switch(a){
    case 'next': act('next','touch'); break;
    case 'prev': act('prev','touch'); break;
    case 'repeat': act('repeat','touch'); break;
    case 'toggleplay': act(S.playing?'pause':'play','touch'); break;
    case 'steps': act('overview','touch'); break;
    case 'exit': log('exit','','touch'); showSource(); break;
    case 'watch': S.watching = true; log('watch_step','', 'touch'); render(); playSegment(false); break;
    case 'timerStart': act('timerStart','touch'); break;
    case 'timerPause': act('timerPause','touch'); break;
    case 'timerAdd': act('timerAdd','touch'); break;
    case 'timerReset': resetTimer(S.step); render(); break;
    case 'chip': log('timer_chip','', 'touch'); goStep(+arg, {play:true, via:'touch'}); break;
    case 'speak': if (S.voice==='on' || S.voice==='listening') break; log('tap_to_speak','', 'touch'); listenOnce(); break;
    case 'hf': toggleHandsFree(); break;
    case 'retryVoice': log('voice_retry','', 'touch'); listenOnce(); break;
    case 'stay': act('stay','touch'); break;
    case 'goPreview': act('goPreview','touch'); break;
    case 'dismiss': clearOverlay(); break;
    case 'retryVideo': log('video_retry','','touch'); retryVideo(); break;
    case 'hintGo': case 'hintKeep': clearOverlay(); log('orientation_hint', a, 'touch'); break;
  }
}

/* ---------- actions (shared by touch, voice & keyboard) ---------- */
function act(intent, via, data){
  log('action', intent + (data&&data.name?(':'+data.name):''), via);
  switch(intent){
    case 'next':
      if (S.step >= R.steps.length-1) { complete(); return 'Finishing'; }
      goStep(S.step+1, {play:true, via}); return `Step ${S.step+1} · ${R.steps[S.step].title}`;
    case 'prev':
      if (S.step === 0) return 'Already at Step 1';
      goStep(S.step-1, {play:true, via}); return `Back to Step ${S.step+1}`;
    case 'repeat': repeatStep(); return `Replaying Step ${S.step+1}`;
    case 'pause': pauseVideo(); showToast('pause', via); return 'Video paused';
    case 'play': playVideo(); showToast('play', via); return 'Playing';
    case 'overview': openOverview(); return 'Showing all steps';
    case 'closeOverview': closeOverview(); return 'Closed steps';
    case 'preview': showPreview(); return S.step < R.steps.length-1 ? `Showing Step ${S.step+2} · nothing moved` : 'This is the last step';
    case 'stay': clearOverlay(); return `Staying on Step ${S.step+1}`;
    case 'goPreview': clearOverlay(); goStep(S.step+1,{play:true, via}); return `Step ${S.step+1}`;
    case 'timerStart': return startTimer();
    case 'timerPause': return pauseTimer();
    case 'timerAdd': return addMinute();
  }
}

/* ---------- step navigation ---------- */
function goStep(i, opt={}){
  i = Math.max(0, Math.min(R.steps.length-1, i));
  S.step = i; S.maxStep = Math.max(S.maxStep, i);
  S.watching = false; S.segLabel = null;
  if (S.overlay && S.overlay.type !== 'hint') clearOverlay(true);
  render();
  const st = R.steps[i];
  if (st.type === 'time' && !S.landscape) { pauseVideo(); seekTo(st.t[0]); }
  else if (opt.play) playSegment(false);
  else seekTo(st.t[0]);
}

function repeatStep(){
  const st = R.steps[S.step];
  if (st.type === 'time' && !S.landscape) S.watching = true;
  S.segLabel = `Replaying Step ${S.step+1}`;
  render();
  playSegment(true);
}

/* ================================================================
   RENDER
   ================================================================ */
function render(){
  if (!cookEl) return;
  S.landscape = window.matchMedia('(orientation:landscape) and (max-height:560px)').matches;
  const st = R.steps[S.step], N = R.steps.length;
  cookEl.classList.remove('lay-ingredient','lay-technique','lay-time');
  cookEl.classList.add('lay-'+st.type);
  cookEl.classList.toggle('watching', !!S.watching);

  // progress
  const segs = R.steps.map((_,i)=>`<i class="${i<S.step?'done':(i===S.step?'cur':'')}"></i>`).join('');
  $('#segs',cookEl).innerHTML = segs; $('#lSegs',cookEl).innerHTML = segs;
  $('#stepLbl',cookEl).textContent = `Step ${S.step+1} of ${N}`;
  $('#lStepLbl',cookEl).textContent = `Step ${S.step+1} of ${N}`;
  renderChip();

  // body placement
  const lb = $('#lbody',cookEl), rb = $('#rbody',cookEl);
  if (S.landscape){
    lb.innerHTML = st.type==='time' ? `<div class="lt-title"><h1 class="step-h t-title">${esc(st.title)}</h1><p class="step-d t-instr">${esc(st.short)}</p></div>` : '';
    rb.innerHTML = bodyHTML(st, true);
    $('#rctrls',cookEl).innerHTML = ctrlsHTML();
    $('#pctrls',cookEl).innerHTML = '';
  } else {
    lb.innerHTML = bodyHTML(st, false);
    rb.innerHTML = ''; $('#rctrls',cookEl).innerHTML = '';
    $('#pctrls',cookEl).innerHTML = ctrlsHTML();
  }
  // landscape "this step in the video"
  renderVoice();
  renderPlayerMeta();
  renderUnavail();
  renderOverlay();
}

function ingRows(st, askedId){
  if (!st.items.length) return '';
  return `<div class="ings">${st.items.map(id=>{
    const g = R.ingredients[id];
    return `<div class="ing ${askedId===id?'asked':''}" data-ing="${id}"><span class="q t-qty">${esc(g.qty||'—')}</span><span class="n">${esc(g.name)}</span>${askedId===id?`<span class="asked-tag">${ic('voice',16)}Asked</span>`:''}</div>`;
  }).join('')}</div>`;
}

function bodyHTML(st, land){
  const asked = S.overlay && S.overlay.asked;
  const head = (d) => `<h1 class="step-h t-title">${esc(st.title)}</h1><p class="step-d t-instr">${esc(d)}</p>`;
  if (st.type === 'ingredient'){
    return `<div class="body">${head(land?st.short:st.instruction)}
      ${ingRows(st, asked)}
      ${st.note?`<div class="rnote"><span class="chip recipe">${ic('book',16)}From recipe</span><span>${esc(st.note.text)}</span></div>`:''}
      ${segRangeHTML()}</div>`;
  }
  if (st.type === 'technique'){
    return `<div class="body">${head(st.instruction)}${(land||asked)?ingRows(st, asked):''}${segRangeHTML()}</div>`;
  }
  // time
  const watch = (!land && !S.watching) ? `<button class="watch" data-act="watch"><span class="wt" style="background-image:url('${thumbURL}')"><i>${ic('play',20)}</i></span><div><b>Watch this step</b><small>YouTube · ${fmt(st.t[0])} – ${fmt(st.t[1])}</small></div>${ic('chev',24)}</button>` : '';
  return `${watch}<div class="body">${land?'':head(st.instruction)}${timerHTML(S.step, st)}</div>`;
}

function segRangeHTML(){
  if (S.segLabel && R.steps[S.step].type!=='time')
    return `<div class="seg-range"><b>Plays ${fmt(R.steps[S.step].t[0])} → ${fmt(R.steps[S.step].t[1])}, then stops</b><span>No scrubbing</span></div>`;
  return '';
}

function ctrlsHTML(){
  const last = S.step === R.steps.length-1;
  return `<div class="ctrls">
    <button class="ctrl prev" data-act="prev" ${S.step===0?'disabled':''} aria-label="Previous step">${ic('back',24)}Previous</button>
    <button class="ctrl rep" data-act="repeat" aria-label="Repeat this step's video">${ic('replay',24)}Repeat</button>
    <button class="ctrl next" data-act="next">${last?'Finish':'Next'}${ic(last?'check':'chev',28)}</button>
  </div>`;
}

/* ---------- Voice bar ---------- */
const VMAP = {
  off:        ['Tap to speak', 'Mic off · touch always works', 'micoff'],
  on:         ['Hands-free on', 'Listening for commands', 'mic'],
  listening:  ['Listening…', '', 'mic'],
  heard:      ['', '', 'check'],
  answering:  ['Answering', '', 'volume'],
  error:      ['Didn’t catch that', 'Try again or use touch', 'hear'],
  unavailable:['Voice unavailable', 'Touch always works', 'micoff']
};
function renderVoice(){
  if (!cookEl) return;
  const v = S.voice, m = VMAP[v];
  const title = S.voiceText || m[0], sub = S.voiceSub || m[1];
  const right = v==='listening' ? `<span class="wave"><i></i><i></i><i></i><i></i><i></i></span>`
              : v==='error' ? `<span class="retry" data-act="retryVoice">Try again</span>` : '';
  const live = v==='on' ? '<span class="live"></span>' : '';
  $('#vbarHost',cookEl).innerHTML = `<div class="vbar">
    <button class="vstat ${v}" data-act="speak" aria-live="polite"><span class="mb">${ic(m[2],20)}${live}</span>
      <span class="tx"><b>${esc(title)}</b><small>${esc(sub)}</small></span>${right}</button>
    <button class="hfsw ${S.handsFree?'on':''}" data-act="hf" role="switch" aria-checked="${S.handsFree}" ${!SR?'disabled':''}><span class="sw"></span>Hands-free</button></div>`;
  $('#vpillHost',cookEl).innerHTML = `<button class="vpill ${v}" data-act="speak"><span class="mb">${ic(m[2],18)}</span>
      <span class="tx"><b>${esc(title)}</b><small>${esc(sub)}</small></span><span class="sw ${S.handsFree?'on':''}" data-act="hf"></span></button>`;
}
let voiceRevert = null;
function setVoice(state, text='', sub='', ms=0){
  S.voice = state; S.voiceText = text; S.voiceSub = sub;
  clearTimeout(voiceRevert);
  if (ms) voiceRevert = setTimeout(()=>{ restoreVolume(); setVoice(S.handsFree?'on':'off'); }, ms);
  renderVoice();
}

/* ---------- Player meta / timeline ---------- */
function renderPlayerMeta(){
  if (!cookEl) return;
  const st = R.steps[S.step];
  const dur = (player && S.playerReady && player.getDuration && player.getDuration()) || 0;
  const durF = dur || Math.max(st.t[1], R.steps[R.steps.length-1].t[1]) * 1.25;
  const cur = (player && S.playerReady && player.getCurrentTime && player.getCurrentTime()) || st.t[0];
  const pct = x => (100*Math.min(1,Math.max(0,x/durF)))+'%';
  const right = st.type === 'technique'
    ? `<button class="replay-btn" data-act="repeat">${ic('replay',20)}Replay this moment</button>`
    : `<span class="now">${fmt(cur)}${dur?' / '+fmt(dur):''}</span>`;
  const strip = $('#strip',cookEl);
  const sig = st.type + S.step;
  if (strip.dataset.sig !== sig){ strip.dataset.sig = sig;
    strip.innerHTML = `<span class="lab">${ic('play',16)}This step <b>${fmt(st.t[0])} – ${fmt(st.t[1])}</b></span>${right}`; }
  else if (st.type !== 'technique'){ const n = strip.querySelector('.now'); if (n) n.textContent = `${fmt(cur)}${dur?' / '+fmt(dur):''}`; }
  $('#pplayed',cookEl).style.width = pct(cur);
  const sg = $('#pseg',cookEl); sg.style.left = pct(st.t[0]); sg.style.width = `calc(${pct(st.t[1])} - ${pct(st.t[0])})`;
  $('#pthumb',cookEl).style.left = pct(cur);
  $('#plabel',cookEl).innerHTML = S.ducked ? `<div class="plabel">${ic('volume',16)}Recipe audio lowered</div>`
    : (S.segLabel ? `<div class="plabel">${ic('replay',16)}${esc(S.segLabel)}</div>` : '');
}
function renderUnavail(){
  if (!cookEl) return;
  $('#unavail',cookEl).innerHTML = S.videoOk ? '' : `<div class="unavail">${ic('off',28)}<b>Video unavailable</b><small>The step still works without it.</small><button class="btn secondary" data-act="retryVideo">Retry</button></div>`;
}

/* ---------- Timer ---------- */
function timerHTML(i, st){
  const T = S.timers[i];
  const total = st.timer;
  if (!T || (!T.running && !T.done && T.remaining===T.total && !T.paused)){
    return `<div class="timer idle"><div class="tt"><span>${ic('timer',18)}Timer ready</span></div>
      <div class="big">${fmt(total)}</div>
      <button class="btn accent" data-act="timerStart">${ic('play',22)}Start timer</button>
      <div class="sayit">or say “Start the timer”</div></div>`;
  }
  if (T.done){
    return `<div class="timer done"><div class="tt"><span>${ic('timer',18)}${esc(st.timerLabel)} timer</span><span><i class="dot"></i>Done</span></div>
      <div class="big">00:00</div><div class="rem">Time’s up — check the pot</div>
      <div class="acts"><button class="btn secondary" data-act="timerAdd">+ 1 min</button><button class="btn secondary" data-act="next">Next step</button></div></div>`;
  }
  const rem = T.running ? (T.endAt - Date.now())/1000 : T.remaining;
  return `<div class="timer run"><div class="tt"><span>${ic('timer',18)}${esc(st.timerLabel)} timer</span><span><i class="dot"></i>${T.running?'Running':'Paused'}</span></div>
    <div class="big" id="tbig">${fmt(Math.ceil(rem))}</div><div class="rem">remaining</div>
    <div class="bar"><i id="tbar" style="width:${100*rem/T.total}%"></i></div>
    <div class="acts">${T.running
      ? `<button class="btn secondary" data-act="timerPause">${ic('pause',22)}Pause timer</button>`
      : `<button class="btn secondary" data-act="timerStart">${ic('play',22)}Resume</button>`}
      <button class="btn secondary min" data-act="timerAdd">+ 1 min</button></div></div>`;
}
function timerStepIndex(){ const k = Object.keys(S.timers).find(k=>S.timers[k].running||S.timers[k].paused||S.timers[k].done); return k===undefined?null:+k; }
function startTimer(){
  let i = R.steps[S.step].timer ? S.step : timerStepIndex();
  if (i===null) i = R.steps.findIndex(s=>s.timer);
  const st = R.steps[i];
  let T = S.timers[i];
  if (!T || T.done) T = S.timers[i] = { total: st.timer, remaining: st.timer, running:false, paused:false, done:false };
  if (T.running) return 'Timer already running';
  T.running = true; T.paused = false; T.endAt = Date.now() + T.remaining*1000;
  render();
  return `Timer started · ${Math.round(T.remaining/60)} min`;
}
function pauseTimer(){
  const i = timerStepIndex(); if (i===null) return 'No timer running';
  const T = S.timers[i]; if (!T.running) return 'Timer is paused';
  T.remaining = (T.endAt-Date.now())/1000; T.running=false; T.paused=true; render(); return 'Timer paused';
}
function addMinute(){
  let i = timerStepIndex(); if (i===null){ return 'No timer running'; }
  const T = S.timers[i];
  if (T.done){ T.done=false; T.remaining=60; T.total=Math.max(T.total,60); T.running=true; T.endAt=Date.now()+60000; }
  else if (T.running){ T.endAt += 60000; T.total += 60; }
  else { T.remaining += 60; T.total += 60; }
  render(); return 'Added 1 minute';
}
function resetTimer(i){ delete S.timers[i]; }
function renderChip(){
  const i = timerStepIndex();
  let html = '';
  if (i!==null && i!==S.step){
    const T = S.timers[i], st = R.steps[i];
    const rem = T.done ? 0 : (T.running ? (T.endAt-Date.now())/1000 : T.remaining);
    html = `<button class="timer-chip" data-act="chip" data-arg="${i}">${ic('timer',18)}${esc(st.timerLabel)} ${T.done?'done':fmt(Math.ceil(rem))}</button>`;
  }
  $('#chipHost',cookEl).innerHTML = html; $('#lChip',cookEl).innerHTML = html;
}
function tickTimers(){
  for (const k in S.timers){
    const T = S.timers[k];
    if (T.running && Date.now() >= T.endAt){
      T.running=false; T.done=true; T.remaining=0;
      log('timer_done', R.steps[k].timerLabel, 'system');
      chime(); speak('Timer done'); if (navigator.vibrate) navigator.vibrate([300,150,300,150,300]);
      if (+k === S.step) render(); else renderChip();
      if (+k !== S.step) showOverlay({type:'timerdone', step:+k}, 8000);
    }
  }
  const i = S.step, T = S.timers[i];
  if (T && T.running){
    const rem = (T.endAt-Date.now())/1000;
    const b = $('#tbig',cookEl); if (b) b.textContent = fmt(Math.ceil(rem));
    const bar = $('#tbar',cookEl); if (bar) bar.style.width = (100*rem/T.total)+'%';
  }
  renderChip();
}

/* ---------- Overlays (cards over the lower video) ---------- */
let ovlTimer = null;
function showOverlay(o, ms){
  S.overlay = o; clearTimeout(ovlTimer);
  if (ms) ovlTimer = setTimeout(()=>clearOverlay(), ms);
  o.ms = ms;
  render();
}
function clearOverlay(noRender){
  clearTimeout(ovlTimer);
  const had = S.overlay; S.overlay = null;
  if (had && had.type==='preview') {/* nothing moved */}
  if (!noRender) render();
}
function renderOverlay(){
  const host = $('#ovl',cookEl); if (!host) return;
  const o = S.overlay; if (!o){ host.innerHTML=''; return; }
  const bar = o.ms ? `<div class="ans-bar"><i style="animation-duration:${o.ms}ms"></i></div>` : '';
  const spoken = `<span class="spk">${ic('volume',16)}Spoken</span>`;
  let h = '';
  if (o.type === 'answer'){
    h = `<div class="card"><div class="ans-top"><span class="chip recipe">${ic('book',16)}From recipe</span>${spoken}</div>
      <div class="ans-main"><b class="${o.big.length>8?'txt':''}">${esc(o.big)}</b><span>${esc(o.sub)}</span></div>${bar}</div>`;
  } else if (o.type === 'sub'){
    h = o.kind === 'recipe'
      ? `<div class="card"><div class="ans-top"><span class="chip recipe">${ic('book',16)}From recipe</span>${spoken}</div><p class="say">${esc(o.text)}</p>${bar}</div>`
      : `<div class="card sugg"><div class="ans-top"><span class="chip sugg">${ic('bulb',16)}Cooking suggestion</span><span class="nf">Not from the original recipe</span></div><p class="say">${esc(o.text)}</p>${bar}</div>`;
  } else if (o.type === 'preview'){
    const n = R.steps[S.step+1];
    h = n ? `<div class="card"><span class="chip next">${ic('arrowR',16)}Up next · Step ${S.step+2}</span>
      <p class="say">${esc(n.title)} — ${esc(n.short)}</p>
      <div class="two"><button class="btn secondary sm" data-act="stay">Stay here</button><button class="btn primary sm" data-act="goPreview">Go to Step ${S.step+2}</button></div></div>`
      : `<div class="card"><span class="chip next">${ic('check',16)}Last step</span><p class="say">This is the final step. Say “Next” or tap Finish when you’re done.</p>${bar}</div>`;
  } else if (o.type === 'error'){
    h = `<div class="card err"><div class="err-row"><span class="err-ic">${ic('hear',20)}</span><div><b>${esc(o.title||'I didn’t catch that.')}</b><small>${esc(o.sub||'Try “Next”, “Again” or “How much…?”')}</small></div></div>
      <button class="btn dark sm" data-act="retryVoice">${ic('mic',20)}Try again</button></div>`;
  } else if (o.type === 'toast'){
    h = `<div class="toast"><span class="ti">${ic(o.icon,22)}</span><div><b>${esc(o.title)}</b><small>${esc(o.sub)}</small></div></div>`;
  } else if (o.type === 'hint'){
    h = `<div class="card"><div class="hint-row"><span class="hint-ic">${ic('rotate',22)}</span><div><b>Want more room?</b><small>Turn your phone for a bigger cooking view.</small></div></div>
      <div class="two"><button class="btn secondary sm" data-act="hintKeep">Keep portrait</button><button class="btn primary sm" data-act="hintGo">Got it</button></div></div>`;
  } else if (o.type === 'timerdone'){
    const st = R.steps[o.step];
    h = `<div class="card" style="box-shadow:var(--shadow),inset 0 0 0 2px var(--saffron)"><span class="chip saff">${ic('timer',16)}${esc(st.timerLabel)} timer</span>
      <p class="say">Time’s up for Step ${o.step+1}.</p>
      <div class="two"><button class="btn secondary sm" data-act="dismiss">OK</button><button class="btn primary sm" data-act="chip" data-arg="${o.step}">Go to Step ${o.step+1}</button></div></div>`;
  } else if (o.type === 'notice'){
    h = `<div class="card"><div class="hint-row"><span class="hint-ic">${ic(o.icon||'mic',22)}</span><div><b>${esc(o.title)}</b><small>${esc(o.sub)}</small></div></div>${bar}</div>`;
  }
  host.innerHTML = h;
}
function showToast(kind, via){
  if (kind==='pause') showOverlay({type:'toast', icon:'pause', title:'Paused', sub: S.handsFree ? 'Say “Play” to continue' : 'Tap the video to play'}, 2500);
  else showOverlay({type:'toast', icon:'play', title:'Playing', sub: S.handsFree ? 'Say “Pause” to stop' : 'Tap the video to pause'}, 1600);
}
function showPreview(){ showOverlay({type:'preview'}, S.step < R.steps.length-1 ? 12000 : 5000); }

function maybeOrientationHint(){
  if (S.hintShown || S.landscape) return;
  S.hintShown = true;
  setTimeout(()=>{ if (!S.overlay && !S.landscape && cookEl) showOverlay({type:'hint'}, 8000); }, 1200);
}

/* ---------- Hands-free prompt (P5) ---------- */
function showHandsFreePrompt(){
  $('#cookSheet',cookEl).innerHTML = `<div class="scrim"></div><div class="sheet"><div class="grab"></div>
    <div class="okdot" style="margin:0">${ic('mic',24)}</div>
    <h2 class="t-title" style="margin-top:var(--s4)">Cook hands-free?</h2>
    <p class="lead t-body">Control your recipe with your voice, so your hands can stay on the pan.</p>
    <div class="privacy t-support">${ic('lock',18)}<span>The mic listens only while hands-free is on. Turn it off any time.</span></div>
    <button class="btn primary" data-act="hfYes">${ic('mic',22)}Turn on hands-free</button>
    <button class="btn tertiary" data-act="hfNo">Not now</button>
    <p class="fine">Not now keeps Tap to speak. The system mic permission appears only after you turn hands-free on.</p></div>`;
  const close = () => { $('#cookSheet',cookEl).innerHTML=''; maybeOrientationHint(); playSegment(false); };
  $('[data-act=hfYes]',cookEl).onclick = (e) => { e.stopPropagation(); log('handsfree_prompt','yes','touch'); close(); setHandsFree(true); };
  $('[data-act=hfNo]',cookEl).onclick = (e) => { e.stopPropagation(); log('handsfree_prompt','not now','touch'); close(); setVoice('off'); };
}

/* ---------- Overview (P17 / L9) ---------- */
function openOverview(){
  S.overviewOpen = true; S.jumpTarget = null; drawOverview();
}
function closeOverview(){ S.overviewOpen=false; S.jumpTarget=null; const h=$('#cookSheet',cookEl); if(h) h.innerHTML=''; }
function drawOverview(){
  const N = R.steps.length;
  const leftMin = Math.max(1, Math.round(R.aboutMin * (N - S.step) / N));
  const rows = R.steps.map((s,i)=>{
    const cls = i<S.step ? 'done' : (i===S.step?'cur':'');
    const icn = i<S.step ? ic('ccheck',22) : (i===S.step ? ic('radioon',22) : ic('radio',22));
    const tag = i<S.step ? 'Done' : (i===S.step?'Now':'');
    let row = `<button class="srow ${cls}" data-ov="${i}">${icn}<span class="nu">${i+1}</span><span class="st">${esc(s.title)}</span><span class="tag">${tag}</span></button>`;
    if (S.jumpTarget === i){
      row += `<div class="jump"><b>Jump to Step ${i+1}: ${esc(s.title)}?</b><small>Steps ${S.step+2}–${i} aren’t done yet.</small>
        <div class="two"><button class="btn secondary sm" data-ovact="cancel">Cancel</button><button class="btn dark sm" data-ovact="jump">Jump to Step ${i+1}</button></div></div>`;
    }
    return row;
  }).join('');
  $('#cookSheet',cookEl).innerHTML = `<div class="scrim" data-ovact="close"></div><div class="sheet ov" style="padding:var(--s5) var(--s4) calc(var(--s4) + var(--safe-b))"><div class="grab"></div>
    <div class="ov-head"><div><b class="t-section">Cooking progress</b><small>Step ${S.step+1} of ${N} · about ${leftMin} min left</small></div>
    <button class="ov-close" data-ovact="close">${ic('close',18)}Close</button></div>
    <div style="margin-top:8px">${rows}</div></div>`;
  const h = $('#cookSheet',cookEl);
  h.querySelectorAll('[data-ov]').forEach(b=>b.onclick=(e)=>{ e.stopPropagation();
    const i = +b.dataset.ov;
    if (i === S.step) { closeOverview(); return; }
    if (i > S.step+1) { S.jumpTarget = i; drawOverview(); const j=h.querySelector('.jump'); j&&j.scrollIntoView({block:'nearest'}); return; }
    log('overview_go', 'step '+(i+1), 'touch'); closeOverview(); goStep(i,{play:true,via:'touch'});
  });
  h.querySelectorAll('[data-ovact]').forEach(b=>b.onclick=(e)=>{ e.stopPropagation();
    const a = b.dataset.ovact;
    if (a==='close') { log('overview_close','','touch'); closeOverview(); if (!S.playing && S.step===0 && !S.everPlayed) playSegment(false); }
    if (a==='cancel') { S.jumpTarget=null; drawOverview(); }
    if (a==='jump') { const t=S.jumpTarget; log('overview_jump','step '+(t+1),'touch'); closeOverview(); goStep(t,{play:true,via:'touch'}); }
  });
}

/* ---------- Completion ---------- */
function complete(){
  log('complete','', '');
  pauseVideo(); stopRec(); releaseWake();
  const mins = Math.max(1, Math.round((Date.now()-S.startedAt)/60000));
  const resumeAt = Math.floor((player && S.playerReady && player.getCurrentTime && player.getCurrentTime()) || 0);
  const N = R.steps.length;
  destroyCook();
  app.innerHTML = `<div class="screen"><div class="done-wrap">
    <div class="segs">${R.steps.map((_,i)=>`<i class="${i===N-1?'cur':'done'}"></i>`).join('')}</div>
    <div class="done-check">${ic('check',32)}</div>
    <h1>Done.</h1><div class="sub">${esc(R.title)} complete</div>
    <div class="stats"><div><b>${N} of ${N}</b><small>steps completed</small></div><div style="border-left:1px solid var(--divider)"><b>${mins} min</b><small>cooking time</small></div></div>
    <div class="sp"></div>
    <button class="btn primary" id="finBtn">Finish Cooking</button>
    <a class="btn secondary" id="retBtn" href="https://youtu.be/${R.id}?t=${resumeAt}" target="_blank" rel="noopener" >${ic('back',22)}Return to YouTube</a>
  </div></div>`;
  speak(R.doneLine);
  $('#finBtn').onclick = () => { log('finish','','touch'); showSource(); };
  $('#retBtn').onclick = () => log('return_to_youtube','','touch');
}

/* ================================================================
   YOUTUBE PLAYER
   ================================================================ */
let player = null, ytApiPromise = null, readyTimeout = null;
function loadYT(){
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((res, rej)=>{
    if (window.YT && window.YT.Player) return res();
    window.onYouTubeIframeAPIReady = () => res();
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = rej;
    document.head.appendChild(s);
  });
  return ytApiPromise;
}
function initPlayer(){
  clearTimeout(readyTimeout);
  readyTimeout = setTimeout(()=>{ if (!S.playerReady) { S.videoOk=false; log('video_unavailable','timeout','system'); renderUnavail(); renderPlayerMeta(); } }, 12000);
  loadYT().then(()=>{
    if (!cookEl) return;
    player = new YT.Player('yt', {
      videoId: R.id,
      playerVars: { controls:0, disablekb:1, playsinline:1, rel:0, modestbranding:1, fs:0, iv_load_policy:3, cc_load_policy:0, start: Math.floor(R.steps[0].t[0]), origin: location.origin },
      events: {
        onReady: () => { S.playerReady = true; S.videoOk = true; clearTimeout(readyTimeout); renderUnavail();
          if (pendingPlay !== null) { const p = pendingPlay; pendingPlay = null; seekTo(p.t); if (p.play) playVideo(); } renderPlayerMeta(); },
        onStateChange: onPlayerState,
        onError: (e) => { S.videoOk = false; log('video_unavailable','error '+e.data,'system'); renderUnavail(); }
      }
    });
  }).catch(()=>{ S.videoOk=false; log('video_unavailable','api blocked','system'); renderUnavail(); });
}
function retryVideo(){
  try{ player && player.destroy(); }catch(e){}
  player = null; S.playerReady=false; S.videoOk = true;
  const slot = $('#player',cookEl); const old = $('#yt',cookEl) || slot.querySelector('iframe');
  if (old) old.remove();
  const d = document.createElement('div'); d.id='yt'; slot.insertBefore(d, slot.firstChild);
  renderUnavail(); initPlayer(); pendingPlay = {t:R.steps[S.step].t[0], play:true};
}
let pendingPlay = null;
/* Play intent. Android takes audio focus when the mic (re)starts or the app speaks, which
   pauses the video. We only pause when the cook (or a step clip ending) asked for it, and
   resume any pause we didn't ask for. */
let resumeT = null, resumes = [];
function onPlayerState(e){
  S.playing = (e.data === 1 || e.data === 3);
  if (e.data === 1) S.everPlayed = true;
  if (e.data === 0) S.wantPlay = false;
  if (e.data === 2 && S.wantPlay) scheduleResume();
  renderPlayerMeta();
}
function scheduleResume(){
  clearTimeout(resumeT);
  resumeT = setTimeout(()=>{
    if (!S.wantPlay || S.playing || !player || !S.playerReady) return;
    if (speaking){ scheduleResume(); return; }
    const now = Date.now(); resumes = resumes.filter(t=>now-t<15000); resumes.push(now);
    log('auto_resume', 'system pause undone', 'system');
    if (resumes.length > 8){ log('auto_resume_giveup','','system'); S.wantPlay = false;
      showOverlay({type:'notice', icon:'mic', title:'This phone pauses video while the mic listens', sub:'Tap the video to play · or use Tap to speak'}, 6000); return; }
    player.playVideo();
  }, 350);
}
function seekTo(t){ if (player && S.playerReady) player.seekTo(t, true); else pendingPlay = {t, play:false}; }
function playVideo(){ S.wantPlay = true; if (player && S.playerReady) player.playVideo(); else pendingPlay = {t:R.steps[S.step].t[0], play:true}; }
function pauseVideo(){ S.wantPlay = false; clearTimeout(resumeT); if (player && S.playerReady && player.pauseVideo) player.pauseVideo(); if (pendingPlay) pendingPlay.play=false; }
function playSegment(isRepeat){
  const st = R.steps[S.step];
  S.segEnd = st.t[1]; S.wantPlay = true;
  if (player && S.playerReady){ player.seekTo(st.t[0], true); player.playVideo(); }
  else pendingPlay = {t: st.t[0], play: true};
  if (isRepeat) log('replay_segment', `${fmt(st.t[0])}-${fmt(st.t[1])}`, '');
}
function tickPlayer(){
  if (!player || !S.playerReady || !player.getCurrentTime) return;
  const t = player.getCurrentTime();
  if (S.segEnd !== null && S.playing && t >= S.segEnd - 0.15){
    S.wantPlay = false; clearTimeout(resumeT); player.pauseVideo(); S.segEnd = null;
    if (S.segLabel){ S.segLabel = null; }
    if (S.watching && R.steps[S.step].type==='time' && !S.landscape){ S.watching=false; render(); return; }
    render(); return;
  }
  renderPlayerMeta();
}
let duckT = null;
function duck(){ S.ducked = true; try{ player && S.playerReady && player.setVolume(15); }catch(e){} renderPlayerMeta(); clearTimeout(duckT); duckT = setTimeout(restoreVolume, 9000); }
function restoreVolume(){ if (!S.ducked) return; S.ducked = false; try{ player && S.playerReady && player.setVolume(100); }catch(e){} renderPlayerMeta(); }

/* ================================================================
   VOICE — Web Speech API (Chrome on Android / desktop)
   ================================================================ */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recOn = false, oneShot = false, gotFinal = false, speaking = false, restartT = null;

function setHandsFree(on){
  S.handsFree = on; log('handsfree', on?'on':'off', 'touch');
  if (on){
    if (LOCAL.failed){ S.engine='web'; setVoice('on'); startRec(true); return; }
    setVoice('on', 'Getting voice ready…', LOCAL.model ? 'Starting the mic' : 'First time only · about 20–40 s');
    localStart().then(ok => {
      if (!S.handsFree){ localStop(); return; }
      if (ok){ S.engine='offline'; setVoice('on'); log('voice_engine','offline','system'); }
      else { S.engine='web'; log('voice_engine','web (fallback)','system'); setVoice('on'); startRec(true); }
    });
  }
  else { localStop(); stopRec(); restoreVolume(); setVoice('off'); }
}

/* ================================================================
   OFFLINE VOICE ENGINE (Vosk, in-browser, grammar-limited)
   The mic stays open: no restart loop, no beeps, no audio-focus pauses.
   It only listens for this recipe's command phrases, so kitchen noise and
   the video's own speech mostly come out as "unknown" and are ignored.
   ================================================================ */
const VOSK_JS = 'https://cdn.jsdelivr.net/npm/vosk-browser@0.0.8/dist/vosk.js';
const MODEL_URL = 'model.tar.gz';
const LOCAL = { model:null, rec:null, ctx:null, stream:null, src:null, node:null, failed:false, ignoreUntil:0 };
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('script '+src)); document.head.appendChild(s); }); }
function withTimeout(p, ms, what){ return Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error(what+' timeout')), ms))]); }
// Words missing from the offline model's vocabulary, spelled with in-vocabulary sound-alikes.
const SOUNDALIKE = { turmeric:['term eric','term rick','tumor rick','her merrick'], haldi:['hal dee','hall dee','hal di','hardy'],
  cardamom:['card a mom','car dam mom','card mom'], namak:['numb muck'], pyaz:['pie as'], chilli:['chili','chilly'] };
function fromSoundalike(t){
  for (const [word, alts] of Object.entries(SOUNDALIKE)) for (const a of alts) t = t.replace(new RegExp('\\b'+a+'\\b','g'), word);
  return t;
}
function buildGrammar(){
  const cmds = ['next','next step','go next','go back','back','previous','previous step','again','repeat','repeat that','replay',
    'once more','pause','stop','pause the video','stop the video','play','resume','continue','play the video',
    "what's next",'what is next','what comes next','show steps','show all steps','close','go','go ahead','stay','stay here','yes','no',
    'start the timer','start timer','pause the timer','stop the timer','add a minute','add one minute','one more minute'];
  const names = new Set();
  Object.values(R.ingredients).forEach(g => g.aliases.forEach(a => { if (/^[a-z ]+$/.test(a) && a.split(' ').length <= 3) names.add(a); }));
  for (const [word, alts] of Object.entries(SOUNDALIKE)) [...names].forEach(n => { if (n.includes(word)) alts.forEach(a => names.add(n.replace(word, a))); });
  const q = [];
  names.forEach(n => q.push(`how much ${n}`, `how many ${n}`, `i don't have ${n}`, `no ${n}`, `instead of ${n}`, `substitute ${n}`, `what can i use instead of ${n}`));
  return cmds.concat(q, ['[unk]']);
}
async function localStart(){
  try{
    if (!window.isSecureContext || !navigator.mediaDevices) throw new Error('insecure context');
    const head = await withTimeout(fetch(MODEL_URL, {method:'HEAD', cache:'no-store'}), 8000, 'model check');
    if (!head.ok) throw new Error('model file missing ('+head.status+')');
    if (!window.Vosk) await withTimeout(loadScript(VOSK_JS), 30000, 'engine download');
    if (!LOCAL.model){
      LOCAL.model = await withTimeout(Vosk.createModel(new URL(MODEL_URL, location.href).href), 120000, 'model load');
    }
    LOCAL.stream = await navigator.mediaDevices.getUserMedia({ video:false,
      audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1 } });
    LOCAL.ctx = new (window.AudioContext||window.webkitAudioContext)();
    await LOCAL.ctx.resume();
    LOCAL.rec = new LOCAL.model.KaldiRecognizer(LOCAL.ctx.sampleRate, JSON.stringify(buildGrammar()));
    LOCAL.rec.setWords(true);
    LOCAL.rec.on('result', m => onLocalResult(m.result));
    LOCAL.rec.on('partialresult', m => onLocalPartial(m.result && m.result.partial));
    LOCAL.src = LOCAL.ctx.createMediaStreamSource(LOCAL.stream);
    LOCAL.node = LOCAL.ctx.createScriptProcessor(4096, 1, 1);
    LOCAL.node.onaudioprocess = (e) => { if (S.handsFree && LOCAL.rec) { try{ LOCAL.rec.acceptWaveform(e.inputBuffer); }catch(err){} } };
    LOCAL.src.connect(LOCAL.node); LOCAL.node.connect(LOCAL.ctx.destination);
    return true;
  }catch(e){
    log('voice_engine_fail', String(e && e.message || e), 'system');
    if (/not ?allowed|permission|denied/i.test(String(e && (e.name+e.message)))){ localStop(); S.handsFree=false; setVoice('unavailable','Mic blocked','Allow the mic in Chrome settings · touch works'); return false; }
    LOCAL.failed = true; localStop(); return false;
  }
}
function localStop(){
  try{ LOCAL.node && (LOCAL.node.onaudioprocess = null, LOCAL.node.disconnect()); }catch(e){}
  try{ LOCAL.src && LOCAL.src.disconnect(); }catch(e){}
  try{ LOCAL.stream && LOCAL.stream.getTracks().forEach(t=>t.stop()); }catch(e){}
  try{ LOCAL.ctx && LOCAL.ctx.close(); }catch(e){}
  try{ LOCAL.rec && LOCAL.rec.remove(); }catch(e){}
  LOCAL.node = LOCAL.src = LOCAL.stream = LOCAL.ctx = LOCAL.rec = null;
}
const clean = t => (t||'').replace(/\[unk\]/g,' ').replace(/\s+/g,' ').trim();
function onLocalPartial(p){
  p = fromSoundalike(clean(p));
  if (!S.handsFree || speaking || Date.now() < LOCAL.ignoreUntil || !p) return;
  if (S.voice !== 'listening') duck();
  setVoice('listening', 'Listening…', `“${p}”`);
}
function onLocalResult(r){
  const text = fromSoundalike(clean(r && r.text));
  if (!S.handsFree) return;
  if (speaking || Date.now() < LOCAL.ignoreUntil){ return; }
  if (!text){ if (S.voice === 'listening'){ restoreVolume(); setVoice('on'); } return; }
  const words = (r.result || []).filter(w => w.word !== '[unk]');
  const conf = words.length ? words.reduce((a,w)=>a+w.conf,0)/words.length : 0;
  const alts = [text]; alts.conf = conf;
  handleUtterance(alts);
}
function toggleHandsFree(){ if (!SR) return; setHandsFree(!S.handsFree); }
function listenOnce(){
  if (!SR){ setVoice('unavailable','Voice unavailable','This browser has no speech recognition'); return; }
  stopRec(); oneShot = true; gotFinal = false;
  setVoice('listening','Listening…','Say a command'); duck();
  startRec(false);
}
function startRec(continuous){
  if (!SR) return;
  clearTimeout(restartT);
  try{ if (rec) { rec.onend = null; rec.abort(); } }catch(e){}
  rec = new SR();
  rec.lang = 'en-IN'; rec.continuous = continuous; rec.interimResults = true; rec.maxAlternatives = 3;
  rec.onresult = onResult;
  rec.onerror = (e) => {
    log('voice_error', e.error, 'system');
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed'){
      S.handsFree = false; oneShot=false; setVoice('unavailable','Mic blocked','Allow the mic in Chrome settings · touch works');
    } else if (e.error === 'network'){
      S.handsFree = false; oneShot=false; setVoice('unavailable','Voice needs internet','Touch always works');
    } else if (e.error === 'audio-capture'){
      S.handsFree = false; oneShot=false; setVoice('unavailable','No microphone found','Touch always works');
    }
  };
  rec.onend = () => {
    recOn = false;
    if (oneShot){
      oneShot = false;
      if (!gotFinal && S.voice === 'listening'){ restoreVolume(); setVoice('error','Didn’t catch that','Try again or use touch', 5000); }
      return;
    }
    if (S.handsFree && S.engine !== 'offline' && !speaking) restartT = setTimeout(()=>{ if (S.handsFree && S.engine !== 'offline' && !speaking && cookEl) startRec(true); }, 250);
  };
  try { rec.start(); recOn = true; } catch(e){ recOn = false; }
}
function stopRec(){ clearTimeout(restartT); oneShot=false; try{ if (rec){ rec.onend=null; rec.abort(); } }catch(e){} recOn=false; }

const KEYWORDS = /\b(next|back|previous|again|repeat|replay|pause|play|stop|wait|resume|continue|steps?|timer|minute|how|what|much|many|substitute|instead|have|go|stay|aage|peeche|dobara|ruko|kitna|kitni)\b/;
function onResult(e){
  let interim = '', finals = [];
  for (let i = e.resultIndex; i < e.results.length; i++){
    const r = e.results[i];
    if (r.isFinal){ const alts=[]; for (let j=0;j<r.length;j++) alts.push(r[j].transcript.trim()); alts.conf = r[0].confidence; finals.push(alts); }
    else interim += r[0].transcript;
  }
  interim = interim.trim();
  if (interim){
    const directed = oneShot || (KEYWORDS.test(interim.toLowerCase()) && interim.split(/\s+/).length <= 7);
    if (directed){
      if (S.voice !== 'listening') duck();
      setVoice('listening','Listening…', `“${interim}”`);
    }
  }
  finals.forEach(alts => handleUtterance(alts));
}

function handleUtterance(alts){
  const wasOneShot = oneShot;
  gotFinal = true;
  let res = null, used = alts[0];
  for (const a of alts){ const r = parse(a); if (r){ res = r; used = a; break; } }
  const words = (alts[0]||'').split(/\s+/).filter(Boolean).length;
  if (!res){
    const directed = wasOneShot || (KEYWORDS.test((alts[0]||'').toLowerCase()) && words <= 6);
    log('voice_unmatched', alts[0], directed ? 'voice' : 'ignored');
    if (directed){
      restoreVolume();
      setVoice('error','Didn’t catch that','Try again or use touch', 5000);
      showOverlay({type:'error'}, 5000);
    } else if (S.voice === 'listening'){ restoreVolume(); setVoice(S.handsFree?'on':'off'); }
    return;
  }
  const bare = ['next','prev','repeat','pause','play'].includes(res.intent);
  const minConf = S.engine === 'offline' ? 0.55 : 0;
  if (bare && !wasOneShot && alts.conf > 0 && alts.conf < minConf){
    log('voice_lowconf', `"${used}" ${alts.conf.toFixed(2)}`, 'ignored');
    if (S.voice === 'listening'){ restoreVolume(); setVoice(S.handsFree?'on':'off'); }
    return;
  }
  log('voice_command', `"${used}" → ${res.intent}${res.ing?(':'+res.ing):''}`, 'voice');
  execVoice(res, used);
}

function execVoice(res, raw){
  const heard = `Heard “${cap(raw)}”`;
  if (res.intent === 'qty') return answerQty(res.ing, raw);
  if (res.intent === 'sub') return answerSub(res.ing, raw);
  if (res.intent === 'unknownIng'){
    restoreVolume();
    setVoice('error','Which ingredient?','Try “How much turmeric?”', 5000);
    showOverlay({type:'error', title:'Which ingredient?', sub:'Try “How much turmeric?” or “How much chicken?”'}, 5000);
    return;
  }
  if (res.intent === 'notInRecipe'){
    const txt = `${cap(res.word)} isn’t in this recipe.`;
    setVoice('answering','Answering', `“${txt}”`, 6000);
    showOverlay({type:'answer', big:'Not used', sub:`${cap(res.word)} · not in this recipe`, asked:null}, 6000);
    speak(txt); return;
  }
  const sub = act(res.intent, 'voice') || '';
  restoreVolume();
  setVoice('heard', heard, sub, 2600);
  const spoken = { next: `Step ${S.step+1}. ${R.steps[S.step].title}`, prev: `Step ${S.step+1}. ${R.steps[S.step].title}`, repeat:'Replaying', pause:'Paused', play:'', overview:'', preview: S.step<R.steps.length-1 ? `Next: ${R.steps[S.step+1].title}` : 'This is the last step', timerStart: sub, timerPause: 'Timer paused', timerAdd:'Added one minute', stay:'', goPreview:`Step ${S.step+1}. ${R.steps[S.step].title}`, closeOverview:'' }[res.intent];
  if (spoken) speak(spoken);
}

function stepOfIng(id){
  if (R.steps[S.step].items.includes(id)) return S.step;
  // nearest step using it
  let best=-1, bd=1e9;
  R.steps.forEach((s,i)=>{ if (s.items.includes(id) && Math.abs(i-S.step)<bd){ bd=Math.abs(i-S.step); best=i; } });
  return best;
}
function spokenQty(q, name){
  if (/^(to taste|all|as needed)/i.test(q)) return `${name}, ${q.toLowerCase()}`;
  let t = q.replace(/(\d)\s*–\s*(\d)/g,'$1 to $2').replace('1½','one and a half').replace('½','half').replace('¾','three quarter');
  const plural = !/^(1|half|one|a)\b/i.test(t) || /to \d/.test(t);
  t = t.replace(/\bkg\b/,'kilo').replace(/\btbsp\b/, plural?'tablespoons':'tablespoon').replace(/\btsp\b/, plural?'teaspoons':'teaspoon')
       .replace(/\bcups\b/, 'cups').replace(/\binch\b/, 'inch');
  return `${t} ${name}`;
}
function answerQty(id, raw){
  const g = R.ingredients[id]; const si = stepOfIng(id);
  const inStep = si === S.step;
  const short = g.name.split(',')[0].replace(/\s*\(.*\)/,'');
  let big, sub, say;
  if (g.qty){ big = g.qty; sub = `${short} · Step ${si+1}`; say = spokenQty(g.qty, short.toLowerCase()); }
  else { big = 'Not stated'; sub = `${short} · the video gives no amount`; say = `The video doesn't give an amount for ${short.toLowerCase()}. Add it as needed.`; }
  if (!inStep && si >= 0) { sub = `${short} · used in Step ${si+1}`; }
  restoreVolume();
  setVoice('answering','Answering', `“${say}”`, 6500);
  showOverlay({type:'answer', big, sub, asked: inStep ? id : null}, 6500);
  speak(say);
}
function answerSub(id, raw){
  const g = R.ingredients[id];
  const sb = R.substitutions[id];
  const short = g.name.split(',')[0].replace(/\s*\(.*\)/,'');
  const o = sb ? { type:'sub', kind: sb.kind, text: sb.text, asked: R.steps[S.step].items.includes(id) ? id : null }
               : { type:'sub', kind:'suggestion', text:`No swap noted for ${short.toLowerCase()}. Skipping it changes the flavour — ask someone who cooks if unsure.`, asked:null };
  restoreVolume();
  setVoice('answering','Answering', o.kind==='recipe' ? 'From the recipe' : 'Generated suggestion', 7000);
  showOverlay(o, 7000);
  speak(sb ? sb.spoken : `No swap noted for ${short}.`);
}

/* ---------- Command parser ---------- */
const NOT_INGREDIENTS = ['salt and pepper'];
function findIngredient(text){
  // longest alias wins; ties go to the use in the current step, then the nearest step
  const dist = id => { let d = 99; R.steps.forEach((s,i)=>{ if (s.items.includes(id)) d = Math.min(d, Math.abs(i-S.step) + (i<S.step?0.5:0)); }); return d; };
  let best = null, bestLen = 0, bestD = 1e9;
  for (const [id, g] of Object.entries(R.ingredients)){
    for (const a of g.aliases){
      const re = new RegExp('\\b' + a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b');
      if (re.test(text)){
        const d = dist(id);
        if (a.length > bestLen || (a.length === bestLen && d < bestD)){ best = id; bestLen = a.length; bestD = d; }
      }
    }
  }
  return best;
}
function parse(raw){
  const t = ' ' + raw.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim() + ' ';
  const w = t.trim().split(' ').filter(Boolean);
  const has = re => re.test(t);
  if (!w.length) return null;

  // preview / jump replies
  if (S.overlay && S.overlay.type==='preview' && w.length <= 4 && !has(/\b(back|previous|what)\b/)){
    if (has(/\b(stay|no|cancel|not yet|wait)\b/)) return {intent:'stay'};
    if (has(/\b(go|yes|go ahead|okay|ok|sure|go to step|next)\b/)) return {intent:'goPreview'};
  }
  if (S.overviewOpen && has(/\b(close|hide|done|back)\b/)) return {intent:'closeOverview'};

  // substitutions
  if (has(/\b(don't have|dont have|do not have|haven't got|no more|ran out|out of|instead|substitute|substitution|replace|replacement|without|alternative|swap|use something else)\b/) || has(/^ (no|not) /) || has(/\bnahi hai\b/)){
    const id = findIngredient(t);
    if (id) return {intent:'sub', ing:id};
    if (has(/\b(substitute|replace|instead|alternative|swap)\b/)) return {intent:'unknownIng'};
  }
  // quantities
  if (has(/\b(how much|how many|how mush|quantity|amount|kitna|kitni|kitne|measure|how big)\b/)){
    const id = findIngredient(t);
    if (id) return {intent:'qty', ing:id};
    const m = t.match(/how (?:much|many) (?:of )?(?:the )?([a-z]+)/);
    if (m && !['do','should','i','to','is','time','more','longer','left'].includes(m[1])) return {intent:'notInRecipe', word:m[1]};
    return {intent:'unknownIng'};
  }
  // what's next
  if (has(/\bwhat'?s? next\b|\bwhat is next\b|\bwhat comes next\b|\bwhat next\b|\bnext step kya\b|\bup next\b|\bwhat'?s after\b/)) return {intent:'preview'};
  // timer
  if (has(/\b(start|set|begin|run)\b.*\btimer\b|\btimer (start|on|chalu)\b|\bstart the clock\b/)) return {intent:'timerStart'};
  if (has(/\b(pause|stop|hold)\b.*\btimer\b|\btimer (pause|stop)\b/)) return {intent:'timerPause'};
  if (has(/\b(add|plus|one more|another|extra)\b.*\bminute\b/)) return {intent:'timerAdd'};
  if (has(/\bresume\b.*\btimer\b/)) return {intent:'timerStart'};
  // steps overview
  if (has(/\b(show|open|see|list)\b.*\b(steps|progress|all steps)\b/) || has(/^ (steps|all steps|show steps) $/)) return {intent:'overview'};

  // short commands only (avoid triggers from the recipe video's own speech)
  if (w.length > 4) return null;
  // single words must be exactly the command (noise often transcribes to one stray word)
  const ALIKE = { nest:'next', necks:'next', neck:'next', text:'next', nex:'next', nexxt:'next', paws:'pause', pose:'pause', pours:'pause', pas:'pause', plate:'play', played:'play', blay:'play', ripped:'repeat' };
  if (w.length === 1 && ALIKE[w[0]]) return parse(ALIKE[w[0]]);
  if (w.length === 1 && !/^(next|back|previous|again|repeat|replay|pause|stop|play|resume|continue|aage|peeche|dobara|ruko)$/.test(w[0])) return null;
  if (has(/\b(go back|previous|last step|step back|back|peeche|pichhe|pichla)\b/)) return {intent:'prev'};
  if (has(/\b(again|repeat|replay|once more|one more time|say again|show again|phir se|dobara|dubara)\b/)) return {intent:'repeat'};
  if (has(/\b(next|next step|go next|done|aage|forward|skip|move on|nest|necks|next one)\b/)) return {intent:'next'};
  if (has(/^ (pause|stop|pause it|stop it|pause video|stop video|pause the video|stop the video|hold on|ruko) $/)) return {intent:'pause'};
  if (has(/^ (play|continue|resume|play it|play video|play the video|resume video|go on|carry on|chalo) $/)) return {intent:'play'};
  return null;
}
window.__parse = parse; // exposed for automated tests

/* ---------- Speech output ---------- */
function speak(text){
  if (!text || !('speechSynthesis' in window) || S.mute) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 1.02;
    const v = speechSynthesis.getVoices().find(v=>/en[-_]IN/i.test(v.lang)) || speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang));
    if (v) u.voice = v;
    speaking = true;
    if (S.handsFree && S.engine !== 'offline'){ try{ rec && (rec.onend=null, rec.abort()); }catch(e){} recOn=false; }
    const done = () => { speaking = false; LOCAL.ignoreUntil = Date.now() + 350; if (S.wantPlay && !S.playing) scheduleResume(); if (S.handsFree && S.engine !== 'offline' && cookEl) setTimeout(()=>{ if(S.handsFree && !speaking) startRec(true); }, 200); };
    u.onend = done; u.onerror = done;
    speechSynthesis.speak(u);
    setTimeout(()=>{ if (speaking) done(); }, 8000);
  }catch(e){ speaking=false; }
}
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;

/* ---------- Audio chime ---------- */
let actx = null;
function unlockAudio(){ try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); actx.resume(); }catch(e){} try{ speechSynthesis.getVoices(); }catch(e){} }
function chime(){
  try{
    unlockAudio(); const now = actx.currentTime;
    [0,0.35,0.7].forEach((d,i)=>{ const o=actx.createOscillator(), g=actx.createGain(); o.type='sine'; o.frequency.value = i===2?1046:880;
      g.gain.setValueAtTime(0.0001, now+d); g.gain.exponentialRampToValueAtTime(0.5, now+d+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+d+0.3);
      o.connect(g).connect(actx.destination); o.start(now+d); o.stop(now+d+0.32); });
  }catch(e){}
}

/* ---------- Wake lock ---------- */
let wake = null;
async function requestWake(){ try{ if ('wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); }catch(e){} }
function releaseWake(){ try{ wake && wake.release(); }catch(e){} wake = null; }
document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState==='visible' && cookEl && !cookEl.style.visibility) requestWake(); });

function stopEverything(){ localStop(); stopRec(); S.handsFree=false; releaseWake(); destroyCook(); try{speechSynthesis.cancel();}catch(e){} restoreVolume(); }

/* ---------- Orientation ---------- */
let lastLand = null;
function onResize(){
  if (!cookEl) return;
  const land = window.matchMedia('(orientation:landscape) and (max-height:560px)').matches;
  if (land !== lastLand){ lastLand = land; if (S.overlay && S.overlay.type==='hint') S.overlay=null; if (land) log('rotate','landscape','touch'); else log('rotate','portrait','touch'); render(); if (S.overviewOpen) drawOverview(); }
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', ()=>setTimeout(onResize, 200));

/* ---------- Keyboard (facilitator on a laptop) ---------- */
document.addEventListener('keydown', (e)=>{
  if (!cookEl || e.target.tagName==='TEXTAREA' || e.target.tagName==='INPUT') return;
  const k = e.key.toLowerCase();
  const map = { arrowright:'next', n:'next', arrowleft:'prev', p:'prev', r:'repeat', s:'overview', t:'timerStart', w:'preview' };
  if (k === ' ') { e.preventDefault(); act(S.playing?'pause':'play','keyboard'); }
  else if (map[k]) act(map[k], 'keyboard');
  else if (k === 'h') toggleHandsFree();
  else if (k === 'v') listenOnce();
  else if (k === 'l') openFacilitator();
});

/* ---------- Loop ---------- */
setInterval(()=>{ if (cookEl){ tickPlayer(); tickTimers(); } }, 250);

/* ================================================================
   FACILITATOR PANEL (triple-tap "Step n of N" or press L)
   ================================================================ */
let taps = [];
document.addEventListener('click', (e)=>{
  if (!e.target.closest('#stepLbl, #lStepLbl')) return;
  const now = Date.now(); taps = taps.filter(t=>now-t<700); taps.push(now);
  if (taps.length >= 3){ taps=[]; openFacilitator(); }
});
function summary(){
  const ev = LOG.events, c = (f)=>ev.filter(f).length;
  return {
    touchActions: c(e=>e.type==='action'&&e.via==='touch'),
    voiceActions: c(e=>e.type==='voice_command'),
    voiceNotUnderstood: c(e=>e.type==='voice_unmatched'&&e.via==='voice'),
    ignoredSpeech: c(e=>e.type==='voice_unmatched'&&e.via==='ignored'),
    repeats: c(e=>e.type==='action'&&e.detail==='repeat'),
    questions: c(e=>e.type==='voice_command'&&/→ (qty|sub)/.test(e.detail)),
    videoFailures: c(e=>e.type==='video_unavailable')
  };
}
function openFacilitator(){
  const s = summary();
  const d = document.createElement('div'); d.className='fac';
  const lines = LOG.events.map(e=>`${new Date(e.t).toLocaleTimeString()}\tS${e.step}\t${e.via||'-'}\t${e.type}\t${e.detail}`).join('\n');
  d.innerHTML = `<h3>Facilitator panel</h3>
    <p>Session log for usability testing. Prototype notes: the YouTube page, share sheet and “preparing” stages are simulated; the recipe and answers were prepared manually from the video. Video playback, step clips, voice recognition, timers and layouts are real. Step times: <b>${R.marksSource}</b>. Voice engine: <b>${S.engine||'not started'}</b>${LOCAL.failed?' (offline model unavailable — using browser speech)':''}.</p>
    <table>${Object.entries(s).map(([k,v])=>`<tr><td>${k.replace(/([A-Z])/g,' $1').toLowerCase()}</td><td style="text-align:right"><b>${v}</b></td></tr>`).join('')}
      <tr><td>session length</td><td style="text-align:right"><b>${Math.round((Date.now()-LOG.t0)/60000)} min</b></td></tr></table>
    <textarea readonly>${esc(lines)}</textarea>
    <button class="btn primary" id="facCopy">Copy log</button>
    <button class="btn secondary" id="facReset">Reset log (new participant)</button>
    <button class="btn secondary" id="facMute">Spoken replies: ${S.mute?'Off':'On'}</button>
    <button class="btn secondary" id="facMark">Set step times (mark mode)</button>
    <button class="btn tertiary" id="facClose">Close</button>`;
  document.body.appendChild(d);
  $('#facCopy',d).onclick = ()=>{ copy(`${JSON.stringify(s)}\n${lines}`); $('#facCopy',d).textContent='Copied'; };
  $('#facReset',d).onclick = ()=>{ LOG.events=[]; LOG.t0=Date.now(); d.remove(); };
  $('#facMute',d).onclick = ()=>{ S.mute = !S.mute; try{localStorage.setItem('ca_mute', S.mute?'1':'0');}catch(e){} $('#facMute',d).textContent = 'Spoken replies: '+(S.mute?'Off':'On'); };
  $('#facMark',d).onclick = ()=>{ location.href = location.pathname + '?mark'; };
  $('#facClose',d).onclick = ()=> d.remove();
}
function copy(txt){ try{ navigator.clipboard.writeText(txt); }catch(e){ const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } }

/* ================================================================
   MARK MODE (?mark) — set step start times by watching the video
   ================================================================ */
function markMode(){
  let marks = R.steps.map(s=>s.t[0]).concat([R.steps[R.steps.length-1].t[1]]);
  let k = 0, mp = null;
  app.innerHTML = `<div class="fac" style="padding-top:12px">
    <h3>Set step times</h3>
    <p>Play the video. Tap <b>Mark</b> the moment each step starts. The last mark is where the final step ends. Tap any row to select it and re-mark it.</p>
    <div style="position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#2a2725;margin-top:12px"><div id="mk"></div></div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn secondary" id="mkBack" style="width:90px">−5 s</button>
      <button class="btn primary" id="mkBtn" style="flex:1"></button>
      <button class="btn secondary" id="mkFwd" style="width:90px">+5 s</button></div>
    <div class="mark-list" id="mkList"></div>
    <button class="btn primary" id="mkSave">Save on this phone & open app</button>
    <button class="btn secondary" id="mkCopy">Copy times to send</button>
    <p id="mkCode" style="word-break:break-all"></p>
  </div>`;
  const labels = R.steps.map((s,i)=>`Step ${i+1} · ${s.title}`).concat(['End of last step']);
  const draw = () => {
    $('#mkBtn').textContent = k < labels.length ? `Mark: ${labels[k].replace(/^Step \d+ · /,'Start of ')}` : 'All marked';
    $('#mkList').innerHTML = labels.map((l,i)=>`<div class="mrow ${i===k?'cur':''}" data-i="${i}"><b>${i<R.steps.length?i+1:'⏹'}</b><span>${esc(l.replace(/^Step \d+ · /,''))}</span><code>${fmt(marks[i])}</code></div>`).join('');
    document.querySelectorAll('.mrow').forEach(r=>r.onclick=()=>{ k=+r.dataset.i; if (mp && mp.seekTo) mp.seekTo(marks[k],true); draw(); });
    $('#mkCode').textContent = 'marks=' + marks.map(m=>Math.round(m)).join(',');
  };
  draw();
  loadYT().then(()=>{ mp = new YT.Player('mk', { videoId:R.id, width:'100%', height:'100%', playerVars:{playsinline:1, rel:0, modestbranding:1} }); });
  const now = () => (mp && mp.getCurrentTime) ? mp.getCurrentTime() : 0;
  $('#mkBtn').onclick = () => { if (k>=labels.length) return; marks[k] = Math.round(now()); k++; draw(); };
  $('#mkBack').onclick = () => mp && mp.seekTo(Math.max(0, now()-5), true);
  $('#mkFwd').onclick = () => mp && mp.seekTo(now()+5, true);
  $('#mkSave').onclick = () => {
    for (let i=1;i<marks.length;i++) if (marks[i] <= marks[i-1]) { alert(`Times must increase — check "${labels[i]}".`); return; }
    try{ localStorage.setItem('ca_marks', JSON.stringify(marks.map(m=>Math.round(m)))); }catch(e){}
    location.href = location.pathname;
  };
  $('#mkCopy').onclick = () => { copy('marks=' + marks.map(m=>Math.round(m)).join(',')); $('#mkCopy').textContent = 'Copied — paste it to Claude'; };
}

/* ---------- Boot ---------- */
if (new URLSearchParams(location.search).has('mark')) markMode();
else showSource();
})();

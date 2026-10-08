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

/* ---------------- Icons ---------------- */
const P = {
  close:'<path d="M5 5l10 10M15 5L5 15"/>',
  list:'<path d="M7 6h10M7 10h10M7 14h10M3.5 6h.01M3.5 10h.01M3.5 14h.01"/>',
  back:'<path d="M17 10H4M9 4.5L3.5 10 9 15.5"/>',
  fwd:'<path d="M3 10h13M11 4.5l5.5 5.5-5.5 5.5"/>',
  chev:'<path d="M8 4.5l5.5 5.5L8 15.5"/>',
  replay:'<path d="M5 6.7C2.1 10 4.2 15.8 10 15.8c4.2 0 6.7-3.3 6.7-6.3 0-3.3-2.9-5.8-6.3-5.8-2.1 0-3.7.8-5.4 3z"/><path d="M5 2.5v4.2h4.2"/>',
  mic:'<rect x="7" y="2.5" width="6" height="10" rx="3"/><path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5"/>',
  micoff:'<path d="M3 3l14 14M7.2 7.2V9.5a2.8 2.8 0 004.6 2.1M13 9.4V5.5a3 3 0 00-5.6-1.5M4.5 9.5a5.5 5.5 0 008.7 4.5M15.3 11.3a5.5 5.5 0 00.2-1.8M10 15v2.5"/>',
  check:'<path d="M4 10.5l4 4 8-9"/>',
  ccheck:'<circle cx="10" cy="10" r="8" fill="currentColor" stroke="none"/><path d="M6.3 10.3l2.6 2.6 4.8-5.3" stroke="#fff"/>',
  radio:'<circle cx="10" cy="10" r="7.5"/>',
  radioon:'<circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="3.6" fill="currentColor"/>',
  play:'<path d="M6 4l10 6-10 6z" fill="currentColor"/>',
  pause:'<path d="M6.5 4v12M13.5 4v12" stroke-width="2.6"/>',
  timer:'<circle cx="10" cy="11" r="6.5"/><path d="M10 7.5V11l2 1.5M8 2.5h4"/>',
  volume:'<path d="M3 7.5v5h3l4.5 3.5v-12L6 7.5H3z"/><path d="M13.5 7a4 4 0 010 6M15.8 4.8a7 7 0 010 10.4"/>',
  book:'<path d="M3 4.5c2.5-1 5-1 7 .5 2-1.5 4.5-1.5 7-.5v11c-2.5-1-5-1-7 .5-2-1.5-4.5-1.5-7-.5z"/><path d="M10 5v11"/>',
  bulb:'<path d="M7 14.5h6M8 17.5h4M10 2.5a5 5 0 00-3 9c.7.6 1 1.2 1 2h4c0-.8.3-1.4 1-2a5 5 0 00-3-9z"/>',
  hear:'<path d="M6 8a4 4 0 118 0c0 2.4-2.5 3-2.5 5.5a2.5 2.5 0 01-4.8 1"/><path d="M14.5 15l2.5 2.5M17 15l-2.5 2.5"/>',
  voice:'<path d="M3 10h1.5M6.5 6v8M10 3.5v13M13.5 6v8M16.5 10H17"/>',
  off:'<path d="M3 3l14 14M8 5h6.5a2 2 0 012 2v6M15.5 15.5H5a2 2 0 01-2-2V7a2 2 0 011.5-1.9"/>',
  rotate:'<rect x="4" y="2.5" width="8" height="15" rx="2"/><path d="M14.5 6.5a4.5 4.5 0 013 4.2M17.5 8.5v2.2h-2.2"/>',
  lock:'<rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 016 0V9"/>',
  share:'<path d="M12 4l5 5-5 5M17 9H9a5 5 0 00-5 5v1.5"/>',
  like:'<path d="M6 9v8H3V9h3zM6 9l3.5-6.5c1.2 0 2 1 1.8 2.2L10.8 8H16a1.5 1.5 0 011.5 1.8l-1.2 5.8A2 2 0 0114.3 17H6"/>',
  save:'<path d="M5.5 3h9v14l-4.5-3-4.5 3z"/>',
  dots:'<path d="M5 10h.01M10 10h.01M15 10h.01" stroke-width="3"/>',
  home:'<path d="M3 9l7-6 7 6v8h-4.5v-5h-5v5H3z"/>',
  plus:'<circle cx="10" cy="10" r="7.5"/><path d="M10 6.5v7M6.5 10h7"/>',
  skillet:'<circle cx="8.5" cy="11" r="5.5"/><path d="M14 11h4.5"/>',
  arrowR:'<path d="M3 10h13M11 4.5l5.5 5.5-5.5 5.5"/>'
};
function ic(name, size=20, color='currentColor', sw=1.7){
  return `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]||''}</svg>`;
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
  segEnd: null, segLabel: null, playing: false, landscape: false
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
        <div class="bigplay">${ic('play',22,'#fff')}</div>
        <div class="ytp-meta"><span>${esc(R.creator)}</span><span>YouTube</span></div>
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
      <div>${ic('home',22)}Home</div><div>${ic('play',22)}Shorts</div><div>${ic('plus',28)}</div><div>${ic('save',22)}Subscriptions</div><div><span class="avatar" style="width:24px;height:24px;font-size:9px">You</span>You</div>
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
      ? `<button class="target ca" data-act="ca"><div class="ic">${ic('skillet',26,'#fff',2)}</div>Cooking Assist</button>`
      : `<div class="target dim"><div class="ic" style="background:${a[1]}">${a[2]}</div>${a[0]}</div>`).join('')}</div>
    <div class="share-row">${apps.slice(4).map(a=>`<div class="target dim"><div class="ic" style="background:${a[1]}">${a[2]}</div>${a[0]}</div>`).join('')}</div>
  </div>`;
  $('#sheetHost [data-act=close]').onclick = () => $('#sheetHost').innerHTML='';
  $('#sheetHost [data-act=ca]').onclick = () => { log('share_target','Cooking Assist','touch'); openActivation(); };
}

function sourceCard(){
  return `<div class="source-card"><div class="th" style="background-image:url('${thumbURL}')"></div>
    <div><b>${esc(R.title)}</b><small>${ic('play',11,'#545b57')}${R.platform}</small><small style="margin-top:2px">${esc(R.creator)}</small></div></div>`;
}
function sheetHead(){ return `<div class="grab"></div><div class="sheet-head"><span class="appicon">${ic('skillet',16,'#fff',2)}</span>Cooking Assist</div>`; }

function openActivation(){
  $('#sheetHost').innerHTML = `<div class="scrim" data-act="cancel"></div>
  <div class="sheet" id="actSheet">${sheetHead()}${sourceCard()}
    <h2>Cook this recipe?</h2>
    <p class="lead">Cooking Assist turns this recipe into steps you can follow at your pace.</p>
    <button class="btn primary" data-act="start">Start Cooking Assist</button>
    <button class="btn tertiary" data-act="cancel">Cancel</button>
  </div>`;
  document.querySelectorAll('#sheetHost [data-act=cancel]').forEach(b=>b.onclick=()=>{ log('activation_cancel','','touch'); $('#sheetHost').innerHTML=''; });
  $('#sheetHost [data-act=start]').onclick = () => { log('activation_start','','touch'); unlockAudio(); buildCook(true); preparing(); };
}

function preparing(){
  const sh = $('#actSheet');
  const nIng = Object.keys(R.ingredients).length, nSt = R.steps.length;
  const stages = [['Finding ingredients', `${nIng} found`],['Organising steps', `${nSt} steps`],['Matching video moments','']];
  let k = 0;
  const draw = () => {
    sh.innerHTML = `${sheetHead()}${sourceCard()}
      <h2 style="font-size:24px;line-height:28px">Getting your recipe ready…</h2>
      <div style="margin-top:12px">${stages.map((s,i)=>`<div class="stage ${i<k?'':'work'} ${i>k?'todo':''}">
        ${i<k?ic('ccheck',22,'#245c45'):'<div class="spin"></div>'}<span>${s[0]}</span><em>${i<k?s[1]:(i===k?'Working':'')}</em></div>`).join('')}</div>
      <button class="btn tertiary" data-act="cancel">Cancel</button>`;
    $('[data-act=cancel]',sh).onclick = () => { clearTimeout(tm); $('#sheetHost').innerHTML=''; destroyCook(); };
  };
  draw();
  let tm = setTimeout(function step(){ k++; if (k<3){ draw(); tm=setTimeout(step, 900);} else ready(); }, 900);
}

function ready(){
  const sh = $('#actSheet');
  sh.innerHTML = `${sheetHead()}${sourceCard()}
    <div class="okdot">${ic('check',22,'#245c45',2.2)}</div>
    <h2 style="margin-top:10px">${R.steps.length} steps ready</h2>
    <p class="lead">Takes about ${R.aboutMin} min. Each step links to its part of the video.</p>
    <button class="btn primary" data-act="go">Start cooking ${ic('chev',20,'#fff',2)}</button>
    <button class="btn tertiary" data-act="review">${ic('list',20,'#245c45')}Review steps</button>`;
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
      <button class="tb-btn" data-act="exit">${ic('close',20)}Exit</button>
      <div class="lprog"><b id="lStepLbl"></b><div class="segs" id="lSegs"></div></div>
      <div id="lChip"></div>
      <div class="lt">${esc(R.title)}</div>
      <div id="vpillHost"></div>
      <button class="tb-btn" data-act="steps">${ic('list',20)}Steps</button>
    </div>
    <div class="topbar">
      <button class="tb-btn" data-act="exit">${ic('close',20)}Exit</button>
      <div class="ttl" id="ttl">${esc(R.title)}</div>
      <button class="tb-btn r" data-act="steps">${ic('list',20)}Steps</button>
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
            <div class="pmeta"><div class="row"><span>${ic('play',11,'#fff')}YouTube · ${esc(R.creator)}</span><span id="ptime">00:00 / --:--</span></div>
              <div class="ptl"><div class="bg"></div><div class="played" id="pplayed"></div><div class="seg" id="pseg"></div><div class="thumb" id="pthumb"></div></div></div>
            <div id="plabel"></div>
            <div id="pcenter"></div>
            <div id="unavail"></div>
          </div>
          <div class="ovl" id="ovl"></div>
        </div>
        <div class="lstep" id="lstep"></div>
        <div class="ltl" id="ltl"><div class="bg"></div><div class="seg" id="lseg"></div><div class="thumb" id="lthumb"></div></div>
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
    lb.innerHTML = st.type==='time' ? `<div class="lt-title"><div class="step-h">${esc(st.title)}</div><div class="step-d">${esc(st.short)}</div></div>` : '';
    rb.innerHTML = bodyHTML(st, true);
    $('#rctrls',cookEl).innerHTML = ctrlsHTML();
    $('#pctrls',cookEl).innerHTML = '';
  } else {
    lb.innerHTML = bodyHTML(st, false);
    rb.innerHTML = ''; $('#rctrls',cookEl).innerHTML = '';
    $('#pctrls',cookEl).innerHTML = ctrlsHTML();
  }
  // landscape "this step in the video"
  $('#lstep',cookEl).innerHTML = `<span>${ic('play',11)}This step in the video</span><span>${fmt(st.t[0])} – ${fmt(st.t[1])}</span>`;
  renderVoice();
  renderPlayerMeta();
  renderUnavail();
  renderOverlay();
}

function ingRows(st, askedId){
  if (!st.items.length) return '';
  return `<div class="ings">${st.items.map(id=>{
    const g = R.ingredients[id];
    const q = g.qty ? `<span class="q">${esc(g.qty)}</span>` : `<span class="q na">As needed</span>`;
    return `<div class="ing ${askedId===id?'asked':''}" data-ing="${id}">${q}<span class="n">${esc(g.name)}</span>${askedId===id?`<span class="asked-tag">${ic('voice',14,'#7a3e00')}Asked</span>`:''}</div>`;
  }).join('')}</div>`;
}

function bodyHTML(st, land){
  const asked = S.overlay && S.overlay.asked;
  if (st.type === 'ingredient'){
    return `<div class="body"><div class="step-h">${esc(st.title)}</div>
      <div class="step-d">${esc(land?st.short:st.instruction)}</div>
      ${ingRows(st, asked)}
      ${st.note?`<div class="rnote"><span class="chip recipe">${ic('book',13,'#0f3324')}From recipe</span><span>${esc(st.note.text)}</span></div>`:''}
      ${segRangeHTML()}</div>`;
  }
  if (st.type === 'technique'){
    const rep = `<button class="replay-btn" data-act="repeat" ${land?'style="width:100%;justify-content:center;margin-top:16px"':''}>${ic('replay',20,'#0f3324',1.8)}Replay this moment</button>`;
    if (land) return `<div class="body"><div class="step-h">${esc(st.title)}</div><div class="step-d">${esc(st.instruction)}</div>${rep}${ingRows(st, asked)}${segRangeHTML()}</div>`;
    return `<div class="replay-row"><div><small>In the video</small><b>${fmt(st.t[0])} – ${fmt(st.t[1])}</b></div>${rep}</div>
      <div class="body"><div class="step-h">${esc(st.title)}</div><div class="step-d">${esc(st.instruction)}</div>${asked?ingRows(st, asked):''}${segRangeHTML()}</div>`;
  }
  // time
  const watch = (!land && !S.watching) ? `<button class="watch" data-act="watch"><span class="wt" style="background-image:url('${thumbURL}')"><i>${ic('play',12,'#1d211f')}</i></span><div><b>Watch this step</b><small>YouTube · ${fmt(st.t[0])} – ${fmt(st.t[1])}</small></div>${ic('chev',20,'#545b57')}</button>` : '';
  return `${watch}<div class="body">${land?'':`<div class="step-h">${esc(st.title)}</div><div class="step-d">${esc(st.instruction)}</div>`}${timerHTML(S.step, st)}</div>`;
}

function segRangeHTML(){
  if (S.segLabel && R.steps[S.step].type!=='time')
    return `<div class="seg-range"><b>Plays ${fmt(R.steps[S.step].t[0])} → ${fmt(R.steps[S.step].t[1])}, then stops</b><span>No scrubbing</span></div>`;
  return '';
}

function ctrlsHTML(){
  const last = S.step === R.steps.length-1;
  return `<div class="ctrls">
    <button class="ctrl prev" data-act="prev" ${S.step===0?'disabled':''} aria-label="Previous step">${ic('back',22,'currentColor',1.8)}Previous</button>
    <button class="ctrl rep" data-act="repeat" aria-label="Repeat this step's video">${ic('replay',22,'#0f3324',1.8)}Repeat</button>
    <button class="ctrl next" data-act="next">${last?'Finish':'Next'} ${ic(last?'check':'chev',22,'#fff',2)}</button>
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
  const icColor = (v==='on'||v==='heard'||v==='listening') ? '#fff' : (v==='error' ? '#b23a2e' : (v==='answering'?'#245c45':'#545b57'));
  const right = v==='listening' ? `<span class="wave"><i></i><i></i><i></i><i></i><i></i></span>`
              : v==='error' ? `<span class="retry" data-act="retryVoice">Try again</span>` : '';
  const live = v==='on' ? '<span class="live"></span>' : '';
  $('#vbarHost',cookEl).innerHTML = `<div class="vbar">
    <button class="vstat ${v}" data-act="speak" aria-live="polite"><span class="mb">${ic(m[2],20,icColor)}${live}</span>
      <span class="tx"><b>${esc(title)}</b><small>${esc(sub)}</small></span>${right}</button>
    <button class="hfsw ${S.handsFree?'on':''}" data-act="hf" role="switch" aria-checked="${S.handsFree}" ${!SR?'disabled':''}><span class="sw"></span>Hands-free</button></div>`;
  $('#vpillHost',cookEl).innerHTML = `<button class="vpill ${v}" data-act="speak"><span class="mb">${ic(m[2],16,icColor)}</span>
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
  const dur = (player && S.playerReady && player.getDuration && player.getDuration()) || Math.max(st.t[1], R.steps[R.steps.length-1].t[1]);
  const cur = (player && S.playerReady && player.getCurrentTime && player.getCurrentTime()) || st.t[0];
  $('#ptime',cookEl).textContent = `${fmt(cur)} / ${fmt(dur)}`;
  const pct = x => (100*Math.min(1,Math.max(0,x/dur)))+'%';
  $('#pplayed',cookEl).style.width = pct(cur);
  const sg = $('#pseg',cookEl); sg.style.left = pct(st.t[0]); sg.style.width = `calc(${pct(st.t[1])} - ${pct(st.t[0])})`;
  $('#pthumb',cookEl).style.left = pct(cur);
  const ls = $('#lseg',cookEl); ls.style.left = pct(st.t[0]); ls.style.width = `calc(${pct(st.t[1])} - ${pct(st.t[0])})`;
  $('#lthumb',cookEl).style.left = pct(cur);
  $('#plabel',cookEl).innerHTML = S.ducked ? `<div class="plabel">${ic('volume',14,'#fff')}Recipe audio lowered</div>`
    : (S.segLabel ? `<div class="plabel">${ic('replay',14,'#fff',1.8)}${esc(S.segLabel)}</div>` : '');
  $('#pcenter',cookEl).innerHTML = (S.playerReady && !S.playing && S.videoOk) ? `<div class="pcenter">${ic('play',26,'#fff')}</div>` : '';
}
function renderUnavail(){
  if (!cookEl) return;
  $('#unavail',cookEl).innerHTML = S.videoOk ? '' : `<div class="unavail">${ic('off',28,'#545b57')}<b>Video unavailable</b><small>The step still works without it.</small><button class="btn secondary" data-act="retryVideo">Retry</button></div>`;
}

/* ---------- Timer ---------- */
function timerHTML(i, st){
  const T = S.timers[i];
  const total = st.timer;
  if (!T || (!T.running && !T.done && T.remaining===T.total && !T.paused)){
    return `<div class="timer idle"><div class="tt"><span>${ic('timer',16,'#7a3e00')}Timer ready</span></div>
      <div class="big">${fmt(total)}</div>
      <button class="btn accent" data-act="timerStart">${ic('play',16,'#1d211f')}Start timer</button>
      <div class="say">or say “Start the timer”</div></div>`;
  }
  if (T.done){
    return `<div class="timer done"><div class="tt"><span>${ic('timer',16,'#7a3e00')}${esc(st.timerLabel)} timer</span><span><i class="dot"></i>Done</span></div>
      <div class="big">00:00</div><div class="rem">Time’s up — check the pot</div>
      <div class="acts"><button class="btn secondary" data-act="timerAdd">+ 1 min</button><button class="btn secondary" data-act="next">Next step</button></div></div>`;
  }
  const rem = T.running ? (T.endAt - Date.now())/1000 : T.remaining;
  return `<div class="timer run"><div class="tt"><span>${ic('timer',16,'#7a3e00')}${esc(st.timerLabel)} timer</span><span><i class="dot"></i>${T.running?'Running':'Paused'}</span></div>
    <div class="big" id="tbig">${fmt(Math.ceil(rem))}</div><div class="rem">remaining</div>
    <div class="bar"><i id="tbar" style="width:${100*rem/T.total}%"></i></div>
    <div class="acts">${T.running
      ? `<button class="btn secondary" data-act="timerPause">${ic('pause',18)}Pause timer</button>`
      : `<button class="btn secondary" data-act="timerStart">${ic('play',16)}Resume</button>`}
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
    html = `<button class="timer-chip" data-act="chip" data-arg="${i}">${ic('timer',15,'#7a3e00')}${esc(st.timerLabel)} ${T.done?'done':fmt(Math.ceil(rem))}</button>`;
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
  let h = '';
  if (o.type === 'answer'){
    h = `<div class="card"><div class="ans-top"><span class="chip recipe">${ic('book',13,'#0f3324')}From recipe</span><span class="spk">${ic('volume',14,'#545b57')}Spoken</span></div>
      <div class="ans-main"><b class="${o.big.length>8?'txt':''}">${esc(o.big)}</b><span>${esc(o.sub)}</span></div>${bar}</div>`;
  } else if (o.type === 'sub'){
    h = o.kind === 'recipe'
      ? `<div class="card rec"><div class="ans-top"><span class="chip recipe">${ic('book',13,'#0f3324')}From recipe</span><span class="spk">${ic('volume',14,'#545b57')}Spoken</span></div><p>${esc(o.text)}</p>${bar}</div>`
      : `<div class="card sugg"><div class="ans-top"><span class="chip sugg">${ic('bulb',13,'#263f5c')}Cooking suggestion</span><span class="nf">Not from the original recipe</span></div><p>${esc(o.text)}</p>${bar}</div>`;
  } else if (o.type === 'preview'){
    const n = R.steps[S.step+1];
    h = n ? `<div class="card"><span class="chip next">${ic('arrowR',13,'#545b57')}Up next · Step ${S.step+2}</span>
      <div class="next-t">${esc(n.title)} — ${esc(n.short)}</div>
      <div class="two"><button class="btn secondary sm" data-act="stay">Stay here</button><button class="btn primary sm" data-act="goPreview">Go to Step ${S.step+2}</button></div></div>`
      : `<div class="card"><span class="chip next">${ic('check',13,'#545b57')}Last step</span><div class="next-t">This is the final step. Say “Next” or tap Finish when you’re done.</div>${bar}</div>`;
  } else if (o.type === 'error'){
    h = `<div class="card err"><div class="err-row"><span class="err-ic">${ic('hear',18,'#b23a2e')}</span><div><b>${esc(o.title||'I didn’t catch that.')}</b><small>${esc(o.sub||'Try “Next”, “Again” or “How much…?”')}</small></div></div>
      <button class="btn dark" data-act="retryVoice">${ic('mic',18,'#fff')}Try again</button></div>`;
  } else if (o.type === 'toast'){
    h = `<div class="toast"><span class="ti">${ic(o.icon,20,'#fff')}</span><div><b>${esc(o.title)}</b><small>${esc(o.sub)}</small></div></div>`;
  } else if (o.type === 'hint'){
    h = `<div class="hint"><div class="hint-row"><span class="hint-ic">${ic('rotate',20,'#245c45')}</span><div><b>Want more room?</b><small>Turn your phone for a bigger cooking view.</small></div></div>
      <div class="two"><button class="btn secondary" data-act="hintKeep">Keep portrait</button><button class="btn primary" data-act="hintGo">Got it</button></div></div>`;
  } else if (o.type === 'timerdone'){
    const st = R.steps[o.step];
    h = `<div class="card" style="border:2px solid var(--amber)"><span class="chip" style="background:var(--amber-bg);color:var(--amber-ink)">${ic('timer',13,'#7a3e00')}${esc(st.timerLabel)} timer</span>
      <div class="next-t">Time’s up for Step ${o.step+1}.</div>
      <div class="two"><button class="btn secondary sm" data-act="dismiss">OK</button><button class="btn primary sm" data-act="chip" data-arg="${o.step}">Go to Step ${o.step+1}</button></div></div>`;
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
  $('#cookSheet',cookEl).innerHTML = `<div class="scrim"></div><div class="sheet" style="padding-top:32px"><div class="grab"></div>
    <div class="okdot" style="width:44px;height:44px;border-radius:22px;margin:0">${ic('mic',22,'#245c45')}</div>
    <h2 style="font-size:26px;line-height:30px;margin-top:14px">Cook hands-free?</h2>
    <p class="lead">Control your recipe with your voice, so your hands can stay on the pan.</p>
    <div style="display:flex;gap:10px;align-items:flex-start;background:#f1efea;border-radius:12px;padding:12px 14px;margin-top:14px;font-size:12.5px;font-weight:500;color:#545b57;line-height:16px">${ic('lock',16,'#545b57')}The mic listens only while hands-free is on. Turn it off any time.</div>
    <button class="btn primary" data-act="hfYes" style="margin-top:16px">${ic('mic',20,'#fff')}Turn on hands-free</button>
    <button class="btn tertiary" data-act="hfNo">Not now</button>
    <p style="font-size:12px;color:#545b57;margin-top:6px;line-height:16px">Not now keeps Tap to speak. The system mic permission appears only after you turn hands-free on.</p></div>`;
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
    const icn = i<S.step ? ic('ccheck',22,'#245c45') : (i===S.step ? ic('radioon',22,'#245c45') : ic('radio',22,'#c9c5bc'));
    const tag = i<S.step ? 'Done' : (i===S.step?'Now':'');
    let row = `<button class="srow ${cls}" data-ov="${i}">${icn}<span class="nu">${i+1}</span><span class="st">${esc(s.title)}</span><span class="tag">${tag}</span></button>`;
    if (S.jumpTarget === i){
      row += `<div class="jump"><b>Jump to Step ${i+1}: ${esc(s.title)}?</b><small>Steps ${S.step+2}–${i} aren’t done yet.</small>
        <div class="two"><button class="btn secondary sm" data-ovact="cancel">Cancel</button><button class="btn dark sm" data-ovact="jump">Jump to Step ${i+1}</button></div></div>`;
    }
    return row;
  }).join('');
  $('#cookSheet',cookEl).innerHTML = `<div class="scrim" data-ovact="close"></div><div class="sheet ov" style="padding:24px 16px calc(16px + var(--safe-b))"><div class="grab"></div>
    <div class="ov-head"><div><b>Cooking progress</b><small>Step ${S.step+1} of ${N} · about ${leftMin} min left</small></div>
    <button class="ov-close" data-ovact="close">${ic('close',16)}Close</button></div>
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
    <div class="segs" style="margin-top:16px">${R.steps.map((_,i)=>`<i class="${i===N-1?'cur':'done'}"></i>`).join('')}</div>
    <div class="done-check">${ic('check',30,'#245c45',2.2)}</div>
    <h1>Done.</h1><div class="sub">${esc(R.title)} complete</div>
    <div class="stats"><div><b>${N} of ${N}</b><small>steps completed</small></div><div style="border-left:1px solid var(--line)"><b>${mins} min</b><small>cooking time</small></div></div>
    <div class="sp"></div>
    <button class="btn primary" id="finBtn">Finish Cooking</button>
    <a class="btn secondary" id="retBtn" href="https://youtu.be/${R.id}?t=${resumeAt}" target="_blank" rel="noopener" style="text-decoration:none">${ic('back',20)}Return to YouTube</a>
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
      playerVars: { controls:0, disablekb:1, playsinline:1, rel:0, modestbranding:1, fs:0, iv_load_policy:3, start: Math.floor(R.steps[0].t[0]), origin: location.origin },
      events: {
        onReady: () => { S.playerReady = true; S.videoOk = true; clearTimeout(readyTimeout); renderUnavail();
          if (pendingPlay !== null) { const p = pendingPlay; pendingPlay = null; seekTo(p.t); if (p.play) playVideo(); } renderPlayerMeta(); },
        onStateChange: (e) => { S.playing = (e.data === 1 || e.data === 3); if (e.data===1) S.everPlayed = true; renderPlayerMeta(); },
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
function seekTo(t){ if (player && S.playerReady) player.seekTo(t, true); else pendingPlay = {t, play:false}; }
function playVideo(){ if (player && S.playerReady) player.playVideo(); else pendingPlay = {t:R.steps[S.step].t[0], play:true}; }
function pauseVideo(){ if (player && S.playerReady && player.pauseVideo) player.pauseVideo(); if (pendingPlay) pendingPlay.play=false; }
function playSegment(isRepeat){
  const st = R.steps[S.step];
  S.segEnd = st.t[1];
  if (player && S.playerReady){ player.seekTo(st.t[0], true); player.playVideo(); }
  else pendingPlay = {t: st.t[0], play: true};
  if (isRepeat) log('replay_segment', `${fmt(st.t[0])}-${fmt(st.t[1])}`, '');
}
function tickPlayer(){
  if (!player || !S.playerReady || !player.getCurrentTime) return;
  const t = player.getCurrentTime();
  if (S.segEnd !== null && S.playing && t >= S.segEnd - 0.15){
    player.pauseVideo(); S.segEnd = null;
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
  if (on){ setVoice('on'); startRec(true); }
  else { stopRec(); restoreVolume(); setVoice('off'); }
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
    if (S.handsFree && !speaking) restartT = setTimeout(()=>{ if (S.handsFree && !speaking && cookEl) startRec(true); }, 250);
  };
  try { rec.start(); recOn = true; } catch(e){ recOn = false; }
}
function stopRec(){ clearTimeout(restartT); oneShot=false; try{ if (rec){ rec.onend=null; rec.abort(); } }catch(e){} recOn=false; }

const KEYWORDS = /\b(next|back|previous|again|repeat|replay|pause|play|stop|wait|resume|continue|steps?|timer|minute|how|what|much|many|substitute|instead|have|go|stay|aage|peeche|dobara|ruko|kitna|kitni)\b/;
function onResult(e){
  let interim = '', finals = [];
  for (let i = e.resultIndex; i < e.results.length; i++){
    const r = e.results[i];
    if (r.isFinal){ const alts=[]; for (let j=0;j<r.length;j++) alts.push(r[j].transcript.trim()); finals.push(alts); }
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
  if (has(/\b(go back|previous|last step|step back|back|peeche|pichhe|pichla)\b/)) return {intent:'prev'};
  if (has(/\b(again|repeat|replay|once more|one more time|say again|show again|phir se|dobara|dubara)\b/)) return {intent:'repeat'};
  if (has(/\b(next|next step|go next|done|aage|forward|skip|move on|nest|necks)\b/)) return {intent:'next'};
  if (has(/\b(pause|stop|wait|hold on|hold|ruko|freeze)\b/)) return {intent:'pause'};
  if (has(/\b(play|continue|resume|go on|chalo|start video|unpause|carry on)\b/)) return {intent:'play'};
  return null;
}
window.__parse = parse; // exposed for automated tests

/* ---------- Speech output ---------- */
function speak(text){
  if (!text || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 1.02;
    const v = speechSynthesis.getVoices().find(v=>/en[-_]IN/i.test(v.lang)) || speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang));
    if (v) u.voice = v;
    speaking = true;
    if (S.handsFree){ try{ rec && (rec.onend=null, rec.abort()); }catch(e){} recOn=false; }
    const done = () => { speaking = false; if (S.handsFree && cookEl) setTimeout(()=>{ if(S.handsFree && !speaking) startRec(true); }, 200); };
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

function stopEverything(){ stopRec(); S.handsFree=false; releaseWake(); destroyCook(); try{speechSynthesis.cancel();}catch(e){} restoreVolume(); }

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
    <p>Session log for usability testing. Prototype notes: the YouTube page, share sheet and “preparing” stages are simulated; the recipe and answers were prepared manually from the video. Video playback, step clips, voice recognition, timers and layouts are real. Step times: <b>${R.marksSource}</b>.</p>
    <table>${Object.entries(s).map(([k,v])=>`<tr><td>${k.replace(/([A-Z])/g,' $1').toLowerCase()}</td><td style="text-align:right"><b>${v}</b></td></tr>`).join('')}
      <tr><td>session length</td><td style="text-align:right"><b>${Math.round((Date.now()-LOG.t0)/60000)} min</b></td></tr></table>
    <textarea readonly>${esc(lines)}</textarea>
    <button class="btn primary" id="facCopy">Copy log</button>
    <button class="btn secondary" id="facReset">Reset log (new participant)</button>
    <button class="btn secondary" id="facMark">Set step times (mark mode)</button>
    <button class="btn tertiary" id="facClose">Close</button>`;
  document.body.appendChild(d);
  $('#facCopy',d).onclick = ()=>{ copy(`${JSON.stringify(s)}\n${lines}`); $('#facCopy',d).textContent='Copied'; };
  $('#facReset',d).onclick = ()=>{ LOG.events=[]; LOG.t0=Date.now(); d.remove(); };
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

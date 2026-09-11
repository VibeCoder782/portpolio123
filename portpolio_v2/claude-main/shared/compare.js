/* Hero alignment flows into the first case. Body content remains readable without motion.
   Claude 구현안(claude-main): 인계 구간에서 배경이 다시 밤으로, 내비 종이 판정은 #work부터. 나머지는 Phase 2와 동일. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const mqReduced = matchMedia('(prefers-reduced-motion: reduce)'); let reduced = mqReduced.matches;
  const mqMobile = matchMedia('(max-width: 860px)');
  const mqHover = matchMedia('(hover: hover) and (pointer: fine)');
  const html = document.documentElement, body = document.body;

  const STEPS = ['목적 · 현장 파악', '요구 · 우선순위', '정책 · 화면설계', '고객 · 팀 협의', '일정 · 업무 조율', '검수 · 수정', '오픈'];
  const FIELD = [
    { who: '기존 회원', t: '계속 다니던 회원인데, 먼저 신청할 수 없나요?' },
    { who: '신규 회원', t: '신규도 공평하게 신청하고 싶어요.' },
    { who: '운영자',   t: '회원 등록을 아직 수기로 하고 있어요.' },
    { who: '개발',     t: '관리자 기능이 오픈 전에 안 나올 것 같습니다.' },
    { who: '발주처',   t: '사이트가 200개인데, 어디까지 됐죠?' },
    { who: '팀',       t: '검수는 누가, 언제 하나요?' },
    { who: '고객',     t: '예약 기능은 우리 기관만 필요해요.' },
    { who: '고객',     t: '임직원 프로필을 관리하고 싶어요.' },
    { who: '고객',     t: '그건 영업자료로 쓰려고요.' },
    { who: '회원',     t: '취소하면 환불은 언제 되나요?' },
    { who: '팀',       t: '자료가 늦어지는 페이지는 어떻게 하죠?' },
    { who: '고객',     t: '메뉴랑 팝업은 우리가 직접 바꾸고 싶어요.' },
  ];
  const PERSP = 1200;
  const SCATTER_D = [[44,9,-300],[72,18,-120],[74,31,-60],[8,72,-420],[36,78,-60],[52,21,-240],[18,24,-520],[80,8,-520],[84,22,-360],[62,86,-520],[84,66,-560],[40,27,120]];
  const SCATTER_M = [[6,63,-260],[28,72,-80],[8,82,60],[30,28,-650],[24,7,-120],[56,33,-600],[44,18,-420]];

  const scene = $('.scene'), fragsEl = $('#frags'), hero = $('#hero');
  const alignLine = $('#alignLine'), connectLine = $('#connectLine');
  const head = $('#processHead'), firstCase = $('#feature');
  let motion = false;

  const frags = FIELD.map((f, i) => {
    const el = document.createElement('div'); el.className = 'frag';
    const step = i < 7 ? `<span class="frag__step">${STEPS[i]}</span><span class="frag__num">0${i + 1}</span>` : '';
    el.innerHTML = `<span class="frag__field"><span class="frag__who">${f.who}</span><span>“${f.t}”</span></span>${step}`;
    fragsEl.appendChild(el);
    return { el, i, field: el.querySelector('.frag__field'), step: el.querySelector('.frag__step'), num: el.querySelector('.frag__num') };
  });

  const T = { p: 0, sp: 0, mx: 0, my: 0 }, S = { p: 0, sp: 0, mx: 0, my: 0 };
  let vw = innerWidth, vh = innerHeight, isMobile = mqMobile.matches, sceneRange = 1, slots = [], readyAt = 0;
  const FEATURE_TOP = 0.14;

  function measure() {
    vw = innerWidth; vh = innerHeight; isMobile = mqMobile.matches;
    motion = !reduced && !isMobile && vh >= 680;
    body.classList.toggle('is-motion', motion);
    if (motion && firstCase.querySelector('.case__inner').getBoundingClientRect().height > vh) {
      motion = false; body.classList.remove('is-motion');
    }
    if (!motion) {
      hero.style.transform = ''; hero.style.opacity = ''; hero.style.pointerEvents = ''; hero.inert = false;
      firstCase.inert = false; firstCase.style.removeProperty('--handoff');
      html.style.setProperty('--mix', '0');
    }
    sceneRange = Math.max(1, scene.offsetHeight - vh);
    if (isMobile) {
      const x = vw * 0.12; slots = STEPS.map((_, i) => [x, vh * (0.36 + i * (0.50 / 6))]);
      alignLine.setAttribute('x1', x); alignLine.setAttribute('y1', vh * 0.33); alignLine.setAttribute('x2', x); alignLine.setAttribute('y2', vh * 0.89);
    } else {
      const y = vh * 0.64; slots = STEPS.map((_, i) => [vw * (0.10 + i * (0.80 / 6)), y]);
      alignLine.setAttribute('x1', vw * 0.05); alignLine.setAttribute('y1', y); alignLine.setAttribute('x2', vw * 0.95); alignLine.setAttribute('y2', y);
    }
    frags.forEach(f => { f.el.style.display = (isMobile && f.i >= 7) ? 'none' : ''; });
    onScroll(); dirty = true;
  }
  let dirty = true, lastY = -1;
  function onScroll() { T.sp = clamp((scrollY - scene.offsetTop) / sceneRange); T.p = T.sp; dirty = true; }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure); mqMobile.addEventListener('change', measure);
  if (mqHover.matches && !reduced) addEventListener('mousemove', e => { T.mx = (e.clientX / vw) * 2 - 1; T.my = (e.clientY / vh) * 2 - 1; dirty = true; }, { passive: true });

  function render(now) {
    if (!motion) return;
    const p = S.p, mx = S.mx, my = S.my;
    const intro = readyAt ? clamp((now - readyAt) / 900) : 0;
    const mix = easeIO(range(p, 0.20, 0.50)) * (1 - easeIO(range(p, 0.76, 0.90)));   // 정렬(종이) 뒤 인계 구간에서 다시 밤으로 → 01(밤)과 이어진다 (Claude 안)
    html.style.setProperty('--mix', mix.toFixed(4));
    const tiltAmt = lerp(1, 0.35, range(p, 0.15, 0.5));
    fragsEl.style.transform = `rotateY(${(mx * 2.4 * tiltAmt).toFixed(3)}deg) rotateX(${(-my * 1.6 * tiltAmt).toFixed(3)}deg)`;

    const ho = range(p, 0.10, 0.32);
    hero.style.transform = `translate3d(${(-mx * 8).toFixed(2)}px, ${(-my * 5 - ho * 40).toFixed(2)}px, ${(-720 * easeIO(ho)).toFixed(1)}px)`;
    hero.style.opacity = (1 - easeOut(ho)).toFixed(3);
    hero.style.pointerEvents = ho > 0.9 ? 'none' : '';
    hero.inert = ho > 0.9;

    const scatter = isMobile ? SCATTER_M : SCATTER_D;
    const fadeLabels = 1 - easeIO(range(p, 0.74, 0.86));
    frags.forEach((f, i) => {
      if (isMobile && i >= 7) return;
      const [sx, sy, sz] = scatter[i];
      const k = (PERSP - sz) / PERSP;
      const baseX = vw / 2 + (vw * sx / 100 - vw / 2) * k, baseY = vh / 2 + (vh * sy / 100 - vh / 2) * k;
      const depthK = (sz + 800) / 800, parX = mx * depthK * 18 * tiltAmt, parY = my * depthK * 12 * tiltAmt;
      let baseOp = clamp(0.34 + (sz + 700) / 900 * 0.6, 0.22, 1);
      if (isMobile && sz <= -600) baseOp *= range(p, 0.06, 0.22);
      const introOp = clamp((intro * 1.6) - i * 0.06);
      if (i < 7) {
        const a = easeIO(range(p, 0.18 + i * 0.025, 0.50 + i * 0.025));
        const [tx, ty] = slots[i];
        f.el.style.transform = `translate3d(${lerp(baseX + parX, tx, a).toFixed(2)}px, ${lerp(baseY + parY, ty, a).toFixed(2)}px, ${lerp(sz, 0, a).toFixed(1)}px)`;
        f.el.style.opacity = (lerp(baseOp, 1, a) * introOp * fadeLabels).toFixed(3);
        const swap = range(a, 0.62, 0.92);
        f.field.style.opacity = (1 - swap).toFixed(3); f.field.style.transform = `translateY(${(-10 * swap).toFixed(2)}px)`;
        f.step.style.opacity = swap.toFixed(3);
        f.num.style.opacity = range(p, 0.58 + i * 0.012, 0.68 + i * 0.012).toFixed(3);
      } else {
        const fly = easeIO(range(p, 0.14, 0.38));
        f.el.style.transform = `translate3d(${(baseX + parX).toFixed(2)}px, ${(baseY + parY).toFixed(2)}px, ${lerp(sz, 900, fly).toFixed(1)}px)`;
        f.el.style.opacity = (baseOp * (1 - fly) * introOp).toFixed(3);
      }
    });

    alignLine.style.strokeDashoffset = (1 - easeOut(range(p, 0.50, 0.66))).toFixed(4);
    alignLine.style.opacity = isMobile ? fadeLabels.toFixed(3) : (1 - range(p, 0.74, 0.80)).toFixed(3);
    const hp = easeOut(range(p, 0.56, 0.70)) * (1 - easeIO(range(p, 0.72, 0.82)));
    head.style.opacity = hp.toFixed(3); head.style.transform = `translateY(${((1 - easeOut(range(p, 0.56, 0.70))) * 24 - easeIO(range(p, 0.72, 0.82)) * 30).toFixed(2)}px)`;

    const c = easeIO(range(p, 0.74, 1.0));
    const topY = lerp(isMobile ? vh * 1.0 : vh * 0.64, vh * FEATURE_TOP, c);
    connectLine.setAttribute('x1', vw * 0.05); connectLine.setAttribute('x2', vw * 0.95);
    connectLine.setAttribute('y1', topY); connectLine.setAttribute('y2', topY);
    connectLine.style.strokeDashoffset = (1 - easeOut(range(p, 0.74, 0.88))).toFixed(4);
    connectLine.style.opacity = range(p, 0.74, 0.78).toFixed(3);
    const handoff = easeIO(range(p, 0.74, 0.97));
    firstCase.style.setProperty('--handoff', handoff.toFixed(4));
    firstCase.inert = handoff < 0.999;
    if (handoff >= 0.999) firstCase.classList.add('is-set');
    return mix > 0.5 ? 'paper' : 'night';
  }


  // Content remains readable with no script or when motion is reduced.
  const nav = $('.nav');
  const photo = $('#aboutPhoto');
  const observed = document.querySelectorAll('section.case');
  const timers = new Set();
  let rafId = 0;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el === firstCase && motion) return;
      el.classList.add('is-in');
      const timer = setTimeout(() => { el.classList.add('is-set'); timers.delete(timer); }, reduced ? 0 : 350);
      timers.add(timer); io.unobserve(el);
    }), { threshold: 0.15 });
    observed.forEach(el => io.observe(el));
  } else observed.forEach(el => el.classList.add('is-in', 'is-set'));

  if (photo && mqHover.matches) {
    photo.addEventListener('pointermove', e => {
      if (reduced) return;
      const box = photo.getBoundingClientRect();
      photo.style.setProperty('--lx', ((e.clientX-box.left)/box.width*100).toFixed(1)+'%');
      photo.style.setProperty('--ly', ((e.clientY-box.top)/box.height*100).toFixed(1)+'%');
    });
  }

  const workEl = $('#work');
  function paintNav() {   // 종이 내비: 히어로 정렬(종이) 구간과 04–06 이후. 사례 01~03(밤)에서는 크림 + difference
    const heroPaper = motion && S.p > 0.48 && S.p < 0.83;
    const belowWork = !!workEl && workEl.getBoundingClientRect().top <= nav.offsetHeight + 1;
    nav.classList.toggle('is-paper', heroPaper || belowWork);
  }
  function loop(now) {
    rafId = 0;
    const settled = Math.abs(T.p-S.p)<0.0001 && Math.abs(T.mx-S.mx)<0.001 && Math.abs(T.my-S.my)<0.001;
    if (dirty || !settled || now - readyAt < 1000) {
      S.p += (T.p-S.p)*0.15; S.mx += (T.mx-S.mx)*0.08; S.my += (T.my-S.my)*0.08;
      if (settled) { S.p=T.p; S.mx=T.mx; S.my=T.my; }
      render(now); paintNav(); dirty=false;
    }
    if (!document.hidden) rafId=requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId=0; }
    else if (!document.hidden && !rafId) { dirty=true; rafId=requestAnimationFrame(loop); }
  });
  mqReduced.addEventListener('change', e => {
    reduced=e.matches; timers.forEach(clearTimeout); timers.clear();
    if (reduced) observed.forEach(el=>el.classList.add('is-in','is-set'));
    measure(); S.p=T.p; render(performance.now()); paintNav();
  });

  // Native disclosure semantics, print only on opening, no idle motion.
  document.querySelectorAll('details.more').forEach(details => {
    const summary=details.querySelector('summary');
    details.addEventListener('toggle', () => {
      summary.textContent=details.open ? summary.dataset.close : summary.dataset.open;
      if (!details.open) details.classList.remove('is-open');
      else requestAnimationFrame(() => requestAnimationFrame(() => {
        if (details.open) details.classList.add('is-open');
      }));
    });
  });

  function featurePosition() { return motion ? scene.offsetTop+scene.offsetHeight-innerHeight : firstCase.getBoundingClientRect().top+scrollY-nav.offsetHeight; }
  function jumpToFeature(focus=false) {
    window.scrollTo({top:Math.max(0,featurePosition()),behavior:'instant'});
    onScroll(); S.p=T.p; render(performance.now()); paintNav();
    firstCase.inert=false; firstCase.classList.add('is-set');
    if (focus) firstCase.focus({preventScroll:true});
  }
  document.querySelectorAll('a[href="#feature"]').forEach(link => link.addEventListener('click', e => {
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    e.preventDefault();
    if(location.hash!=='#feature') history.pushState(null,'','#feature');
    jumpToFeature(true);
  }));
  window.addEventListener('hashchange',()=>{if(location.hash==='#feature')jumpToFeature();});
  firstCase.addEventListener('focusin', () => { if(motion && T.p<0.97) jumpToFeature(); });
  if(new URLSearchParams(location.search).has('compare')) html.dataset.comparison='true';

  function start() {
    if (readyAt) return;
    readyAt=performance.now(); body.classList.add('is-ready','js-ready');
    measure(); S.p=T.p; render(readyAt); paintNav();
    const navigation=performance.getEntriesByType('navigation')[0];
    if(location.hash==='#feature' && navigation?.type==='navigate')jumpToFeature();
    if(!rafId)rafId=requestAnimationFrame(loop);
  }
  if(document.fonts?.ready) document.fonts.ready.then(start,start); else start();
  setTimeout(start,1800);
  window.addEventListener('pageshow',e=>{if(e.persisted){measure();S.p=T.p;render(performance.now());paintNav();}});
})();

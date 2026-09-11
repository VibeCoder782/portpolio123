/* 메인 — 진행도 p(0~1) 하나로 hero → 정렬 → 연결 → (사례 01이 sticky 마지막 20svh 위로 올라옴, CSS .case--first).
   사례 01·02·03은 자연 스크롤 정지 구도(2026-09-09 밤 시안) — JS는 확대 도착 시 밑줄(.is-set)만. 하단은 CSS 변수(--rp --lp)로 진행도만 넘긴다.
   디버그: __scene.renderAt(p) */
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

  const STEPS = ['고객 · 현행 분석', '요구사항', '정책 · IA · 화면설계', '디자인 · 개발 협의', '일정 · 이슈 관리', 'QA', '오픈'];
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
  const head = $('#processHead'), connectLabel = $('#connectLabel');

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
    const p = S.p, mx = S.mx, my = S.my;
    const intro = readyAt ? clamp((now - readyAt) / 900) : 0;
    const mix = easeIO(range(p, 0.20, 0.50)) * (1 - easeIO(range(p, 0.84, 0.98)));   // 정렬 뒤 인계 구간에서 다시 밤으로 → 사례 01(밤)이 올라온다
    html.style.setProperty('--mix', mix.toFixed(4));
    const tiltAmt = lerp(1, 0.35, range(p, 0.15, 0.5));
    fragsEl.style.transform = `rotateY(${(mx * 2.4 * tiltAmt).toFixed(3)}deg) rotateX(${(-my * 1.6 * tiltAmt).toFixed(3)}deg)`;

    const ho = range(p, 0.10, 0.32);
    hero.style.transform = `translate3d(${(-mx * 8).toFixed(2)}px, ${(-my * 5 - ho * 40).toFixed(2)}px, ${(-720 * easeIO(ho)).toFixed(1)}px)`;
    hero.style.opacity = (1 - easeOut(ho)).toFixed(3);
    hero.style.pointerEvents = ho > 0.9 ? 'none' : '';

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
    const cl = easeOut(range(p, 0.88, 1.0));
    connectLabel.style.opacity = cl.toFixed(3); connectLabel.style.transform = `translateY(${((1 - cl) * 12).toFixed(2)}px)`;
    return (c > 0.5 || mix < 0.5) ? 'night' : 'paper';   // 눈금자 톤: 아르피나 장면이 덮으면 밤
  }

  // ---- 하단 장면: 진행도 → CSS 변수 (연출은 CSS) ----
  const photoEl = $('#aboutPhoto'), contactEl = $('#contact');
  const rows = Array.from(document.querySelectorAll('.row')), rules = Array.from(document.querySelectorAll('.rule'));
  let lightUser = false, lightX = 0.5, lightY = 0.4;
  if (photoEl) photoEl.addEventListener('mousemove', e => { const r = photoEl.getBoundingClientRect(); lightUser = true; lightX = (e.clientX - r.left) / r.width; lightY = (e.clientY - r.top) / r.height; dirty = true; });
  const setVar = (el, name, v) => { const s = v.toFixed(4); const c = el.__v || (el.__v = {}); if (c[name] !== s) { el.style.setProperty(name, s); c[name] = s; } };
  const pointerOK = mqHover.matches;


  // ---- 사례 01·02·03: 화면에 들어오면 한 번 올라오며 나타나고(.is-in) 밑줄·메모가 순서대로(.is-set). 정적 구도(모바일·동작 줄이기)는 CSS가 항상 켬 ----
  const cases = Array.from(document.querySelectorAll('.case'));
  if (cases.length) { const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { const el = en.target; el.classList.add('is-in'); setTimeout(() => el.classList.add('is-set'), reduced ? 0 : 900); /* 도착(0.9s) 뒤 강조 */ io.unobserve(el); } }), { threshold: 0.35 }); cases.forEach(el => io.observe(el)); }

  function renderBelow(now) {
    let aboutVisible = false;
    rows.forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < -vh || r.top > vh * 2) return; setVar(el, '--rp', easeOut(clamp((vh * 0.98 - r.top) / (vh * 0.22)))); });
    rules.forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < -vh || r.top > vh * 2) return; setVar(el, '--lp', easeOut(clamp((vh * 0.9 - r.top) / (vh * 0.22)))); });
    if (photoEl) { const r = photoEl.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) { aboutVisible = true; if (!lightUser) { const tt = now / 1000; lightX = 0.5 + 0.3 * Math.sin(tt * 0.6); lightY = 0.42 + 0.22 * Math.cos(tt * 0.43); } photoEl.style.setProperty('--lx', (lightX * 100).toFixed(1) + '%'); photoEl.style.setProperty('--ly', (lightY * 100).toFixed(1) + '%'); } }
    return aboutVisible;
  }

  let rafId = 0, keepAlive = false;
  function loop(now) {
    rafId = 0;
    const k = 0.11;
    const settled = Math.abs(T.p - S.p) < 1e-4 && Math.abs(T.sp - S.sp) < 1e-4 && Math.abs(T.mx - S.mx) < 1e-3 && Math.abs(T.my - S.my) < 1e-3;
    if (dirty || !settled || keepAlive || scrollY !== lastY) {
      S.p += (T.p - S.p) * k; S.sp += (T.sp - S.sp) * k; S.mx += (T.mx - S.mx) * 0.08; S.my += (T.my - S.my) * 0.08;
      if (settled) { S.p = T.p; S.sp = T.sp; S.mx = T.mx; S.my = T.my; }
      render(now); keepAlive = renderBelow(now); lastY = scrollY; dirty = false;
    }
    if (!document.hidden) rafId = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !rafId && !reduced) { dirty = true; rafId = requestAnimationFrame(loop); } });

  // ---- 동작 줄이기: 연출 없이 최종 구도만. 정적 레이아웃은 CSS가 맡는다 ----
  function renderStatic() { html.style.setProperty('--mix', '0'); }
  mqReduced.addEventListener('change', e => { reduced = e.matches; if (reduced) { body.classList.add('is-reduced'); if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } renderStatic(); } else { body.classList.remove('is-reduced'); dirty = true; if (!rafId) rafId = requestAnimationFrame(loop); } });

  // ---- Contact 제목: 단어 단위 ----
  const ctitle = $('.contact__title');
  if (ctitle) { let n = 0; ctitle.querySelectorAll('span').forEach(sp => { sp.innerHTML = sp.textContent.trim().split(/\s+/).map(w => `<span class="w" style="--i:${n++}">${w}</span>`).join(' '); }); }
  if (contactEl) new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) contactEl.classList.add('is-in'); }), { threshold: 0.2 }).observe(contactEl);

  // ---- About 펼침: 영수증 인쇄 (V1 이식) — 열면 슬롯에서 종이가 뽑혀 나오고, 닫으면 되감긴 뒤 접힌다 ----
  document.querySelectorAll('details.more').forEach(d => {
    const sum = d.querySelector('summary');
    sum.addEventListener('click', e => {
      e.preventDefault();
      if (!d.open) { d.open = true; sum.textContent = sum.dataset.close; requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open'))); }
      else { d.classList.remove('is-open'); sum.textContent = sum.dataset.open; setTimeout(() => { if (!d.classList.contains('is-open')) d.open = false; }, reduced ? 0 : 1200); }
    });
  });

  // 이동: Work·#feature·#apps·#sangji는 각 사례 섹션 상단으로 — 브라우저 기본 앵커(html scroll-behavior: smooth)

  measure();
  const start = () => { readyAt = performance.now(); body.classList.add('is-ready'); if (reduced) { body.classList.add('is-reduced'); renderStatic(); } else { dirty = true; rafId = requestAnimationFrame(loop); } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start).catch(start); else start();
  setTimeout(() => { if (!readyAt) start(); }, 2500);
  window.__scene = { T, S, measure, renderAt(p, mx = 0, my = 0) { T.p = S.p = p; T.mx = S.mx = mx; T.my = S.my = my; render(performance.now()); renderBelow(performance.now()); } };
})();

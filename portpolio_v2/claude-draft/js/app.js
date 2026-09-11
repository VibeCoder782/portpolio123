/* ============================================================
   「정렬」 — 양순민 포트폴리오 V2 · Claude 비교 시안
   vanilla JS · 빌드 없음 · 스크롤/마우스 값은 lerp로 부드럽게
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqMobile = matchMedia('(max-width: 860px)');
  const mqHover = matchMedia('(hover: hover) and (pointer: fine)');
  const html = document.documentElement;
  const body = document.body;

  /* ------------------------------------------------------------
     1. 현장의 말 — fragments (앞 7개는 일하는 순서 7단계가 된다)
     ------------------------------------------------------------ */
  const STEPS = ['고객 · 현행 분석', '요구사항', '정책 · IA · 화면설계', '디자인 · 개발 협의', '일정 · 이슈 관리', 'QA', '오픈'];
  const FIELD = [
    { who: '기존 회원', t: '계속 다니던 회원인데, 먼저 신청할 수 없나요?' },
    { who: '신규 회원', t: '신규도 공평하게 신청하고 싶어요.' },
    { who: '운영자',   t: '회원 등록을 아직 수기로 하고 있어요.' },
    { who: '개발',     t: '관리자 기능이 오픈 전에 안 나올 것 같습니다.' },
    { who: '발주처',   t: '사이트가 200개인데, 어디까지 됐죠?' },
    { who: '팀',       t: '검수는 누가, 언제 하나요?' },
    { who: '고객',     t: '예약 기능은 우리 기관만 필요해요.' },
    // 아래 5개는 데스크톱 전용 — 정렬 때 카메라 앞으로 지나가며 사라진다
    { who: '고객',     t: '임직원 프로필을 관리하고 싶어요.' },
    { who: '고객',     t: '그건 영업자료로 쓰려고요.' },
    { who: '회원',     t: '취소하면 환불은 언제 되나요?' },
    { who: '팀',       t: '자료가 늦어지는 페이지는 어떻게 하죠?' },
    { who: '고객',     t: '메뉴랑 팝업은 우리가 직접 바꾸고 싶어요.' },
  ];
  // 흩어진 위치: [화면 x%, 화면 y%, z px] — 화면에 보이는 위치 기준. 원근(1200px) 투영을 역산해 배치한다.
  const PERSP = 1200;
  const SCATTER_D = [[44,9,-300],[72,18,-120],[73,40,40],[8,70,-420],[36,76,-60],[52,21,-240],[18,24,-520],[80,8,-520],[78,28,-360],[62,85,-520],[78,56,-560],[40,27,120]];
  const SCATTER_M = [[6,58,-260],[26,67,-80],[8,76,60],[30,28,-650],[24,7,-120],[56,33,-600],[6,15,-300]];

  const stage = $('#stage');
  const fragsEl = $('#frags');
  const hero = $('#hero');
  const scene = $('.scene');
  const processHead = $('#processHead');
  const processPath = $('#processPath');
  const processCue = $('#processCue');
  const nav = $('#nav');

  const frags = FIELD.map((f, i) => {
    const el = document.createElement('div');
    el.className = 'frag';
    const step = i < 7 ? `<span class="frag__step">${STEPS[i]}</span><span class="frag__num">0${i + 1}</span>` : '';
    el.innerHTML = `<span class="frag__field"><span class="frag__who">${f.who}</span><span>“${f.t}”</span></span>${step}`;
    fragsEl.appendChild(el);
    return { el, i, field: el.querySelector('.frag__field'), step: el.querySelector('.frag__step'), num: el.querySelector('.frag__num') };
  });

  /* ------------------------------------------------------------
     2. 상태 (target → smooth) 와 루프
     ------------------------------------------------------------ */
  const T = { p: 0, mx: 0, my: 0, px: 0, py: 0 };
  const S = { p: 0, mx: 0, my: 0, px: 0, py: 0 };
  let vw = innerWidth, vh = innerHeight, isMobile = mqMobile.matches;
  let sceneRange = 1, slots = [], lineFrom = [0, 0], lineTo = [0, 0];
  let readyAt = 0;

  function measure() {
    vw = innerWidth; vh = innerHeight; isMobile = mqMobile.matches;
    sceneRange = Math.max(1, scene.offsetHeight - vh);
    if (isMobile) {
      const x = vw * 0.12;
      slots = STEPS.map((_, i) => [x, vh * (0.36 + i * (0.50 / 6))]);
      lineFrom = [x, vh * 0.33]; lineTo = [x, vh * 0.89];
    } else {
      const y = vh * 0.64;
      slots = STEPS.map((_, i) => [vw * (0.10 + i * (0.80 / 6)), y]);
      lineFrom = [vw * 0.05, y]; lineTo = [vw * 0.95, y];
    }
    processPath.setAttribute('x1', lineFrom[0]); processPath.setAttribute('y1', lineFrom[1]);
    processPath.setAttribute('x2', lineTo[0]);   processPath.setAttribute('y2', lineTo[1]);
    frags.forEach(f => { f.el.style.display = (isMobile && f.i >= 7) ? 'none' : ''; });
    onScroll();
  }

  const contact = $('#contact');
  function onScroll() {
    T.p = clamp((scrollY - scene.offsetTop) / sceneRange);
    // 어두운 연락·푸터 위에서는 내비 색을 밝게
    nav.classList.toggle('is-light', scrollY + 60 >= contact.offsetTop);
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure);
  mqMobile.addEventListener('change', measure);

  if (mqHover.matches && !reduced) {
    addEventListener('mousemove', e => {
      T.mx = (e.clientX / vw) * 2 - 1;
      T.my = (e.clientY / vh) * 2 - 1;
      T.px = e.clientX; T.py = e.clientY;
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     3. 장면 렌더 — 진행도 p(0~1) 하나로 hero → 정렬 → 일하는 순서
     ------------------------------------------------------------ */
  function render(now) {
    const p = S.p, mx = S.mx, my = S.my;
    const intro = readyAt ? clamp((now - readyAt) / 900) : 0;

    // 배경: 밤 → 종이
    const mix = easeIO(range(p, 0.26, 0.62));
    html.style.setProperty('--mix', mix.toFixed(4));

    // 마우스 기울기 — 정렬 이후에는 약하게
    const tiltAmt = lerp(1, 0.35, range(p, 0.2, 0.6));
    fragsEl.style.transform = reduced ? '' : `rotateY(${(mx * 2.4 * tiltAmt).toFixed(3)}deg) rotateX(${(-my * 1.6 * tiltAmt).toFixed(3)}deg)`;

    // hero: 카메라가 앞으로 들어가며 제목이 뒤로 물러난다
    const ho = range(p, 0.14, 0.42);
    const heroZ = -720 * easeIO(ho);
    const heroOp = 1 - easeOut(ho);
    hero.style.transform = reduced
      ? ''
      : `translate3d(${(-mx * 8).toFixed(2)}px, ${(-my * 5 - ho * 40).toFixed(2)}px, ${heroZ.toFixed(1)}px)`;
    hero.style.opacity = (reduced ? (1 - ho) : heroOp).toFixed(3);
    hero.style.pointerEvents = heroOp < 0.08 ? 'none' : '';

    // fragments
    const scatter = isMobile ? SCATTER_M : SCATTER_D;
    frags.forEach((f, i) => {
      if (isMobile && i >= 7) return;
      const [sx, sy, sz] = scatter[i];
      // 화면상 원하는 위치(sx, sy)에 보이도록 원근 투영을 역산 (z<0이면 중심에서 멀리 둬야 제자리에 보인다)
      const k = (PERSP - sz) / PERSP;
      const baseX = vw / 2 + (vw * sx / 100 - vw / 2) * k;
      const baseY = vh / 2 + (vh * sy / 100 - vh / 2) * k;
      const depthK = (sz + 800) / 800;
      const parX = mx * depthK * 18 * tiltAmt, parY = my * depthK * 12 * tiltAmt;
      let baseOp = clamp(0.34 + (sz + 700) / 900 * 0.6, 0.22, 1);
      if (isMobile && sz <= -600) baseOp *= range(p, 0.08, 0.3);   // 모바일: 제목 뒤 깊은 문장은 카메라가 들어갈 때 드러난다
      const introOp = clamp((intro * 1.6) - i * 0.06);

      if (i < 7) {
        const a = easeIO(range(p, 0.24 + i * 0.03, 0.60 + i * 0.03));      // 정렬 진행
        const [tx, ty] = slots[i];
        const x = lerp(baseX + parX, tx, a);
        const y = lerp(baseY + parY, ty, a);
        const z = lerp(sz, 0, a);
        f.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(1)}px)`;
        f.el.style.opacity = (lerp(baseOp, 1, a) * introOp).toFixed(3);
        // 문장 → 단계 이름으로 교차
        const swap = range(a, 0.62, 0.92);
        f.field.style.opacity = (1 - swap).toFixed(3);
        f.field.style.transform = `translateY(${(-10 * swap).toFixed(2)}px)`;
        f.step.style.opacity = swap.toFixed(3);
        f.num.style.opacity = range(p, 0.74 + i * 0.015, 0.86 + i * 0.015).toFixed(3);
      } else {
        const fly = easeIO(range(p, 0.18, 0.46));                           // 카메라 앞으로 지나감
        const z = lerp(sz, 900, fly);
        f.el.style.transform = `translate3d(${(baseX + parX).toFixed(2)}px, ${(baseY + parY).toFixed(2)}px, ${z.toFixed(1)}px)`;
        f.el.style.opacity = (baseOp * (1 - fly) * introOp).toFixed(3);
      }
    });

    // 선 긋기 + 헤드라인
    processPath.style.strokeDashoffset = (1 - easeOut(range(p, 0.60, 0.80))).toFixed(4);
    const hp = easeOut(range(p, 0.70, 0.90));
    processHead.style.opacity = hp.toFixed(3);
    processHead.style.transform = `translateY(${((1 - hp) * 24).toFixed(2)}px)`;
    processCue.style.opacity = easeOut(range(p, 0.86, 1)).toFixed(3);

    // 커서 프리뷰 (data-case 위)
    if (previewOn) {
      const cx = S.px + 28, cy = S.py - 150;
      const rx = ((S.py / vh) * 2 - 1) * -6, ry = ((S.px / vw) * 2 - 1) * 8;
      preview.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      previewCard.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
  }

  let last = 0;
  function loop(now) {
    const k = reduced ? 1 : 0.11;
    S.p += (T.p - S.p) * k;
    S.mx += (T.mx - S.mx) * 0.08;
    S.my += (T.my - S.my) * 0.08;
    S.px += (T.px - S.px) * 0.16;
    S.py += (T.py - S.py) * 0.16;
    render(now);
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------
     4. 도식 (설명용 재구성) — 프리뷰와 상세에서 공용
     ------------------------------------------------------------ */
  const uid = () => 'm' + Math.random().toString(36).slice(2, 7);
  const marker = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>`;
  const svgOpen = (fs, label) => `<svg viewBox="0 0 480 270" class="diagram__svg" role="img" aria-label="${label}" style="font-size:${fs}px">`;
  const node = (x, y, w, h, text, cls = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" class="${cls}"/><text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central">${text}</text>`;

  const DG = {
    arpina(fs) { const m = uid(); return svgOpen(fs, '접수 정책 흐름') + marker(m) +
      `<rect x="158" y="34" width="124" height="204" class="dg-band"/>
       <g class="dg-muted"><text x="20" y="46">기존 회원</text><text x="20" y="180">신규 회원</text><text x="220" y="256" text-anchor="middle">우선신청 기간</text></g>
       <g class="dg-node">${node(20,60,124,40,'관리자 사전등록')}${node(170,60,100,40,'우선신청','dg-node--accent')}${node(20,194,124,40,'온라인 회원가입')}${node(300,194,110,40,'선착순 신청','dg-node--accent')}</g>
       <g class="dg-node"><rect x="400" y="104" width="70" height="62" rx="2"/><text x="435" y="126" text-anchor="middle">결제</text><text x="435" y="150" text-anchor="middle">관리자 확인</text></g>
       <g class="dg-edge" marker-end="url(#${m})"><path d="M144 80H170"/><path d="M270 80C330 80 360 96 400 118"/><path d="M144 214H300"/><path d="M410 214C425 214 428 190 435 166"/></g>
       <g class="dg-muted"><text x="220" y="145" text-anchor="middle">기존 회원만</text><text x="300" y="186">종료 후 시작 →</text></g></svg>`; },

    donga(fs) {
      const cols = [['사이트', 20], ['담당', 130], ['상태', 190], ['기한', 290], ['검수', 360], ['잔여', 420]];
      const rows = [['사이트 01','A','완료','05.12',1,'0'],['사이트 02','A','검수중','05.14',0,'2'],['사이트 03','B','진행','05.20',0,'5'],['사이트 04','B','수정요청','05.16',1,'1'],['사이트 05','C','완료','05.11',1,'0'],['사이트 06','C','자료대기','—',0,'—']];
      let s = svgOpen(fs, '작업·검수 관리표 구조') + `<g class="dg-muted">` + cols.map(([t, x]) => `<text x="${x}" y="34">${t}</text>`).join('') + `</g><line x1="20" y1="46" x2="460" y2="46" class="dg-thin"/>`;
      rows.forEach((r, i) => {
        const y = 58 + i * 31;
        const st = r[2]; const accent = st === '검수중' || st === '수정요청';
        s += `<g class="dg-node" style="font-size:${fs}px"><text x="20" y="${y + 12}" dominant-baseline="central">${r[0]}</text><text x="130" y="${y + 12}" dominant-baseline="central">${r[1]}</text>
              <rect x="190" y="${y}" width="78" height="24" rx="2" class="${st === '완료' ? 'dg-fill' : accent ? 'dg-node--accent' : ''}" ${st === '자료대기' ? 'stroke-dasharray="3 3"' : ''}/><text x="229" y="${y + 12}" text-anchor="middle" dominant-baseline="central">${st}</text>
              <text x="290" y="${y + 12}" dominant-baseline="central">${r[3]}</text>
              <circle cx="368" cy="${y + 12}" r="6" class="${r[4] ? 'dg-fill-accent' : ''}" ${r[4] ? '' : 'fill="none" stroke="var(--ink-3)"'}/>
              <text x="420" y="${y + 12}" dominant-baseline="central">${r[5]}</text></g>`;
      });
      return s + `<text x="460" y="262" text-anchor="end" class="dg-muted">재구성 예시 — 실제 데이터 아님</text></svg>`; },

    cms(fs) { const m = uid(); return svgOpen(fs, '공통 기능과 고객별 기능 구분') + marker(m) +
      `<g class="dg-node"><rect x="20" y="52" width="280" height="180" rx="2"/></g>
       <text x="34" y="40" class="dg-muted">공통 기능 — 먼저 구성</text>
       <g class="dg-node">${node(40,72,116,54,'회원가입')}${node(164,72,116,54,'게시판')}${node(40,148,116,54,'팝업')}${node(164,148,116,54,'메뉴 관리')}</g>
       <text x="340" y="40" class="dg-muted">고객별 요구 — 추가</text>
       <g class="dg-node"><rect x="340" y="72" width="120" height="44" rx="2" stroke-dasharray="4 3" class="dg-node--accent"/><text x="400" y="94" text-anchor="middle" dominant-baseline="central" style="fill:var(--accent)">예약</text>
       <rect x="340" y="136" width="120" height="44" rx="2" stroke-dasharray="4 3" class="dg-node--accent"/><text x="400" y="158" text-anchor="middle" dominant-baseline="central" style="fill:var(--accent)">신청</text>
       <rect x="340" y="200" width="120" height="32" rx="2" stroke-dasharray="4 3"/><text x="400" y="216" text-anchor="middle" dominant-baseline="central" class="dg-muted">…</text></g>
       <g class="dg-edge" marker-end="url(#${m})"><path d="M300 94H340"/><path d="M300 158H340"/><path d="M300 216H340"/></g></svg>`; },

    sangji(fs) { const m = uid(); return svgOpen(fs, '프로필 등록에서 PDF 다운로드까지') + marker(m) +
      `<g class="dg-node"><rect x="24" y="52" width="160" height="170" rx="2"/><circle cx="64" cy="92" r="18" fill="none" stroke="var(--ink)"/><text x="94" y="86">이름 · 직책</text><text x="94" y="106" class="dg-muted">경력 · 자격</text></g>
       <g class="dg-thin"><line x1="44" y1="134" x2="164" y2="134"/><line x1="44" y1="154" x2="164" y2="154"/><line x1="44" y1="174" x2="130" y2="174"/></g>
       <text x="24" y="40" class="dg-muted">임직원 프로필 등록</text>
       <g class="dg-edge" marker-end="url(#${m})"><path d="M184 137H296"/></g>
       <text x="240" y="124" text-anchor="middle" class="dg-muted">왜 필요한가?</text><text x="240" y="160" text-anchor="middle" style="fill:var(--accent)">영업자료</text>
       <g class="dg-node"><path d="M300 52H420L456 88V222H300Z" fill="none" stroke="var(--accent)" stroke-width="1.2"/><path d="M420 52V88H456" fill="none" stroke="var(--accent)" stroke-width="1.2"/><text x="378" y="150" text-anchor="middle" style="fill:var(--accent);font-family:var(--latin);font-style:italic;font-size:${fs * 2}px">PDF</text></g>
       <text x="300" y="40" class="dg-muted">내려받기</text></svg>`; },

    eum(fs) { const m = uid(); return svgOpen(fs, '저장에서 리마인드까지') + marker(m) +
      `<g class="dg-node">${node(20,105,100,60,'저장')}</g>
       <text x="20" y="90" class="dg-muted">메모 · 링크 · 이미지 · 리스트</text>
       <g class="dg-thin"><circle cx="230" cy="66" r="30"/><line x1="230" y1="66" x2="230" y2="46"/><line x1="230" y1="66" x2="244" y2="74"/></g>
       <text x="230" y="118" text-anchor="middle" class="dg-muted">시간</text>
       <g class="dg-thin"><path d="M230 176c-16 0-26 12-26 26 0 20 26 46 26 46s26-26 26-46c0-14-10-26-26-26z"/><circle cx="230" cy="202" r="8"/></g>
       <text x="230" y="262" text-anchor="middle" class="dg-muted">위치</text>
       <g class="dg-node">${node(350,105,110,60,'리마인드','dg-node--accent')}</g>
       <text x="350" y="190" class="dg-muted">→ 완료</text>
       <g class="dg-edge" marker-end="url(#${m})"><path d="M120 135C160 135 170 66 196 66"/><path d="M120 135C160 135 170 210 200 210"/><path d="M262 66C300 66 310 135 350 135"/><path d="M260 210C300 210 310 135 350 135"/></g></svg>`; },

    flowon(fs) { return svgOpen(fs, '고객별 웹서비스와 공통 운영 구조') +
      `<g class="dg-node"><rect x="160" y="100" width="160" height="70" rx="2" class="dg-node--accent"/><text x="240" y="126" text-anchor="middle" style="fill:var(--accent)">운영 구조</text><text x="240" y="150" text-anchor="middle" class="dg-muted">문서 · 지원 · 보안 · 백업</text></g>
       <g class="dg-node">${node(20,24,130,44,'고객 A 웹서비스')}${node(20,202,130,44,'고객 B 웹서비스')}${node(330,24,130,44,'고객 C 웹서비스')}${node(330,202,130,44,'홈페이지')}</g>
       <g class="dg-thin"><line x1="150" y1="46" x2="180" y2="100"/><line x1="150" y1="224" x2="180" y2="170"/><line x1="330" y1="46" x2="300" y2="100"/><line x1="330" y1="224" x2="300" y2="170"/></g></svg>`; },

    insight(fs) { const m = uid(); return svgOpen(fs, '수집 · 근거 · 승인 · 재사용 흐름') + marker(m) +
      `<g class="dg-node">${node(20,100,90,54,'수집')}${node(140,100,90,54,'근거')}${node(260,100,90,54,'승인','dg-node--accent')}${node(380,100,90,54,'재사용')}</g>
       <g class="dg-edge" marker-end="url(#${m})"><path d="M110 127H140"/><path d="M230 127H260"/><path d="M350 127H380"/><path d="M425 154C425 200 305 200 305 160" stroke-dasharray="3 3"/></g>
       <g class="dg-muted"><text x="65" y="84" text-anchor="middle">URL · PDF</text><text x="185" y="84" text-anchor="middle">Claim · Evidence</text><text x="305" y="84" text-anchor="middle" style="fill:var(--accent)">사람이 확인</text><text x="425" y="84" text-anchor="middle">프로젝트 연결</text><text x="365" y="232" text-anchor="middle">승인 없이는 넘어가지 않음</text></g></svg>`; },
  };

  /* ------------------------------------------------------------
     5. 프로젝트 목록 — 커서를 따라오는 프리뷰
     ------------------------------------------------------------ */
  const preview = $('#preview');
  const previewCard = $('.preview__card');
  const previewFig = $('#previewFig');
  const previewCap = $('#previewCap');
  const CAP = { arpina: ['접수 정책 흐름', '01'], donga: ['작업 · 검수 관리표 구조', '02'], cms: ['공통 / 고객별 기능', '03'], sangji: ['프로필 → PDF', '04'], eum: ['저장 → 리마인드', '05'], flowon: ['운영 구조', '06'], insight: ['수집 → 근거 → 승인', '07'] };
  let previewOn = false, previewKey = null;

  if (mqHover.matches) {
    $$('.row[data-case]').forEach(row => {
      row.addEventListener('mouseenter', () => {
        const key = row.dataset.case;
        if (key !== previewKey) { previewFig.innerHTML = DG[key](16); previewCap.innerHTML = `<span>${CAP[key][0]} · 설명용 도식</span><span class="latin">${CAP[key][1]}</span>`; previewKey = key; }
        previewOn = true; preview.style.opacity = '1';
      });
      row.addEventListener('mouseleave', () => { previewOn = false; preview.style.opacity = '0'; });
    });
  }

  /* ------------------------------------------------------------
     6. 상세 사례 오버레이 + 해시 라우팅 (목록 → 상세 → 목록)
     ------------------------------------------------------------ */
  const caseEl = $('#case');
  const caseInner = $('#caseInner');
  const page = $('#main');
  const TITLES = { arpina: '아르피나 — 회원 접수 정책과 온라인 업무 전환', donga: '동아대학교 — 약 200개 사이트의 작업·검수 관리', cms: '핸디 통합 CMS — 공통 기능과 고객별 요구 구분', sangji: '상지건축 — 임직원 프로필의 활용 목적을 기능으로', eum: '이음 — 시간·위치 기반 저장·리마인드 앱', flowon: 'FLOWON — 고객별 웹서비스와 운영 구조', insight: 'AI Insight OS — 정보 수집·근거·승인·재사용 흐름' };

  const CASES = {
    donga: {
      no: 'Case 02', org: '동아대학교 · 아리모아 · 2023.05 – 2023.11',
      t1: '약 200개의 사이트를,', t2: '검수할 수 있는 구조로.',
      role: '아리모아 · 내부 PL (서비스기획 · 작업현황 · 일정 · 검수 · 협업)',
      scope: '교내 홈페이지 고도화 · 전체 약 200개 사이트 규모 · 약 10명 팀',
      summary: '복잡한 작업을 팀이 진행하고 검수할 수 있는 구조로 만들었다',
      problemTitle: '누가 어디까지 했는지, 팀 안에서도 보이지 않았다.',
      problem: '전체 약 200개 사이트 규모의 개편이었다. 선임 PM이 발주처 주요 커뮤니케이션을 맡았고, 나는 내부 PL로 서비스기획과 작업현황·일정·검수·협업을 맡았다. 작업이 어디까지 됐는지 담당별로 한눈에 보이지 않으니 검수를 시작할 기준도, 다음에 할 일도 흐려졌다.',
      didTitle: '보이게 만들고, 순서를 정했다.',
      did: ['Google Sheets에 담당 · 상태 · 기한 · 검수 · 잔여 작업이 한 화면에 보이도록 정리했다.', '작업 완료 → 검수 → 수정 요청 → 재확인 흐름으로 진행하며, 완료되는 사이트부터 검수했다.', '고객 자료가 늦는 항목 중 오픈 후 처리 가능한 범위는 발주처와 후속 처리 범위로 조정했다.', '약 100여 개 사이트의 1차 오픈을 진행했다.'],
      diagram: 'donga', diagramCap: '작업·검수 관리표의 구조 — 당시 시트를 바탕으로 설명용으로 재구성한 예시이며, 사이트명·상태·날짜는 실제 데이터가 아닙니다.',
      resultTitle: '약 100여 개 사이트의 1차 오픈.',
      result: '완료되는 사이트부터 검수하고 수정·재확인을 반복해 약 100여 개 사이트의 1차 오픈을 진행했다. 남은 항목은 발주처와 합의한 후속 처리 범위로 이어졌다.',
      note: '전체 총괄이나 단독 구축이 아니라 내부 PL의 역할이었습니다. "일정 지연 0건" 같은 표현은 확인된 사실이 아니어서 쓰지 않습니다.',
      next: 'cms',
    },
    cms: {
      no: 'Case 03', org: '핸디 통합 CMS · 2024.08 – 2025.05',
      t1: '반복되는 기능은 공통으로,', t2: '고객의 요구는 따로.',
      role: '핸디 · 서비스기획 (CMS 구조 · 관리자 IA · 화면과 흐름) · 개발 결과 검수',
      scope: '고객사 납품용 홈페이지 관리 CMS · 회원 · 게시판 · 팝업 · 메뉴 · 고객별 예약 · 신청',
      summary: '반복 제공할 기능과 개별 고객에게 필요한 기능의 범위를 구분해 기획',
      problemTitle: '고객마다 요구가 달라, 같은 기능도 매번 처음부터.',
      problem: '홈페이지를 납품할 때마다 회원가입·게시판·팝업·메뉴 같은 기능은 반복됐지만, 요구는 고객마다 조금씩 달랐다. 어디까지를 공통으로 두고 어디부터 고객별로 볼지 정하지 않으면, 기획과 검수가 매번 새로 시작됐다.',
      didTitle: '공통 기능을 먼저 세우고, 고객별 요구를 얹었다.',
      did: ['회원가입 · 게시판 · 팝업 · 메뉴 관리를 공통 기능으로 먼저 구성했다.', '예약 · 신청 등은 고객별 요구에 맞춰 추가하는 범위로 구분했다.', 'CMS 구조와 관리자 IA, 화면과 흐름을 기획했다.', '개발 결과를 검수하고 개선사항을 관리했다.'],
      diagram: 'cms', diagramCap: '공통 기능과 고객별 기능의 구분 — 설명용 도식.',
      resultTitle: '공통과 고객별의 경계가 기획의 기준이 됐다.',
      result: '공통 기능은 먼저 구성해 두고 고객별 요구는 추가 범위로 다뤘다. 개발 결과를 검수하고 개선사항을 관리하는 기준도 이 구분을 따랐다.',
      note: '서비스기획 경험입니다. 코드 재사용률이나 기술적 모듈화 성과가 확인된 것은 아닙니다. 개인 프로젝트 FLOWON과는 별개입니다.',
      next: 'sangji',
    },
    sangji: {
      no: 'Case 04', org: '상지건축 · 아리모아 · 2023.04 – 2023.09',
      t1: '요청 뒤의 목적을,', t2: '기능으로 구체화.',
      role: '아리모아 · PM / PL',
      scope: '홈페이지 리뉴얼 · 임직원 프로필 관리 기능',
      summary: '요청의 배경과 활용 목적을 확인하고 필요한 기능으로 구체화',
      problemTitle: '"임직원 프로필을 관리하고 싶다"만으로는 기능이 정해지지 않는다.',
      problem: '고객이 임직원 프로필 관리 기능을 요청했다. 그대로 만들면 목록과 등록 화면이 전부다. 하지만 왜 필요한지 듣지 않으면, 정작 쓰려는 장면에서 빠지는 기능이 생긴다.',
      didTitle: '필요한 이유를 듣고, 쓰는 장면에 맞춰 구체화했다.',
      did: ['요청의 배경을 확인했다 — 프로필을 영업자료로 활용하려는 목적이었다.', '등록한 직원의 프로필을 PDF로 내려받을 수 있도록 기능을 구성했다.', '프로필 등록 · 관리 화면과 흐름을 기획했다.'],
      diagram: 'sangji', diagramCap: '프로필 등록 → PDF 다운로드 — 설명용 도식.',
      resultTitle: '관리 기능이 아니라, 영업자료를 만드는 기능이 됐다.',
      result: '프로필을 등록하면 영업자료로 쓸 수 있는 PDF를 내려받을 수 있도록 구성했다.',
      note: '실제 영업 사용량이나 매출 효과는 확인되지 않았습니다.',
      next: 'eum',
    },
    eum: {
      labels: ['질문', '만든 것', '상태'],
      no: 'Case 05', org: '이음 · 개인 프로젝트 · Flutter',
      t1: '저장한 것을,', t2: '필요한 시간과 장소에서.',
      role: '개인 · 기획 · 구현 · 검증 (AI 코딩 도구와 함께)',
      scope: '메모 · 링크 · 이미지 · 쇼핑리스트 저장 → 시간 · 위치 리마인드 → 완료',
      summary: '시간·위치 기반 저장·리마인드 앱을 기획부터 구현·검증까지 직접 진행',
      problemTitle: '저장은 쉽고, 다시 꺼내는 건 어렵다.',
      problem: '메모와 링크는 쌓이지만 필요한 순간에 떠오르지 않는다. 저장한 것을 시간 또는 장소에 맞춰 다시 떠올리게 하려면, 저장 → 분류 → 백업 → 리마인드 → 완료의 흐름을 얼마나 짧게 만들 수 있는지가 핵심이었다.',
      didTitle: '흐름을 다섯 단계로 줄이고, 직접 구현했다.',
      did: ['저장: 메모 · 링크 · 이미지 · 쇼핑리스트, 외부 공유 수신으로 바로 저장', '분류: 기본 카테고리와 사용자 카테고리, 수신함 필터', '리마인드: 시간(템플릿 · 직접 선택)과 위치(지오펜스) 두 가지', '백업 · 복원: 로컬 우선 저장, 재로그인 시 복원', '검증: 단위 · 위젯 테스트와 릴리스 빌드 검증'],
      diagram: 'eum', diagramCap: '저장 → 시간 · 위치 → 리마인드 흐름 — 설명용 도식.',
      resultTitle: 'MVP 구현 완료, 출시 준비 단계.',
      result: '저장소 README 기준으로 MVP 기능이 구현됐고 릴리스 빌드를 검증했다. 스토어 출시와 실사용 성과는 아직 확인된 것이 없다.',
      note: '저장소가 있다는 사실과 출시·운영 성과는 구분합니다. README 상태가 최신이 아닐 수 있습니다.',
      next: 'flowon',
    },
    flowon: {
      labels: ['질문', '만든 것', '상태'],
      no: 'Case 06', org: 'FLOWON · 개인 프로젝트',
      t1: '고객마다 다른 웹서비스를,', t2: '같은 운영 구조로.',
      role: '개인 · 기획 · 설계 · 구현',
      scope: '홈페이지(3D 웹) · 고객센터 백엔드 · 운영관리 문서 체계',
      summary: '고객별 웹서비스를 제공하기 위한 운영 구조를 문서 · 백엔드 · 사이트로 설계·구축 중',
      problemTitle: '한 사람이 여러 고객의 웹서비스를 운영하려면, 무엇이 같아야 하는가.',
      problem: '회사에서 CMS를 기획하며 공통 기능과 고객별 기능을 나눴던 경험을, 이번에는 운영 구조 전체에 적용해 보고 있다. 고객마다 사이트는 다르지만 문의 접수 · 문서 · 보안 · 백업의 방식은 같아야 한다. 핸디의 통합 CMS와는 별개의 개인 프로젝트다.',
      didTitle: '운영 구조를 먼저 문서로 고정하고, 부분부터 구축했다.',
      did: ['운영관리 문서 체계: 정책 · 스키마 · 변경 기록을 버전으로 관리', '고객센터 백엔드: 인증 · 권한 · 백업/복구 · 보안 검증을 우선한 구조', '홈페이지: 3D 인터랙티브 웹으로 구축 · 배포'],
      diagram: 'flowon', diagramCap: '운영 구조 개요 — 설명용 도식.',
      resultTitle: '설계 · 구축 진행 중.',
      result: '홈페이지는 배포됐고, 고객센터 백엔드와 운영 문서 체계는 단계별로 구축 중이다. 고객 운영 성과는 아직 없다.',
      note: '진행 중인 개인 프로젝트로, 출시·운영 성과로 읽히지 않도록 상태만 적었습니다.',
      next: 'insight',
    },
    insight: {
      labels: ['질문', '만든 것', '상태'],
      no: 'Case 07', org: 'AI Insight OS · 개인 프로젝트',
      t1: 'AI가 모은 정보를,', t2: '근거와 승인을 거쳐 쓰기.',
      role: '개인 · 기획 · 구현 · 검증',
      scope: 'URL · PDF 수집 → 근거(Claim · Evidence) → 승인 → 재사용 추천 → 산출물',
      summary: '정보 수집부터 재사용까지, 사람의 승인 없이는 넘어가지 않는 흐름을 설계·구현',
      problemTitle: 'AI가 정리한 정보는 어디까지 믿고 써도 되는가.',
      problem: '수집한 정보가 곧바로 결과물이 되면 근거가 사라진다. 사실과 추론을 분리하고, 각 단계에서 사람이 승인해야 다음으로 넘어가는 흐름이 필요했다.',
      didTitle: '승인 관문이 있는 흐름을 만들었다.',
      did: ['수집: URL · PDF를 근거 단위(Claim · Evidence)로 분해', '승인: 자산 · 추천 · 산출물 단계마다 명시적 승인 관문', '재사용: 승인된 자산을 프로젝트에 연결해 추천 · 산출물 생성', '검증: 사실 · 추론 분리와 근거 추적을 검증 항목으로 관리'],
      diagram: 'insight', diagramCap: '수집 → 근거 → 승인 → 재사용 흐름 — 설명용 도식.',
      resultTitle: '비공개 빌드.',
      result: '개인 용도의 비공개 빌드로 구현·검증 중이며, 외부 사용자나 운영 성과는 없다.',
      note: '저장소 상태 기준으로 적었고, 출시나 실사용 성과로 표현하지 않습니다.',
      next: 'arpina',
    },
  };

  function buildCase(key) {
    if (key === 'arpina') return $('#tpl-arpina').content.cloneNode(true);
    const d = CASES[key]; if (!d) return null;
    const frag = $('#tpl-generic').content.cloneNode(true);
    const set = (f, v, isHTML) => { const el = frag.querySelector(`[data-f="${f}"]`); if (el) { if (isHTML) el.innerHTML = v; else el.textContent = v; } };
    ['no', 'org', 't1', 't2', 'role', 'scope', 'summary', 'problemTitle', 'problem', 'didTitle', 'diagramCap', 'resultTitle', 'result', 'note'].forEach(f => set(f, d[f]));
    set('did', d.did.map(s => `<li>${s}</li>`).join(''), true);
    set('diagram', DG[d.diagram](11), true);
    set('nextTitle', TITLES[d.next]);
    frag.querySelector('[data-f="nextLink"]').setAttribute('href', '#/work/' + d.next);
    if (d.labels) frag.querySelectorAll('.case__label').forEach((el, i) => { el.lastChild.textContent = d.labels[i]; });
    return frag;
  }

  let currentCase = null;
  function openCase(key, push = true) {
    const content = buildCase(key); if (!content) return;
    const wasOpen = currentCase !== null;
    currentCase = key;
    if (wasOpen) {
      caseInner.style.transition = 'opacity .25s'; caseInner.style.opacity = '0';
      setTimeout(() => { caseInner.replaceChildren(content); caseEl.scrollTop = 0; caseInner.style.opacity = '1'; }, 260);
    } else {
      caseInner.replaceChildren(content); caseEl.scrollTop = 0;
      caseEl.hidden = false;
      html.classList.add('is-case'); page.classList.add('is-pushed');
      void caseEl.offsetWidth;                 // 강제 리플로우 → 전환이 확실히 일어난다 (rAF는 숨겨진 탭에서 멈춤)
      caseEl.classList.add('is-open');
    }
    if (push) history.pushState({ c: key }, '', '#/work/' + key);
    document.title = TITLES[key] + ' — 양순민';
  }
  function closeCase(push = true) {
    if (currentCase === null) return;
    currentCase = null;
    caseEl.classList.remove('is-open'); page.classList.remove('is-pushed'); html.classList.remove('is-case');
    setTimeout(() => { if (currentCase === null) { caseEl.hidden = true; caseInner.replaceChildren(); } }, 720);
    if (push) history.pushState(null, '', location.pathname + '#work');
    document.title = '양순민 — 흩어진 요구를 한 줄의 정책으로';
  }
  function route(push) {
    const m = location.hash.match(/^#\/work\/([a-z]+)$/);
    if (m && (CASES[m[1]] || m[1] === 'arpina')) openCase(m[1], push); else closeCase(push);
  }

  $$('.row[data-case]').forEach(row => {
    const go = () => openCase(row.dataset.case);
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  caseEl.addEventListener('click', e => {
    const close = e.target.closest('[data-close]'); if (close) { closeCase(); return; }
    const next = e.target.closest('a[href^="#/work/"]'); if (next) { e.preventDefault(); openCase(next.getAttribute('href').slice(7)); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && currentCase) closeCase(); });
  addEventListener('popstate', () => route(false));

  /* ------------------------------------------------------------
     7. 커서 · 인물 사진 패럴랙스 · 시작
     ------------------------------------------------------------ */
  const cursor = $('#cursor');
  if (mqHover.matches && !reduced) {
    body.classList.add('has-cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring');
    let rx = 0, ry = 0, tx = 0, ty = 0, shown = false;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; rx = tx; ry = ty; cursor.style.opacity = '1'; } dot.style.transform = `translate3d(${tx}px,${ty}px,0)`; }, { passive: true });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
    addEventListener('mousedown', () => cursor.classList.add('is-down'));
    addEventListener('mouseup', () => cursor.classList.remove('is-down'));
    addEventListener('mouseover', e => { cursor.classList.toggle('is-hover', !!e.target.closest('a, button, [data-hover]')); });
    (function ringLoop() { rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18; ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`; requestAnimationFrame(ringLoop); })();
  }

  const photo = $('#aboutPhoto img');
  if (photo && !reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { photoVisible = en.isIntersecting; });
    }, { threshold: 0 });
    let photoVisible = false; io.observe(photo);
    addEventListener('scroll', () => {
      if (!photoVisible) return;
      const r = photo.getBoundingClientRect();
      const t = (r.top + r.height / 2 - vh / 2) / vh;
      photo.style.transform = `translateY(${(t * -36).toFixed(1)}px)`;
    }, { passive: true });
  }

  // 시작: 폰트 준비 후 제목 등장, 그다음 루프
  measure();
  const start = () => { readyAt = performance.now(); body.classList.add('is-ready'); route(false); requestAnimationFrame(loop); };
  // 디버그용 (시안 확인): 숨겨진 탭에서는 rAF가 멈추므로 특정 진행도를 즉시 그릴 수 있게 한다
  window.__scene = { T, S, measure, onScroll, renderAt(p, mx = 0, my = 0) { T.p = S.p = p; T.mx = S.mx = mx; T.my = S.my = my; render(performance.now()); } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start).catch(start); else start();
  setTimeout(() => { if (!readyAt) start(); }, 2500);
})();

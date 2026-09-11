/* 상세 페이지 — 등장(IntersectionObserver)만. 스크롤 연출 없음. */
(() => {
  'use strict';
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  document.querySelectorAll('.rv, [data-in]').forEach(el => io.observe(el));
  document.body.classList.add('is-ready');
})();

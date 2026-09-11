/* Detail content is readable without script. Tables remain keyboard-scrollable after resizing. */
(() => {
  'use strict';
  document.body.classList.add('is-ready');
  document.querySelectorAll('.sheet-wrap').forEach(el => {
    const update = () => {
      const overflows = el.scrollWidth > el.clientWidth;
      el.tabIndex = overflows ? 0 : -1;
      if (overflows) {
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', '작업·검수 관리표, 좌우로 스크롤할 수 있습니다');
      } else {
        el.removeAttribute('role'); el.removeAttribute('aria-label');
      }
    };
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(el);
    else addEventListener('resize', update);
  });
})();

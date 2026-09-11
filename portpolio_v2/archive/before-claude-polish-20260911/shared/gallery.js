/* Three persistent summaries; shared preview priority: keyboard > pointer > scroll. */
(() => {
  'use strict';
  const gallery = document.querySelector('.case-gallery');
  if (!gallery) return;
  const rows = [...gallery.querySelectorAll('[data-case]')];
  const slides = [...gallery.querySelectorAll('[data-preview]')];
  const preview = gallery.querySelector('.gallery-preview');
  const wide = matchMedia('(min-width:861px)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  let scrollKey = rows[0].dataset.case, pointerKey = null, focusKey = null, activeKey = null, raf = 0;
  let pointerX = -1, pointerY = -1, pointerInside = false;

  function render() {
    const key = focusKey || pointerKey || scrollKey;
    if (key === activeKey) return;
    activeKey = key;
    gallery.dataset.activeCase = key;
    rows.forEach(row => row.classList.toggle('is-active', row.dataset.case === key));
    slides.forEach(slide => {
      const active = slide.dataset.preview === key;
      slide.classList.toggle('is-active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      slide.tabIndex = active ? 0 : -1;
    });
    gallery.dispatchEvent(new CustomEvent('gallerychange', {detail:{key}}));
  }
  function updateScroll() {
    raf = 0;
    // Use a stable reading line near the preview; a stationary cursor does not pin old work.
    const line = Math.min(innerHeight * .4, 300);
    let key = rows[0].dataset.case;
    rows.forEach(row => { if (row.getBoundingClientRect().top <= line) key = row.dataset.case; });
    scrollKey = key;
    if (pointerInside) {
      const b = preview.getBoundingClientRect();
      const stillInside = pointerX>=b.left && pointerX<=b.right && pointerY>=b.top && pointerY<=b.bottom;
      if (!stillInside) { pointerInside=false; pointerKey=null; preview.classList.remove('is-pointing'); }
    }
    render();
  }
  function onScroll() {
    pointerKey = null;
    if (!raf) raf = requestAnimationFrame(updateScroll);
  }
  rows.forEach(row => {
    row.addEventListener('pointermove', event => {
      if (!wide.matches || !fine.matches || event.pointerType === 'touch') return;
      pointerKey = row.dataset.case;
      render();
    });
    row.addEventListener('pointerleave', event => {
      // Keep the selected image while crossing into the neighboring preview.
      if (event.relatedTarget && gallery.contains(event.relatedTarget)) return;
      pointerKey = null; render();
    });
    row.addEventListener('focusin', () => { focusKey=row.dataset.case; render(); });
  });
  gallery.addEventListener('focusout', event => {
    if (event.relatedTarget && preview.contains(event.relatedTarget)) return;
    const nextRow = event.relatedTarget?.closest?.('[data-case]');
    focusKey = nextRow?.dataset.case || null; render();
  });
  preview.addEventListener('pointerenter', () => { pointerInside=true; pointerKey=activeKey; });
  preview.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType==='touch') return;
    pointerX=event.clientX; pointerY=event.clientY;
    const b=preview.getBoundingClientRect();
    const onImage=event.target.closest('.gallery-media');
    preview.classList.toggle('is-pointing', !!onImage);
    preview.style.setProperty('--cursor-x', (event.clientX-b.left)+'px');
    preview.style.setProperty('--cursor-y', (event.clientY-b.top)+'px');
  });
  preview.addEventListener('pointerleave', event => {
    pointerInside=false; preview.classList.remove('is-pointing');
    if (!event.relatedTarget || !gallery.contains(event.relatedTarget)) { pointerKey=null; render(); }
  });
  gallery.addEventListener('pointerleave', () => { pointerKey=null; render(); });
  function measure() {
    gallery.classList.toggle('is-enhanced', wide.matches);
    if (!wide.matches) { pointerKey=null; focusKey=null; preview.classList.remove('is-pointing'); }
    updateScroll();
  }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  wide.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(gallery.querySelector('.gallery-list'));
  measure();
})();

/* One expressive arrival, then a stable reading state. No idle animation loop. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  const targets = [...document.querySelectorAll('[data-arrive], [data-motion]')];
  let disabled = false;
  function reveal(target, animate = true) {
    target.classList.remove('arrival-pending', 'motion-wait');
    if (animate && target.hasAttribute('data-motion')) target.classList.add('motion-in');
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.3) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3, rootMargin: '0px 0px -32px 0px' });
  root.classList.add('lower-motion');
  targets.forEach(target => {
    if (target.getBoundingClientRect().bottom <= 0) return;
    target.classList.add(target.hasAttribute('data-motion') ? 'motion-wait' : 'arrival-pending');
  });
  // Paint the starting pose before entering, including direct anchor arrivals.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!disabled) targets.forEach(target => observer.observe(target));
  }));
  function resetPointer(target) {
    ['--tilt-x','--tilt-y','--shadow-x','--magnet-x','--magnet-y'].forEach(key => target.style.removeProperty(key));
  }
  const interactive = [...document.querySelectorAll('[data-motion="product"], .contact__mail, .contact__chat')];
  function revealAll() {
    disabled = true;
    observer.disconnect();
    root.classList.remove('lower-motion');
    targets.forEach(target => { reveal(target, false); target.classList.remove('motion-in'); });
    interactive.forEach(resetPointer);
  }
  reduce.addEventListener('change', event => { if (event.matches) revealAll(); });
  window.addEventListener('beforeprint', revealAll);
  document.addEventListener('focusin', event => {
    const target = event.target.closest('[data-arrive], [data-motion]');
    if (target) { reveal(target, false); observer.unobserve(target); }
  });
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  interactive.forEach(target => {
    target.addEventListener('pointermove', event => {
      if (disabled || !finePointer.matches || event.pointerType === 'touch') return;
      const box = target.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
      if (target.dataset.motion === 'product') {
        target.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
        target.style.setProperty('--tilt-y', `${(x * 11).toFixed(2)}deg`);
        target.style.setProperty('--shadow-x', `${(x * -12).toFixed(2)}px`);
      } else {
        target.style.setProperty('--magnet-x', `${(x * 5).toFixed(2)}px`);
        target.style.setProperty('--magnet-y', `${(y * 3).toFixed(2)}px`);
      }
    });
    target.addEventListener('pointerleave', () => resetPointer(target));
    target.addEventListener('blur', () => resetPointer(target));
  });
})();

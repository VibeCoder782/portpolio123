/* One arrival per element. Native links and disclosures need no script. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  const targets = [...document.querySelectorAll('[data-arrive]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('arrival-pending');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
  document.documentElement.classList.add('lower-motion');
  targets.forEach(target => {
    if (target.getBoundingClientRect().top >= innerHeight) {
      target.classList.add('arrival-pending');
      observer.observe(target);
    }
  });
  function revealAll() {
    observer.disconnect();
    targets.forEach(target => target.classList.remove('arrival-pending'));
  }
  reduce.addEventListener('change', event => { if (event.matches) revealAll(); });
  window.addEventListener('beforeprint', revealAll);
  document.addEventListener('focusin', event => {
    event.target.closest('[data-arrive]')?.classList.remove('arrival-pending');
  });
})();

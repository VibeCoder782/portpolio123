const artwork = document.querySelector('#artwork');
const motionButton = document.querySelector('#motion-toggle');
const originalButton = document.querySelector('#original-toggle');
const originalImage = document.querySelector('.original');
const composition = document.querySelector('.composition');
const status = document.querySelector('#status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let wantsMotion = !reducedMotion.matches;
let inView = false;
let showOriginal = false;
let ready = false;

function update() {
  const running = ready && wantsMotion && inView && !document.hidden && !showOriginal;
  artwork.dataset.running = String(running);
  artwork.dataset.original = String(showOriginal);
  originalImage.hidden = !showOriginal;
  composition.setAttribute('aria-hidden', String(showOriginal));
  motionButton.disabled = !ready || showOriginal;
  motionButton.setAttribute('aria-pressed', String(wantsMotion));
  motionButton.textContent = wantsMotion ? '움직임 정지' : '움직임 재생';
  originalButton.setAttribute('aria-pressed', String(showOriginal));
  originalButton.textContent = showOriginal ? '움직임 시안으로' : '원본 이미지';
  status.textContent = showOriginal ? '원본 이미지' : !ready ? '이미지를 준비하고 있습니다.' : running ? '작은 움직임 재생 중' : '움직임 정지';
}
motionButton.addEventListener('click', () => { wantsMotion = !wantsMotion; update(); });
originalButton.addEventListener('click', () => { showOriginal = !showOriginal; update(); });
document.addEventListener('visibilitychange', update);
reducedMotion.addEventListener('change', () => { wantsMotion = !reducedMotion.matches; update(); });
const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
observer.observe(artwork);

// SVG transforms shrink with the entire viewBox. Compensate on narrow
// artwork so the same movement remains visible in a small browser panel.
const sizeObserver = new ResizeObserver(([entry]) => {
  const width = entry.contentRect.width;
  if (width > 0) artwork.style.setProperty('--motion-scale', String(Math.min(3, Math.max(1, 800 / width))));
});
sizeObserver.observe(artwork);

async function prepare() {
  try {
    const background = new Image();
    background.src = 'cms-background-v1.png';
    await Promise.all([background.decode(), originalImage.decode()]);
    ready = true;
    originalButton.disabled = false;
    update();
  } catch {
    wantsMotion = false;
    showOriginal = true;
    update();
    status.textContent = '움직임 시안을 불러오지 못해 원본을 표시합니다. 새로고침해 주세요.';
  }
}
prepare();

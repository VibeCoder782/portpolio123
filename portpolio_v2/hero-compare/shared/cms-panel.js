/* CMS-only progressive enhancement. Reuses the local Three.js bundle. */
const host = document.querySelector('[data-cms-panel]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
let controller, loading = false, failed = false;

async function prepare() {
  if (!host || reduce.matches || failed || loading || controller) return;
  loading = true;
  try {
    const T = await import('./vendor/three-0.186.0/three.module.js');
    const img = host.querySelector('img');
    await img.decode();
    if (!reduce.matches) controller = createPanel(T, img);
  } catch (error) {
    failed = true;
    host.dataset.panelState = 'fallback';
    console.warn('04 입체 효과 대신 원본 이미지를 표시합니다.', error);
  } finally { loading = false; }
}

function createPanel(T, img) {
  const renderer = new T.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'cms-panel-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, 1, 3000);
  const board = new T.Group();
  scene.add(board);
  const texture = new T.Texture(img);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  // Preserve the illustration's colors; lighting is a restrained surface overlay.
  const faceMaterial = new T.MeshBasicMaterial({ map:texture });
  const faceGeometry = new T.PlaneGeometry(1, 1);
  const face = new T.Mesh(faceGeometry, faceMaterial);
  face.position.z = 1;
  board.add(face);
  const edgeGeometry = new T.BoxGeometry(1, 1, 1.6);
  const edgeMaterial = new T.MeshStandardMaterial({ color:0xd8d3c9, roughness:0.95 });
  const edge = new T.Mesh(edgeGeometry, edgeMaterial);
  board.add(edge);
  scene.add(new T.AmbientLight(0xffffff, 1.8));
  const light = new T.DirectionalLight(0xfff9ee, 2);
  light.position.set(-200, 300, 600);
  scene.add(light);
  const sheenMaterial = new T.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uPointer:{value:new T.Vector2(.35,.65)}, uStrength:{value:.025} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec2 vUv; uniform vec2 uPointer; uniform float uStrength;
      void main(){ vec2 d=(vUv-uPointer)*vec2(.8,1.); float glow=exp(-dot(d,d)*5.);
      gl_FragColor=vec4(1.,.985,.96,glow*uStrength); }`
  });
  const sheen = new T.Mesh(faceGeometry, sheenMaterial);
  sheen.position.z = 1.15;
  board.add(sheen);
  const shadowGeometry = new T.PlaneGeometry(1, 1);
  const shadowMaterial = new T.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{ uOpacity:{value:.13} },
    vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv; uniform float uOpacity;
      void main(){vec2 d=max(abs(vUv-.5)-vec2(.36,.32),0.);float a=exp(-dot(d,d)*95.);
      float edge=smoothstep(0.,.07,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));
      gl_FragColor=vec4(.13,.12,.10,a*edge*uOpacity);}`
  });
  const shadow = new T.Mesh(shadowGeometry, shadowMaterial);
  shadow.position.z = -8;
  scene.add(shadow);

  let frame=0, last=0, elapsed=0, visible=false, dead=false, started=false;
  let width=0, height=0, boardWidth=0, boardHeight=0;
  let targetX=0, targetY=0, currentX=0, currentY=0;
  let renderCount=0;
  const duration=1100;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const active=()=>visible && !reduce.matches && !document.hidden && !dead;
  const stop=()=>{ cancelAnimationFrame(frame); frame=0; last=0; };

  function render() {
    const progress=clamp(elapsed/duration,0,1);
    const settle=1-Math.pow(1-progress,3);
    const lift=1-settle;
    const narrow=width<400 ? .7 : 1;
    board.rotation.set((-.175*lift+currentY*.035)*narrow,(-.175*lift+currentX*.045)*narrow,-.022*lift);
    board.position.set(0,-14*lift,24*lift);
    shadow.position.set(-currentX*3,-6-10*lift, -8);
    shadow.scale.set(boardWidth*(1.19+.12*lift),boardHeight*(1.28+.12*lift),1);
    shadowMaterial.uniforms.uOpacity.value=.13-.055*lift;
    sheenMaterial.uniforms.uPointer.value.set(.5+currentX*.24,.6-currentY*.2);
    sheenMaterial.uniforms.uStrength.value=.025+.045*lift+(Math.abs(currentX)+Math.abs(currentY))*.025;
    renderer.render(scene,camera);
    // Review-only diagnostics: actual rendered pose and an idle-render check.
    if(replay) {
      canvas.dataset.pose=[board.rotation.x,board.rotation.y,board.position.z].map(n=>n.toFixed(3)).join(',');
      canvas.dataset.renderCount=String(++renderCount);
    }
  }
  function tick(now) {
    frame=0;
    if(!active()) { last=0; return; }
    const dt=last ? Math.min(now-last,50) : 16;
    last=now;
    elapsed=Math.min(duration,elapsed+dt);
    const damping=1-Math.exp(-dt/110);
    currentX+=(targetX-currentX)*damping;
    currentY+=(targetY-currentY)*damping;
    if(Math.abs(targetX-currentX)<.001) currentX=targetX;
    if(Math.abs(targetY-currentY)<.001) currentY=targetY;
    render();
    if(elapsed<duration || currentX!==targetX || currentY!==targetY) frame=requestAnimationFrame(tick);
    else last=0;
  }
  function requestFrame() { if(active() && !frame) frame=requestAnimationFrame(tick); }
  function resetPointer() { targetX=targetY=0; requestFrame(); }
  function resize() {
    const box=host.getBoundingClientRect();
    width=box.width; height=box.height;
    if(!width || !height) return;
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.position.z=height/(2*Math.tan(T.MathUtils.degToRad(18)));
    camera.updateProjectionMatrix();
    boardHeight=Math.min(height*.9,width/1.5*.9);
    boardWidth=boardHeight*1.5;
    face.scale.set(boardWidth,boardHeight,1);
    edge.scale.set(boardWidth,boardHeight,1);
    sheen.scale.set(boardWidth,boardHeight,1);
    render();
    requestFrame();
  }
  function sync() {
    if(dead) return;
    const enabled=!reduce.matches;
    host.dataset.panelState=enabled?'ready':'fallback';
    canvas.hidden=!enabled;
    if(replay) replay.hidden=!enabled;
    if(!active()) stop(); else requestFrame();
  }
  function move(event) {
    if(!pointer.matches || event.pointerType==='touch' || reduce.matches) return;
    const box=host.getBoundingClientRect();
    targetX=clamp((event.clientX-box.left)/box.width*2-1,-1,1);
    targetY=clamp((event.clientY-box.top)/box.height*2-1,-1,1);
    requestFrame();
  }
  function onPointerCapability() { if(!pointer.matches) resetPointer(); }
  function replayEntrance() {
    elapsed=0; targetX=targetY=currentX=currentY=0; last=0;
    requestFrame();
  }
  let replay;
  if(new URLSearchParams(location.search).get('review')?.startsWith('cms-panel')) {
    replay=document.createElement('button');
    replay.type='button'; replay.className='cms-panel-replay';
    replay.textContent='효과 다시 보기 ↻';
    replay.setAttribute('aria-label','04 입체 효과 다시 보기');
    replay.addEventListener('click',replayEntrance);
    host.closest('article').append(replay);
  }
  const observer=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting && entry.intersectionRatio>=.3;
    if(visible && !started) { started=true; elapsed=0; }
    if(!visible) { targetX=targetY=0; }
    sync();
  },{threshold:[0,.3],rootMargin:'0px 0px -20px 0px'});
  const sizeObserver=new ResizeObserver(resize);
  function dispose() {
    if(dead) return;
    dead=true; stop(); observer.disconnect(); sizeObserver.disconnect();
    host.dataset.panelState='fallback';
    host.removeEventListener('pointermove',move);
    host.removeEventListener('pointerleave',resetPointer);
    document.removeEventListener('visibilitychange',sync);
    pointer.removeEventListener('change',onPointerCapability);
    replay?.remove(); canvas.remove();
    texture.dispose(); faceGeometry.dispose(); edgeGeometry.dispose(); shadowGeometry.dispose();
    faceMaterial.dispose(); edgeMaterial.dispose(); sheenMaterial.dispose(); shadowMaterial.dispose();
    renderer.dispose();
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;dispose();});
  host.addEventListener('pointermove',move);
  host.addEventListener('pointerleave',resetPointer);
  pointer.addEventListener('change',onPointerCapability);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',event=>{if(event.persisted) stop(); else dispose();});
  window.addEventListener('pageshow',sync);
  try {
    resize();
    host.append(canvas);
    host.dataset.panelState='ready';
    sizeObserver.observe(host); observer.observe(host);
  } catch(error) {dispose();throw error;}
  return {sync};
}

if(host) {
  const near=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)) prepare();},{rootMargin:'400px'});
  near.observe(host);
  reduce.addEventListener('change',()=>controller?controller.sync():prepare());
}

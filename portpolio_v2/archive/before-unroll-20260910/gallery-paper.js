/* Local Three.js progressive enhancement. Native images/links remain the fallback. */
const gallery = document.querySelector('.case-gallery');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const wide = matchMedia('(min-width:861px)');
const motionButton = gallery?.querySelector('.gallery-motion-toggle');
let controller, loading = false, failed = false, paused = false;
const motionOff = () => reduced.matches || paused;
motionButton?.addEventListener('click', () => {
  paused = !paused;
  controller?.sync();
});

async function start() {
  if (!gallery || motionOff() || loading || failed || controller) return;
  loading = true;
  try {
    const THREE = await import('./vendor/three-0.186.0/three.module.js');
    controller = await createPaper(THREE);
    controller.sync();
  } catch (error) {
    failed = true;
    gallery.dataset.paper = 'fallback';
    console.warn('사진 입체 효과 대신 원본 이미지를 표시합니다.', error);
  } finally { loading = false; }
}
const near = new IntersectionObserver(entries => {
  if (entries.some(e => e.isIntersecting)) start();
}, {rootMargin:'240px'});
if (gallery) near.observe(gallery);
reduced.addEventListener('change', () => controller ? controller.sync() : start());

async function createPaper(T) {
  const renderer = new T.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.autoClear = false;
  const canvas = renderer.domElement;
  canvas.className = 'gallery-paper-canvas';
  canvas.setAttribute('aria-hidden','true');
  gallery.prepend(canvas);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(45, 1, 1, 2400);
  camera.position.z = 1000;
  const geometry = new T.PlaneGeometry(1,1,40,28);
  const vertexShader = `
    uniform vec2 uSize;
    uniform float uTime, uBend, uIdle, uTravel;
    varying vec2 vUv;
    varying float vLight;
    void main() {
      vUv=uv;
      vec3 p=position;
      p.xy*=uSize;
      float edge=pow(abs(uv.x-.5)*2.,2.5);
      float lower=pow(1.-uv.y,2.);
      float breeze=sin(uTime*1.02+uv.y*2.3+uv.x*1.4);
      // Quiet center, slow irregular edges; about six seconds per main cycle.
      float idle=(edge*.8+lower*.35)*breeze*uIdle;
      float fold=sin(uv.y*3.14159+uTravel*.9)*uBend;
      p.z+=idle+fold;
      p.y+=idle*.17 + sin(uv.x*3.14159)*uBend*.15;
      vLight=1.+clamp((idle*.0018+cos(uv.y*3.14159)*uBend*.001),-.13,.08);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    }`;
  const fragmentShader = `
    uniform sampler2D uMap;
    uniform float uOpacity;
    varying vec2 vUv;
    varying float vLight;
    void main() {
      vec4 tex=texture2D(uMap,vUv);
      gl_FragColor=vec4(tex.rgb*vLight,tex.a*uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const records = [];
  let frame=0, last=0, elapsed=0, inView=false, dead=false, viewportWidth=0, viewportHeight=0;
  let tiltX=0, tiltY=0, targetX=0, targetY=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const desktopMedia=[...gallery.querySelectorAll('.gallery-slide .gallery-media')];
  const mobileMedia=[...gallery.querySelectorAll('.gallery-mobile .gallery-media')];
  try {
    for (const media of [...desktopMedia,...mobileMedia]) {
      const img=media.querySelector('img');
      await img.decode();
      const desktop=!!media.closest('.gallery-slide');
      const key=(media.closest('[data-preview]')?.dataset.preview || media.closest('[data-case]').dataset.case);
      const material=new T.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{
        uMap:{value:null},uSize:{value:new T.Vector2()},uTime:{value:0},uBend:{value:0},uIdle:{value:0},uTravel:{value:0},uOpacity:{value:0}
      }});
      const mesh=new T.Mesh(geometry,material);
      mesh.frustumCulled=false; scene.add(mesh);
      records.push({media,img,key,desktop,mesh,material,texture:null,textureWidth:0,visible:false,entered:false,progress:0,opacity:0,y:0,bend:0,rotation:0,transition:null});
    }
  } catch(error) { dispose(); throw error; }

  function textureFor(r,w,h) {
    if (r.texture && Math.abs(r.textureWidth-w)<1) return;
    const surface=document.createElement('canvas');
    surface.width=Math.round(w*2);surface.height=Math.round(h*2);
    const ctx=surface.getContext('2d'); ctx.scale(2,2);
    ctx.fillStyle=r.key==='arpina'?'#fff':r.key==='sangji'?'#303236':'#e5e7eb';
    ctx.fillRect(0,0,w,h);
    if(r.key==='arpina') {
      // Same original crop as gallery.css, not a modified source asset.
      const crop=r.desktop?[395,925,610,390]:[390,925,306,390];
      ctx.drawImage(r.img,...crop,0,0,w,h);
    } else {
      const pad=r.key==='sangji'&&r.desktop?0:r.desktop?22:16;
      const iw=r.img.naturalWidth,ih=r.img.naturalHeight;
      const cover=r.key==='sangji'&&r.desktop;
      const scale=(cover?Math.max:Math.min)((w-pad*2)/iw,(h-pad*2)/ih);
      ctx.drawImage(r.img,(w-iw*scale)/2,(h-ih*scale)/2,iw*scale,ih*scale);
    }
    r.texture?.dispose();r.texture=new T.CanvasTexture(surface);
    r.texture.colorSpace=T.SRGBColorSpace;
    r.texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    r.material.uniforms.uMap.value=r.texture;r.textureWidth=w;
  }
  function sizeViewport() {
    if(dead)return;
    viewportWidth=document.documentElement.clientWidth;viewportHeight=innerHeight;
    renderer.setSize(viewportWidth,viewportHeight,false);
    camera.aspect=viewportWidth/viewportHeight;
    camera.fov=2*Math.atan(viewportHeight/2000)*180/Math.PI;
    camera.updateProjectionMatrix();
  }
  function resize() {sizeViewport();wake();}
  function transition(r,enter,h) {
    if(enter&&!r.opacity) {r.y=h*.31;r.bend=95*(r.desktop?1:.55);r.rotation=-.09;}
    r.transition={start:elapsed,from:[r.opacity,r.y,r.bend,r.rotation],to:enter?[1,0,0,0]:[0,-h*.27,-55,-.07],duration:enter?1.08:.72};
    r.visible=enter;r.entered=true;
  }
  function paint(now) {
    try { draw(now); }
    catch(error) { dispose(); gallery.dataset.paper='fallback'; console.warn('사진 원본 표시로 복구했습니다.',error); }
  }
  function draw(now) {
    frame=0;
    if(dead || motionOff() || document.hidden || !inView) {last=0;return;}
    if(viewportWidth!==document.documentElement.clientWidth || viewportHeight!==innerHeight) sizeViewport();
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;
    tiltX+=(targetX-tiltX)*(1-Math.exp(-dt*7));tiltY+=(targetY-tiltY)*(1-Math.exp(-dt*7));
    const bounds=gallery.getBoundingClientRect();
    renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
    records.forEach(r=>r.mesh.visible=false);
    for(const r of records) {
      const enabled=r.desktop===wide.matches;
      if(!enabled) {r.visible=false;r.opacity=0;r.entered=false;r.transition=null;continue;}
      // Desktop images use the active slot's stable rectangle, independent of CSS crossfade.
      const box=(r.desktop?desktopMedia.find(m=>m.closest('.gallery-slide').classList.contains('is-active')):r.media).getBoundingClientRect();
      if(!box.width||!box.height) continue;
      const onScreen=box.top<viewportHeight-24 && box.bottom>80;
      const selected=!r.desktop||gallery.dataset.activeCase===r.key;
      const shouldShow=selected&&onScreen;
      if(shouldShow!==r.visible) transition(r,shouldShow,box.height);
      if(!r.entered) continue;
      if(r.transition) {
        const tr=r.transition,p=clamp((elapsed-tr.start)/tr.duration,0,1),ease=1-Math.pow(1-p,3);
        [r.opacity,r.y,r.bend,r.rotation]=tr.from.map((v,i)=>v+(tr.to[i]-v)*ease);
        if(p===1) r.transition=null;
      }
      if(r.opacity<.001) continue;
      textureFor(r,box.width,box.height);
      const u=r.material.uniforms;
      u.uSize.value.set(box.width,box.height);u.uTime.value=elapsed+r.key.length*.41;
      u.uBend.value=r.bend;u.uTravel.value=r.y/box.height;
      u.uIdle.value=(r.key==='arpina'?7:10)*(r.desktop?1:.55);
      u.uOpacity.value=r.opacity;
      r.mesh.position.set(box.left+box.width/2-viewportWidth/2,viewportHeight/2-box.top-box.height/2-r.y,0);
      r.mesh.rotation.set(r.rotation+(r.desktop?tiltX:0),r.desktop?tiltY:0,0);
      r.mesh.visible=true;
      // Small breathing room for curved edges; keep captions/neighboring sections clear.
      const left=Math.max(0,box.left-18),right=Math.min(viewportWidth,box.right+18);
      const top=Math.max(0,bounds.top,box.top-15),bottom=Math.min(viewportHeight,bounds.bottom,box.bottom+17);
      if(bottom>top) {
        renderer.setScissor(left,viewportHeight-bottom,right-left,bottom-top);
        renderer.render(scene,camera);
      }
      r.mesh.visible=false;
    }
    renderer.setScissorTest(false);
    gallery.classList.add('has-paper');
    records.forEach(r=>r.media.classList.add('paper-ready'));
    gallery.dataset.paper='ready';
    frame=requestAnimationFrame(paint);
  }
  function wake() {if(!frame&&!dead&&!motionOff()&&!document.hidden&&inView) frame=requestAnimationFrame(paint);}
  function sync() {
    if(dead)return;
    gallery.classList.toggle('has-paper',!motionOff());
    canvas.hidden=motionOff();
    motionButton.hidden=false;
    motionButton.disabled=reduced.matches;
    motionButton.textContent=motionOff()?'사진 움직임 꺼짐':'사진 움직임 켜짐';
    motionButton.setAttribute('aria-pressed',String(!motionOff()));
    gallery.dataset.paper=motionOff()?'paused':'ready';
    if(motionOff()) {cancelAnimationFrame(frame);frame=0;last=0;} else wake();
  }
  const visibleObserver=new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;
    if(!inView){cancelAnimationFrame(frame);frame=0;last=0;}else wake();
  });visibleObserver.observe(gallery);
  gallery.addEventListener('pointermove',e=>{
    const box=gallery.querySelector('.gallery-slide.is-active .gallery-media').getBoundingClientRect();
    if(!wide.matches||e.pointerType==='touch'||e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom){targetX=targetY=0;return;}
    targetX=clamp((e.clientY-box.top)/box.height-.5,-.5,.5)*-.06;
    targetY=clamp((e.clientX-box.left)/box.width-.5,-.5,.5)*.075;
  },{passive:true});
  gallery.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  gallery.addEventListener('gallerychange',wake);
  addEventListener('resize',resize);wide.addEventListener('change',()=>{targetX=targetY=0;resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else wake();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();dispose();gallery.dataset.paper='fallback';});
  function dispose() {
    dead=true;cancelAnimationFrame(frame);gallery.classList.remove('has-paper');
    if(motionButton) motionButton.hidden=true;
    records.forEach(r=>{r.texture?.dispose();r.material.dispose();r.media.classList.remove('paper-ready');});
    geometry.dispose();renderer.dispose();canvas.remove();
  }
  resize();return {sync};
}

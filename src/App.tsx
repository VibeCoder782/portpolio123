import { useState, useEffect, useRef, useCallback } from "react";
import Lenis from "lenis";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const Chatbot = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState([{ role:"assistant", content:"안녕하세요! 양순민의 포트폴리오 AI 어시스턴트입니다. 경력, 프로젝트, 스킬 등 궁금한 점을 물어보세요 😊" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  const PROFILE = `양순민 프로필:
- 이름: 양순민, 남성, 39세, 부산
- 이메일: swat782@nate.com
- 학력: 경성대학교 경영학과 졸업(편입)
- 자격증: 웹디자인개발기능사(2024.09)
- PM/PO 경력: 약 2년 9개월

[경력]
1. ㈜핸디 (2024.08~2025.08) 개발1팀 이사/팀장, PO
   - 애자일 스크럼 도입, JIRA 관리, Figma UI/UX, AI 자동화
   - 프로젝트: 자체 CMS 기획 및 UI/UX디자인, 부산경상대 창업가꿈, 아르피나 수영장 선착순예약시스템, 허치슨 리뉴얼, 부산경상대 메이커스페이스, 울산과학대 EPL
2. ㈜아리모아 (2022.12~2024.07) 기획팀 과장 PM/PL
   - 1년반만에 사원→과장 진급, 15개 계약건 수행
   - 프로젝트: 경성대LINC3.0(12개프로그램), 한국기술교육대 산학협력단, 상지건축 리뉴얼, 울산과학대 통합(40개+), 동아대 고도화, 대동대 통합(30개), 영렘브란트, 한진 리뉴얼
3. 도미노피자 (2009.09~2021.05) 매장매니저 12년 - 고객중심사고 체득

[핵심역량] 합리적판단, 리스크관리, 문서화&소통
[문제해결사례]
1. 문서화시스템구축: 워터폴환경 개선
2. 2개월내 12개프로그램: 공통프로세스 설계
3. 스코프크리프 대응: 회의록 문서화
4. 1인PM 60개사이트: WBS,PL선정으로 연기0건
5. 자체CMS 설계: 처음부터 IA/스토리보드/플로우차트/UI설계까지 전과정 주도
6. 아르피나 실시간 선착순 예약시스템: 동시접속 대응 설계

[스킬] 기획,JIRA,Notion,Figma,Photoshop,HTML/CSS/JS,Claude,Agile/Scrum,WBS
[수상] 경성대 최우수상(2018), KT&G 팀워크상(2011)
[성격] "성격좋은꼰대" - 원칙+유연함, 34세에 웹기획 전향, 바이브코딩으로 앱개발중

[개인 개발 프로젝트-바이브코딩] 기획에 머무르지 않고 직접 설계·개발한 앱/서비스 9개+: MountainOn(등산 기록 앱,Flutter), WebOps Builder(여러 서비스 운영·배포 관리 플랫폼,Next.js), 콘텐츠 서비스 플랫폼(웹+관리자CMS), 부기온(정서케어 앱,팀 기여 최다), 모의톡(AI 셀프점검 웹), 북잇다(독서 소셜앱,실배포), Flowon 홈페이지(3D 인터랙티브 웹), 위치기반 앱(Flutter), 시민의 턴(Unity 2D 의사결정 게임). "기획하고 직접 만들어 검증까지 하는 실행형 PO"`;

  const send = async () => {
    const q = input.trim(); if (!q || loading) return;
    const newMsgs = [...messages, { role:"user", content:q }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          max_tokens:1000,
          system:`당신은 양순민의 포트폴리오 AI 어시스턴트입니다. 아래 프로필 정보를 바탕으로 친절하고 간결하게 한국어로 답변하세요. 3~5문장 이내. 프로필에 없는 내용은 "해당 정보는 포트폴리오에 포함되어 있지 않습니다"라고 안내.\n\n${PROFILE}`,
          messages: newMsgs.map(m => ({ role:m.role, content:m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[chat] API error:", res.status, data);
        setMessages(p => [...p, { role:"assistant", content:`오류가 발생했습니다. (${res.status})` }]);
      } else {
        setMessages(p => [...p, { role:"assistant", content:data.content?.map((c: {text?:string})=>c.text||"").join("")||"응답을 가져오지 못했습니다." }]);
      }
    } catch(e) {
      console.error("[chat] fetch error:", e);
      setMessages(p => [...p, { role:"assistant", content:"네트워크 오류가 발생했습니다. 다시 시도해 주세요." }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div style={{ position:"fixed", bottom:100, right:24, width:380, maxWidth:"calc(100vw - 48px)", height:520, maxHeight:"calc(100vh - 140px)", background:"#111", border:"1px solid #222", borderRadius:20, zIndex:1000, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 25px 80px rgba(0,0,0,.6)", animation:"chatIn .4s cubic-bezier(.16,1,.3,1)" }}>
      <style>{`@keyframes chatIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes dotPulse{0%,80%,100%{opacity:.3}40%{opacity:1}}`}</style>
      <div style={{ padding:"16px 20px", background:"linear-gradient(135deg,#0D3B2E,#0A2A3C)", borderBottom:"1px solid #1A3A2E", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#10B981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💬</div>
          <div><div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>Portfolio AI</div><div style={{ fontSize:11, color:"#10B981" }}>● 온라인</div></div>
        </div>
        <div onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#888", fontSize:18 }}>✕</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 8px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"85%", padding:"10px 14px", borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px", background:m.role==="user"?"linear-gradient(135deg,#10B981,#059669)":"#1A1A1A", color:m.role==="user"?"#fff":"#CCC", fontSize:13, lineHeight:1.7, wordBreak:"break-word", border:m.role==="user"?"none":"1px solid #2A2A2A" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display:"flex" }}><div style={{ padding:"12px 18px", background:"#1A1A1A", borderRadius:"14px 14px 14px 4px", border:"1px solid #2A2A2A", display:"flex", gap:4 }}>{[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", animation:`dotPulse 1.4s ${i*.2}s infinite` }}/>)}</div></div>}
        <div ref={msgEnd}/>
      </div>
      {messages.length<=1 && <div style={{ padding:"0 16px 8px", display:"flex", flexWrap:"wrap", gap:6 }}>
        {["경력을 요약해주세요","핵심 강점은?","어떤 프로젝트를 했나요?","사용 가능한 도구는?"].map((q,i)=>(
          <div key={i} onClick={()=>{ setInput(q); }} style={{ padding:"6px 12px", background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:20, fontSize:12, color:"#10B981", cursor:"pointer", transition:"all .3s", whiteSpace:"nowrap" }}
            onMouseEnter={e=>{ (e.target as HTMLElement).style.background="rgba(16,185,129,.1)";(e.target as HTMLElement).style.borderColor="#10B981" }}
            onMouseLeave={e=>{ (e.target as HTMLElement).style.background="#1A1A1A";(e.target as HTMLElement).style.borderColor="#2A2A2A" }}>{q}</div>
        ))}
      </div>}
      <div style={{ padding:"12px 16px", borderTop:"1px solid #1A1A1A", display:"flex", gap:8, flexShrink:0, background:"#0D0D0D" }}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="질문을 입력하세요..." style={{ flex:1, padding:"10px 14px", background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:10, color:"#fff", fontSize:13, outline:"none" }} onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#10B981"} onBlur={e=>(e.target as HTMLInputElement).style.borderColor="#2A2A2A"}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{ padding:"10px 16px", background:input.trim()?"linear-gradient(135deg,#10B981,#059669)":"#1A1A1A", border:"none", borderRadius:10, color:"#fff", fontSize:16, cursor:input.trim()?"pointer":"default", opacity:input.trim()?1:.4 }}>↑</button>
      </div>
    </div>
  );
};

const LoadingScreen = () => {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"load" | "open" | "done">("load");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhase("done"); return; }
    const start = performance.now(), DUR = 2000;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let raf = 0, t1 = 0, t2 = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DUR, 1);
      setCount(Math.round(ease(p) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else { t1 = window.setTimeout(() => setPhase("open"), 350); t2 = window.setTimeout(() => setPhase("done"), 1400); }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (phase === "done") return null;
  const open = phase === "open";
  return (
    <>
      <div className="ldr-cover" style={{ top: 0, transform: open ? "translateY(-100%)" : "none", borderBottom: "1px solid rgba(16,185,129,.14)" }} />
      <div className="ldr-cover" style={{ bottom: 0, transform: open ? "translateY(100%)" : "none", borderTop: "1px solid rgba(16,185,129,.14)" }} />
      <div className={`ldr ${open ? "gone" : ""}`}>
        <div style={{ fontSize: 11, letterSpacing: ".5em", color: "#5C6663", textTransform: "uppercase", marginBottom: 20 }}><span style={{ color: "#10B981", fontWeight: 600 }}>PORTFOLIO</span> · 2026 · BUSAN</div>
        <div style={{ fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontVariantNumeric: "tabular-nums", fontSize: "clamp(80px,20vw,200px)", fontWeight: 200, letterSpacing: "-.04em", lineHeight: .9, color: "#F2F4F3" }}>
          {String(count).padStart(3, "0")}<span style={{ fontSize: ".28em", color: "#10B981", verticalAlign: "super" }}>%</span>
        </div>
        <div style={{ marginTop: 22, fontSize: 15, fontWeight: 900, letterSpacing: ".04em", color: "#5C6663" }}>YSM<span style={{ color: "#10B981" }}>.</span></div>
        <div style={{ position: "fixed", left: 0, bottom: 0, width: "100%", height: 2, background: "rgba(255,255,255,.06)" }}>
          <div style={{ height: "100%", width: `${count}%`, background: "linear-gradient(90deg,#10B981,#3B82F6)" }} />
        </div>
      </div>
    </>
  );
};

const Cursor = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rpos = { x: pos.x, y: pos.y };
    const move = (e: MouseEvent) => {
      pos.x = e.clientX; pos.y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${pos.x}px,${pos.y}px) translate(-50%,-50%)`;
      if (rm && ring.current) ring.current.style.transform = `translate(${pos.x}px,${pos.y}px) translate(-50%,-50%)`;
    };
    const over = (e: MouseEvent) => {
      const hot = (e.target as HTMLElement).closest("a,button,.nav-link,.skill-tag,.chat-fab,.case-card,.gc,input");
      ring.current?.classList.toggle("hot", !!hot);
    };
    let raf = 0;
    const loop = () => {
      rpos.x += (pos.x - rpos.x) * .18; rpos.y += (pos.y - rpos.y) * .18;
      if (ring.current) ring.current.style.transform = `translate(${rpos.x}px,${rpos.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move); window.addEventListener("mouseover", over);
    if (!rm) loop();
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); cancelAnimationFrame(raf); };
  }, []);
  return (<><div ref={ring} className="cur-ring" /><div ref={dot} className="cur-dot" /></>);
};

const Portfolio = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set<string>());
  const [counts, setCounts] = useState({ exp:0, sites:0, projects:0 });
  const [countsStarted, setCountsStarted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [buildsProgress, setBuildsProgress] = useState(0);
  const [wipe, setWipe] = useState<"idle" | "in" | "out">("idle");
  const canvasRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<{x:number;y:number;vx:number;vy:number;r:number;o:number}[]>([]);
  const animFrameRef = useRef<number>(0);
  const lenisRef = useRef<Lenis | null>(null);
  const buildsGridRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const wipeTimers = useRef<number[]>([]);
  const wipeTargetRef = useRef<string | null>(null);
  const reduceMotion = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fullText = "안 되는 건 없다. 방법이 다를 뿐.";

  useEffect(() => {
    let i=0;
    const t=setInterval(()=>{if(i<=fullText.length){setTypedText(fullText.slice(0,i));i++}else clearInterval(t)},80);
    return()=>clearInterval(t);
  }, []);

  useEffect(() => {
    const container = canvasRef.current; if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch { return; }
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:block;";
    container.appendChild(renderer.domElement);
    const DPR = renderer.getPixelRatio();
    renderer.setClearColor(0x08090a, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 15;

    const COUNT = window.innerWidth < 768 ? 9000 : 22000;
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const GA = Math.PI * (1 + Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const tt = (i + 0.5) / COUNT;
      const phi = Math.acos(1 - 2 * tt);
      const theta = GA * i;
      const rr = 6 + (Math.random() - 0.5) * 0.7;
      positions[i * 3] = rr * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = rr * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = rr * Math.cos(phi);
      scales[i] = 0.5 + Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

    const uniforms = { uTime: { value: 0 }, uSize: { value: 5.5 * DPR } };
    const material = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float uTime; uniform float uSize; attribute float aScale; varying float vN;
        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
          const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
          vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
          vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
          vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
          i=mod289(i);
          vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
          float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
          vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
          vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
          vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
          vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
          vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
          vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
          vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
          p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
          vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
          return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }
        void main(){
          vec3 pos=position;
          float n=snoise(pos*0.35+vec3(0.0,0.0,uTime*0.16));
          pos+=normalize(position)*n*1.7;
          pos*=1.0+0.05*sin(uTime*0.6);
          float a=uTime*0.07; float s=sin(a),c=cos(a);
          pos=vec3(c*pos.x+s*pos.z,pos.y,-s*pos.x+c*pos.z);
          vN=n;
          vec4 mv=modelViewMatrix*vec4(pos,1.0);
          gl_PointSize=uSize*aScale*(1.0+0.4*n)*(12.0/-mv.z);
          gl_Position=projectionMatrix*mv;
        }
      `,
      fragmentShader: `
        varying float vN;
        void main(){
          float d=length(gl_PointCoord-0.5); if(d>0.5) discard;
          float al=smoothstep(0.5,0.03,d)*0.5;
          vec3 emerald=vec3(0.09,0.85,0.6), blue=vec3(0.25,0.55,1.0);
          vec3 col=mix(emerald,blue,smoothstep(-0.6,0.8,vN));
          gl_FragColor=vec4(col,al);
        }
      `,
    });
    const points = new THREE.Points(geo, material);
    scene.add(points);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.45, 0.55, 0.12);
    composer.addPass(bloom);

    const resize = () => { const w = window.innerWidth, h = window.innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); composer.setSize(w, h); };
    resize(); window.addEventListener("resize", resize);
    const mouse = new THREE.Vector2(0, 0), tgt = new THREE.Vector2(0, 0);
    const onMove = (e: MouseEvent) => mouse.set(e.clientX / window.innerWidth - 0.5, -(e.clientY / window.innerHeight - 0.5));
    window.addEventListener("mousemove", onMove);
    const clock = new THREE.Clock();
    let running = false;
    const draw = () => {
      if (!running) return;
      uniforms.uTime.value = clock.getElapsedTime();
      tgt.lerp(mouse, 0.05);
      camera.position.x = tgt.x * 5; camera.position.y = tgt.y * 5; camera.lookAt(0, 0, 0);
      composer.render();
      animFrameRef.current = requestAnimationFrame(draw);
    };
    const start = () => { if (running) return; running = true; animFrameRef.current = requestAnimationFrame(draw); };
    const stop = () => { running = false; cancelAnimationFrame(animFrameRef.current); };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else stop(); }, { threshold: 0 });
    io.observe(container);
    start();
    return () => {
      window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove);
      io.disconnect(); stop();
      geo.dispose(); material.dispose(); bloom.dispose(); composer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(()=>{const h=()=>setScrollY(window.scrollY);window.addEventListener("scroll",h,{passive:true});return()=>window.removeEventListener("scroll",h)},[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){setVisibleSections(p=>new Set([...p,e.target.id]));if((e.target as HTMLElement).dataset.nav)setActiveSection((e.target as HTMLElement).dataset.nav!);if(e.target.id==="stats-bar"&&!countsStarted)setCountsStarted(true)}}),{threshold:.15});
    document.querySelectorAll("[data-animate],[data-nav]").forEach(el=>obs.observe(el));return()=>obs.disconnect();
  },[countsStarted]);

  useEffect(()=>{
    if(!countsStarted)return;const tgt={exp:3,sites:60,projects:18};const start=performance.now();
    const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const tick=(now:number)=>{const p=Math.min((now-start)/2000,1),ep=ease(p);setCounts({exp:Math.round(ep*tgt.exp),sites:Math.round(ep*tgt.sites),projects:Math.round(ep*tgt.projects)});if(p<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  },[countsStarted]);

  useEffect(()=>{
    const el=glowRef.current;if(!el)return;
    const move=(e:MouseEvent)=>{el.style.transform=`translate(${e.clientX-150}px,${e.clientY-150}px)`;};
    window.addEventListener("mousemove",move,{passive:true});
    return()=>window.removeEventListener("mousemove",move);
  },[]);

  useEffect(()=>{
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const lenis=new Lenis({lerp:0.09,smoothWheel:true});
    lenisRef.current=lenis;
    let raf=0,cur=0;
    const loop=(t:number)=>{
      lenis.raf(t);
      cur+=(((lenis as unknown as {velocity:number}).velocity||0)-cur)*0.12;
      const g=buildsGridRef.current;
      if(g)g.style.transform=`skewY(${Math.max(-5,Math.min(5,cur*0.22)).toFixed(2)}deg)`;
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf);lenis.destroy();lenisRef.current=null};
  },[]);

  useEffect(()=>{
    if(reduceMotion){setBuildsProgress(1);return;}
    const onScroll=()=>{
      const el=document.getElementById("builds");if(!el)return;
      const rect=el.getBoundingClientRect();const vh=window.innerHeight;
      const p=(vh*0.82-rect.top)/(vh*0.55);
      setBuildsProgress(Math.max(0,Math.min(1,p)));
    };
    window.addEventListener("scroll",onScroll,{passive:true});onScroll();
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const vis=(id:string)=>visibleSections.has(id);
  const scrollTo=(id:string)=>{
    const el=document.getElementById(id);if(!el)return;setMenuOpen(false);
    wipeTargetRef.current=id;
    if(reduceMotion){el.scrollIntoView();return;}
    const go=()=>{const t=wipeTargetRef.current?document.getElementById(wipeTargetRef.current):null;if(!t)return;if(lenisRef.current)lenisRef.current.scrollTo(t,{offset:-10,immediate:true});else t.scrollIntoView();};
    wipeTimers.current.forEach(clearTimeout);wipeTimers.current=[];
    setWipe("in");
    wipeTimers.current.push(window.setTimeout(()=>{go();setWipe("out");},560));
    wipeTimers.current.push(window.setTimeout(()=>{setWipe("idle");},1120));
  };

  const navItems=[{id:"about",label:"About"},{id:"competency",label:"Competency"},{id:"experience",label:"Experience"},{id:"projects",label:"Projects"},{id:"builds",label:"Builds"},{id:"skills",label:"Skills"},{id:"contact",label:"Contact"}];

  const experiences = [
    { period:"2024.08 — 2025.08", company:"㈜ 핸디", role:"개발 1팀 이사/팀장 · PO", desc:"애자일 스크럼 환경 도입, JIRA 기반 프로젝트 관리, Figma UI/UX 기획, AI 업무 자동화 주도", projects:["CMS 기획 및 UI/UX","부산 경상대 창업가꿈","아르피나 예약 시스템","울산과학대 EPL"], recent:true },
    { period:"2022.12 — 2024.07", company:"㈜ 아리모아", role:"기획팀 과장 · PM/PL", desc:"1년 반 만에 사원→과장 진급. 총 15개 계약건 프로젝트 수행, 문서화 시스템 구축", projects:["경성대 LINC 3.0","한국기술교육대 산학협력단","울산과학대 통합(60개)","대동대 통합(30개)"] },
    { period:"2009.09 — 2021.05", company:"청오디피케이 (도미노피자)", role:"매장 매니저 · Expert · 11년 9개월", desc:"약 12년간 고객 중심 사고, 서비스 개선, 효율적 커뮤니케이션의 가치를 현장에서 체득", projects:[] },
  ];

  const caseStudies = [
    { num:"01", title:"문서화 시스템 구축", problem:"에이전시 특성상 워터폴 구조에서 업무분장·일정관리가 불명확하여 프로젝트 효율 저하", solution:"Google Sheets, Notion, Figma, Slack으로 프로젝트 리딩 문서화 체계 구축. 클라이언트에게 히스토리 남겨 신뢰 형성", result:"리스크 조기 파악·최소화, 더 나은 품질의 웹 홈페이지 제공", color:"#10B981", icon:"📄" },
    { num:"02", title:"2개월 내 12개 프로그램 오픈", problem:"경성대 LINC 3.0 — 12개 신청·관리 프로그램을 2개월 내 오픈 일정에 맞춰 납부 필수", solution:"공통 프로세스 설계로 개발 부담 경감, 핵심 프로그램 2개에 집중하여 클라이언트 만족도 극대화", result:"일정 내 안정적 오픈 완료. 유지보수 후 현재까지 다수 사용자 이용 중", color:"#F59E0B", icon:"⚡" },
    { num:"03", title:"스코프 크리프 대응", problem:"상지건축 50주년 리뉴얼 — 계약서상 문제로 일정·요구사항 불명확, 미팅 후에도 끊임없는 변경 요청", solution:"회의록 전수 문서화 및 고객 확인 프로세스 도입. 내부 타격 최소화 위해 후순위 조율, 끈질긴 재협의", result:"서브 프로젝트 형식으로 전환하여 잔금 처리 및 성공적 오픈 완료", color:"#8B5CF6", icon:"🔄" },
    { num:"04", title:"1인 PM, 60개+ 사이트 관리", problem:"울산과학대 통합 홈페이지(PHP→JAVA) — 본대·입학·학과 등 40여개 + 대동대 30개까지, 혼자 관리해야 하는 극한 상황", solution:"전 작업 문서화, Google Sheets로 메뉴별·팀별 체킹, 팀별 PL 선정 소통 일원화, WBS 기반 체계적 일정관리", result:"단 한 건의 연기 없이 전체 일정에 맞춰 오픈 완료", color:"#EC4899", icon:"🚀" },
    { num:"05", title:"자체 CMS 제로부터 설계", problem:"㈜핸디 — 기존에 없던 홈페이지 관리 CMS를 처음부터 기획해야 하는 상황. 레퍼런스 없이 IA부터 UI까지 전 과정을 주도해야 함", solution:"IA 구조도 → 프로그램 스토리보드 → 플로우차트 → CMS UI/UX 디자인까지 약 9개월에 걸쳐 전 과정을 Figma로 설계. 팀원 및 내부 협의를 반복하며 실사용 기반의 구조 확립", result:"실무에 바로 적용 가능한 CMS 체계 완성, 향후 모든 웹 프로젝트의 관리 기반으로 활용", color:"#3B82F6", icon:"🏗️" },
    { num:"06", title:"실시간 선착순 예약 시스템", problem:"아르피나 수영장 — 온라인 선착순 예약 시스템을 신규 구축해야 하며, 오픈 시 동시 접속 폭주가 예상되는 고난도 프로젝트", solution:"고객 요구사항을 면밀 분석 후 예약 플로우를 설계. IA 구조도·플로우차트 작성 및 내부 개발팀과 기술적 협의를 반복하며 안정적 동시접속 처리 구조 도출", result:"약 2.5개월 만에 예약 시스템 + 홈페이지 리뉴얼 동시 오픈 성공", color:"#F97316", icon:"🎫" },
  ];

  const skillCategories = [
    { name:"기획 & 관리", items:["서비스기획","웹기획","전략기획","PM","PO","스토리보드","IA설계"], pct:95 },
    { name:"협업 도구", items:["JIRA","Notion","Google Sheets","Slack","Figma"], pct:90 },
    { name:"디자인", items:["Figma","Photoshop","Illustrator","After Effects","Premiere"], pct:80 },
    { name:"개발 이해", items:["HTML5","CSS3","JavaScript","Firebase","Cursor"], pct:65 },
    { name:"AI 활용", items:["Claude","Gemini","Gamma AI","바이브코딩"], pct:85 },
    { name:"방법론", items:["Agile/Scrum","Waterfall","WBS","리스크관리"], pct:90 },
  ];

  const sideProjects = [
    { name:"MountainOn", cat:"모바일 앱 · 등산 기록", stack:"Flutter · Supabase · Vercel", role:"1인 풀스택", status:"진행 중", color:"#10B981", icon:"⛰️", desc:"GPS 산행 기록·정상 인증·정보를 다루는 등산 앱. 기획(PRD·IA)부터 설계·개발·테스트까지 단독 수행. 오프라인 대응·위치정보 비식별 등 실사용 엔지니어링 반영." },
    { name:"WebOps Builder", cat:"멀티 프로덕트 운영 플랫폼", stack:"TypeScript · Next.js · Turborepo", role:"1인 설계·개발", status:"진행 중", color:"#3B82F6", icon:"🛠️", desc:"여러 서비스의 등록·상태 관측·배포·릴리스 승인/롤백을 한 콘솔에서 관리. 감사 로그·시크릿 관리 등 운영 안전성 중심 설계." },
    { name:"콘텐츠 서비스 플랫폼", cat:"웹 서비스 + 관리자 CMS", stack:"Next.js · React · Supabase", role:"1인 기획·개발", status:"운영", color:"#8B5CF6", icon:"🧩", desc:"사용자용 웹 서비스와 운영자용 관리 콘솔(CMS)을 함께 구축. 비개발자도 콘텐츠를 등록·큐레이션·운영 가능하게 설계." },
    { name:"부기온 (Boogion)", cat:"모바일 앱 · 정서 케어", stack:"Flutter · Firebase · Vercel", role:"팀 · 기여 최다", status:"출시 준비", color:"#F59E0B", icon:"🌡️", desc:"5인 팀 프로젝트. 기획 및 앱 프론트/일부 서버 개발 주도. 푸시·소셜로그인·원격설정 등 상용 앱 인프라 구성." },
    { name:"모의톡 (CaseTalk)", cat:"AI 셀프 점검 웹", stack:"Next.js · 생성형 AI", role:"1인 기획·개발", status:"MVP", color:"#EC4899", icon:"⚖️", desc:"생성형 AI 연동 셀프 점검 서비스. 안전 가드레일·개인정보 무저장 등 'AI 안전성'을 아키텍처로 구현." },
    { name:"북잇다 (Bookitda)", cat:"모바일 앱 · 독서 소셜", stack:"Flutter · Supabase · Firebase", role:"1인 풀스택", status:"실배포", color:"#F97316", icon:"📚", desc:"책 한줄평을 공유하는 소셜 앱. 소셜 로그인(카카오·구글) 실연동, 서버리스 백엔드 실배포 완료." },
    { name:"Flowon 홈페이지", cat:"인터랙티브 웹", stack:"Three.js · GSAP · Lenis", role:"1인 프론트", status:"완성", color:"#06B6D4", icon:"🌊", desc:"WebGL 셰이더 히어로 + 스크롤 인터랙션·커스텀 커서·프리로더를 구현한 브랜드 원페이지." },
    { name:"위치 기반 앱", cat:"모바일 앱 (도메인 비공개)", stack:"Flutter", role:"1인 기획·개발", status:"배포 준비", color:"#14B8A6", icon:"📍", desc:"위치 정보를 활용한 개인화 모바일 서비스 앱. 구체 도메인은 아이디어 보호를 위해 비공개." },
    { name:"시민의 턴", cat:"2D 의사결정 게임", stack:"Unity", role:"1인 기획·개발", status:"개발 중", color:"#A855F7", icon:"🎮", desc:"스프라이트 시트 기반 2D 게임. 매주 시나리오가 자동 로테이션되는 의사결정 게임 구조 설계." },
  ];

  return (
    <div style={{ fontFamily:"'Pretendard',-apple-system,sans-serif", background:"#0A0A0A", color:"#E5E5E5", minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        *{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:auto}
        html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:hidden}.lenis.lenis-smooth iframe{pointer-events:none}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0A0A0A}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        .fade-up{opacity:0;transform:translateY(50px);transition:all .9s cubic-bezier(.16,1,.3,1)}.fade-up.visible{opacity:1;transform:translateY(0)}
        .fade-left{opacity:0;transform:translateX(-50px);transition:all .9s cubic-bezier(.16,1,.3,1)}.fade-left.visible{opacity:1;transform:translateX(0)}
        .fade-right{opacity:0;transform:translateX(50px);transition:all .9s cubic-bezier(.16,1,.3,1)}.fade-right.visible{opacity:1;transform:translateX(0)}
        .scale-in{opacity:0;transform:scale(.85);transition:all .9s cubic-bezier(.16,1,.3,1)}.scale-in.visible{opacity:1;transform:scale(1)}
        .s1{transition-delay:.1s}.s2{transition-delay:.2s}.s3{transition-delay:.3s}.s4{transition-delay:.4s}.s5{transition-delay:.5s}.s6{transition-delay:.6s}
        .nav-link{position:relative;cursor:pointer;padding:8px 0;font-size:14px;color:#888;transition:color .3s;letter-spacing:.5px}
        .nav-link:hover,.nav-link.active{color:#fff}.nav-link.active::after{content:'';position:absolute;bottom:4px;left:0;width:100%;height:2px;background:#10B981;border-radius:1px}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes gradientMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .gc{position:relative;background:#141414;border:1px solid #222;border-radius:16px;overflow:hidden;transition:all .5s cubic-bezier(.16,1,.3,1)}
        .gc:hover{border-color:#333;transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
        .gc>.inn{background:#141414;border-radius:15px;position:relative;z-index:1;height:100%}
        .timeline-item{position:relative;padding-left:36px;padding-bottom:52px;border-left:2px solid #1A1A1A;transition:border-color .5s}
        .timeline-item:hover{border-left-color:#10B981}.timeline-item:last-child{border-left-color:transparent;padding-bottom:0}
        .timeline-dot{position:absolute;left:-8px;top:6px;width:14px;height:14px;border-radius:50%;border:3px solid #10B981;background:#0A0A0A;transition:all .4s}
        .timeline-item:hover .timeline-dot{background:#10B981;box-shadow:0 0 16px rgba(16,185,129,.5);transform:scale(1.3)}
        .skill-tag{display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;background:#1A1A1A;border:1px solid #2A2A2A;color:#CCC;margin:4px;transition:all .4s;cursor:default}
        .skill-tag:hover{border-color:#10B981;color:#10B981;background:rgba(16,185,129,.1);transform:translateY(-3px);box-shadow:0 4px 15px rgba(16,185,129,.15)}
        .stat-number{font-size:52px;font-weight:900;background:linear-gradient(135deg,#10B981,#3B82F6);background-size:200% 200%;animation:gradientMove 3s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
        .section{padding:120px 24px;max-width:1100px;margin:0 auto}
        .sl{font-size:13px;text-transform:uppercase;letter-spacing:4px;color:#10B981;margin-bottom:16px;font-weight:600}
        .st{font-size:clamp(28px,5vw,42px);font-weight:900;color:#fff;margin-bottom:24px;line-height:1.3}
        .mobile-menu{position:fixed;inset:0;z-index:100;background:rgba(10,10,10,.98);backdrop-filter:blur(24px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:36px}
        .mobile-menu-link{font-size:28px;color:#888;cursor:pointer;transition:all .3s;font-weight:600}.mobile-menu-link:hover{color:#fff;transform:scale(1.1)}
        .hamburger{display:none;cursor:pointer;z-index:200}
        .progress-bar{height:4px;border-radius:2px;background:#1A1A1A;overflow:hidden;margin-top:8px}
        .progress-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#10B981,#3B82F6);transition:width 1.5s cubic-bezier(.16,1,.3,1)}
        .mag-btn{transition:all .4s cubic-bezier(.16,1,.3,1)}.mag-btn:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(16,185,129,.3)}
        .marquee{display:flex;gap:48px;animation:marquee 20s linear infinite}@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .chat-fab{position:fixed;bottom:28px;right:28px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);border:none;cursor:pointer;z-index:999;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 8px 32px rgba(16,185,129,.35);transition:all .4s cubic-bezier(.16,1,.3,1)}
        .chat-fab:hover{transform:scale(1.1);box-shadow:0 12px 44px rgba(16,185,129,.5)}
        .fab-pulse{position:fixed;bottom:28px;right:28px;width:60px;height:60px;border-radius:50%;z-index:998;animation:fabPulse 2s ease infinite}
        @keyframes fabPulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 20px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
        .case-card{position:relative;background:#141414;border:1px solid #222;border-radius:20px;padding:32px;transition:all .5s cubic-bezier(.16,1,.3,1);overflow:hidden;display:flex;flex-direction:column}
        .case-card:hover{border-color:#333;transform:translateY(-8px);box-shadow:0 24px 64px rgba(0,0,0,.5)}
        .case-card .top-bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:20px 20px 0 0}
        .case-num{font-size:56px;font-weight:900;line-height:1;margin-bottom:4px;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .case-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;flex-shrink:0}
        .case-section{margin-bottom:16px}.case-section:last-child{margin-bottom:0}
        .case-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px}
        .case-text{font-size:13px;line-height:1.75;color:#999}
        .case-result{font-size:13px;line-height:1.75;color:#E5E5E5;font-weight:600}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @media(max-width:768px){.hamburger{display:block}.desktop-nav{display:none!important}.section{padding:80px 20px}.stat-number{font-size:36px}.hero-title{font-size:40px!important}.cases-grid{grid-template-columns:1fr!important}}
        .ldr{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity .5s ease}
        .ldr.gone{opacity:0;pointer-events:none}
        .ldr-cover{position:fixed;left:0;right:0;height:50.5%;z-index:2999;background:#08090A;transition:transform 1.05s cubic-bezier(.16,1,.3,1)}
        @media (hover:hover) and (pointer:fine){
          *{cursor:none!important}
          .cur-dot{position:fixed;top:0;left:0;width:7px;height:7px;border-radius:50%;background:#10B981;z-index:4000;pointer-events:none;transform:translate(-50%,-50%);will-change:transform}
          .cur-ring{position:fixed;top:0;left:0;width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(16,185,129,.5);z-index:4000;pointer-events:none;transform:translate(-50%,-50%);transition:width .25s,height .25s,background .25s,border-color .25s;will-change:transform}
          .cur-ring.hot{width:64px;height:64px;background:rgba(16,185,129,.08);border-color:#10B981}
        }
        .page-wipe{position:fixed;inset:0;z-index:2600;background:#08090A;border-top:2px solid #10B981;transform:translateY(100%);pointer-events:none;display:flex;align-items:center;justify-content:center}
        .page-wipe.in{transform:translateY(0);transition:transform .55s cubic-bezier(.76,0,.24,1)}
        .page-wipe.out{transform:translateY(-100%);transition:transform .55s cubic-bezier(.76,0,.24,1)}
        .pw-mark{font-size:26px;font-weight:900;letter-spacing:.04em;color:#F2F4F3;opacity:0;transition:opacity .3s .1s}.pw-mark b{color:#10B981}.page-wipe.in .pw-mark{opacity:1}
        .caret{animation:caretBlink 1.06s step-end infinite}@keyframes caretBlink{0%,100%{opacity:1}50%{opacity:0}}
        @media (prefers-reduced-motion:reduce){
          .ldr,.ldr-cover,.page-wipe{display:none!important}
          .marquee,.caret,.stat-number,.fab-pulse{animation:none!important}
          *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.15s!important}
        }
      `}</style>

      <div ref={glowRef} style={{ position:"fixed", top:0, left:0, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,.06),transparent 70%)", pointerEvents:"none", zIndex:1, transform:"translate(-150px,-150px)", transition:"transform .3s ease-out", willChange:"transform" }}/>

      {/* Nav */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:scrollY>50?"rgba(10,10,10,.85)":"transparent", backdropFilter:scrollY>50?"blur(24px)":"none", borderBottom:scrollY>50?"1px solid #1A1A1A":"none", transition:"all .4s", padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", height:64 }}>
          <div onClick={()=>scrollTo("hero")} style={{ fontWeight:900, fontSize:20, color:"#fff", cursor:"pointer" }}>YSM<span style={{ color:"#10B981" }}>.</span></div>
          <div className="desktop-nav" style={{ display:"flex", gap:32 }}>{navItems.map(n=><span key={n.id} className={`nav-link ${activeSection===n.id?"active":""}`} onClick={()=>scrollTo(n.id)}>{n.label}</span>)}</div>
          <div className="hamburger" onClick={()=>setMenuOpen(!menuOpen)}>
            <div style={{ width:24, height:2, background:"#fff", marginBottom:6, transition:"all .3s", transform:menuOpen?"rotate(45deg) translate(5px,5px)":"none" }}/>
            <div style={{ width:24, height:2, background:"#fff", marginBottom:6, opacity:menuOpen?0:1, transition:"all .3s" }}/>
            <div style={{ width:24, height:2, background:"#fff", transition:"all .3s", transform:menuOpen?"rotate(-45deg) translate(6px,-6px)":"none" }}/>
          </div>
        </div>
      </nav>
      {menuOpen&&<div className="mobile-menu">{navItems.map(n=><span key={n.id} className="mobile-menu-link" onClick={()=>scrollTo(n.id)}>{n.label}</span>)}</div>}

      {/* Hero */}
      <section id="hero" data-nav="hero" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", padding:"0 24px" }}>
        <div ref={canvasRef} style={{ position:"absolute", inset:0, zIndex:0 }}/>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 20%,rgba(16,185,129,.08) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(59,130,246,.06) 0%,transparent 60%)", zIndex:1, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", background:"radial-gradient(ellipse 50% 46% at 50% 47%, rgba(8,9,10,0.8) 0%, rgba(8,9,10,0.42) 48%, transparent 74%)" }}/>
        <div style={{ textAlign:"center", position:"relative", zIndex:2, transform:reduceMotion?"none":`translateY(${-scrollY*.06}px)`, maxWidth:800, margin:"0 auto" }}>
          <p style={{ fontSize:13, letterSpacing:6, color:"#10B981", marginBottom:32, textTransform:"uppercase", fontWeight:600, opacity:.85 }}>Product Manager & Product Owner</p>
          <h1 className="hero-title" style={{ fontSize:"clamp(52px,10vw,88px)", fontWeight:900, color:"#fff", lineHeight:1.0, marginBottom:20, letterSpacing:-2 }}>양순민</h1>
          <div style={{ width:60, height:3, background:"linear-gradient(90deg,#10B981,#3B82F6)", margin:"0 auto 32px", borderRadius:2 }} />
          <div style={{ fontSize:"clamp(22px,4vw,36px)", fontWeight:800, color:"#fff", lineHeight:1.3, marginBottom:12 }}>
            {typedText}<span className="caret" style={{ color:"#10B981", fontWeight:400 }}>|</span>
          </div>
          <p style={{ fontSize:"clamp(14px,2vw,17px)", color:"#666", maxWidth:480, margin:"0 auto 44px", lineHeight:1.8 }}>
            체계적인 문서화와 유연한 리더십으로<br/>프로젝트를 이끄는 PM
          </p>
          <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="mag-btn" onClick={()=>scrollTo("experience")} onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.transform=`translate(${(e.clientX-r.left-r.width/2)*0.3}px,${(e.clientY-r.top-r.height/2)*0.5}px)`}} onMouseLeave={e=>{e.currentTarget.style.transform=""}} style={{ padding:"16px 36px", background:"linear-gradient(135deg,#10B981,#059669)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }}>Experience ↓</button>
            <button className="mag-btn" onClick={()=>scrollTo("contact")} onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.transform=`translate(${(e.clientX-r.left-r.width/2)*0.3}px,${(e.clientY-r.top-r.height/2)*0.5}px)`}} onMouseLeave={e=>{e.currentTarget.style.transform=""}} style={{ padding:"16px 36px", background:"transparent", color:"#fff", border:"1px solid #333", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }}>Contact</button>
          </div>
        </div>
        <div style={{ position:"absolute", bottom:40, left:"50%", transform:"translateX(-50%)", zIndex:2, animation:"float 2s ease-in-out infinite" }}>
          <div style={{ width:24, height:40, border:"2px solid #333", borderRadius:12, display:"flex", justifyContent:"center", paddingTop:8 }}>
            <div style={{ width:3, height:8, background:"#10B981", borderRadius:2, animation:"float 1.5s ease-in-out infinite" }}/>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div id="stats-bar" data-animate style={{ borderTop:"1px solid #1A1A1A", borderBottom:"1px solid #1A1A1A", padding:"56px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:32, textAlign:"center" }}>
          {[{num:counts.exp,unit:"년+",label:"PM/PO 경력"},{num:counts.sites,unit:"개+",label:"관리 사이트"},{num:counts.projects,unit:"건",label:"수행 프로젝트"}].map((s,i)=>(
            <div key={i}><div className="stat-number">{s.num}<span style={{ fontSize:24 }}>{s.unit}</span></div><div style={{ color:"#888", fontSize:14, marginTop:10 }}>{s.label}</div></div>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <div style={{ overflow:"hidden", padding:"20px 0", borderBottom:"1px solid #1A1A1A", background:"#0D0D0D" }}>
        <div className="marquee">{[...Array(2)].map((_,k)=><div key={k} style={{ display:"flex", gap:48, flexShrink:0 }}>{["서비스기획","Agile/Scrum","JIRA","Figma","문서화","리스크관리","UI/UX","WBS","커뮤니케이션","AI 자동화","스토리보드","PM/PO"].map((t,i)=><span key={i} style={{ fontSize:14, color:"#333", fontWeight:700, letterSpacing:2, whiteSpace:"nowrap" }}>{t}</span>)}</div>)}</div>
      </div>

      {/* About */}
      <section id="about" data-nav="about" className="section">
        <div id="about-c" data-animate className={`fade-up ${vis("about-c")?"visible":""}`}><div className="sl">About</div><div className="st">기업과 함께 성장하는 PM</div></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:40, marginTop:20 }}>
          <div id="about-l" data-animate className={`fade-left ${vis("about-l")?"visible":""}`} style={{ lineHeight:1.9, color:"#AAA", fontSize:15 }}>
            <p style={{ marginBottom:20 }}>도미노피자에서 약 12년간 매니저로 근무하며 체득한 <strong style={{ color:"#fff" }}>고객 중심 사고</strong>와 <strong style={{ color:"#fff" }}>현장 커뮤니케이션 역량</strong>을 바탕으로, 34세에 웹 기획자로 전향했습니다.</p>
            <p style={{ marginBottom:20 }}>아리모아에서 1년 반 만에 사원에서 과장으로 진급, ㈜핸디에서 <strong style={{ color:"#fff" }}>PO(Product Owner)</strong>로서 애자일 조직을 리딩했습니다.</p>
            <p>바이브코딩을 통한 모바일 앱 개발, Cursor·Firebase 등 최신 환경 학습까지 — 프로덕트의 A to Z를 직접 경험하고 있습니다.</p>
          </div>
          <div id="about-r" data-animate className={`fade-right s2 ${vis("about-r")?"visible":""}`}>
            <div className="gc"><div className="inn" style={{ padding:32 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:20 }}>Key Highlights</div>
              {["원칙을 지키되 유연함을 잃지 않는 리더","문서화로 리스크를 사전에 차단","데이터 기반의 합리적 의사결정","AI 도구를 활용한 업무 효율 극대화","모든 이해관계자가 윈윈하는 방향 모색"].map((t,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14, opacity:0, animation:vis("about-r")?`fadeSlideIn .5s ${.3+i*.12}s forwards`:"none" }}>
                  <span style={{ color:"#10B981", fontSize:16, marginTop:2, flexShrink:0 }}>✦</span><span style={{ color:"#CCC", fontSize:14, lineHeight:1.6 }}>{t}</span>
                </div>
              ))}
            </div></div>
          </div>
        </div>
      </section>

      {/* Competency */}
      <section id="competency" data-nav="competency" style={{ background:"#0F0F0F" }}>
        <div className="section">
          <div id="comp-h" data-animate className={`fade-up ${vis("comp-h")?"visible":""}`}><div className="sl">Core Competency</div><div className="st">Three Core Strengths</div></div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:24, marginTop:48 }}>
            {[{icon:"⚖️",title:"합리적 판단",desc:"클라이언트 요구와 내부 상황을 고려하여 서로가 윈윈할 수 있는 사업 방향을 모색합니다."},{icon:"🛡️",title:"리스크 관리",desc:"책임감 있는 성실함과 유연한 리더십으로 프로젝트 리스크를 조기에 발견하고 최대한 감소시킵니다."},{icon:"📋",title:"문서화 & 소통",desc:"풍부한 현장 경험 기반의 커뮤니케이션 역량으로 프로젝트 진행을 체계화·문서화합니다."}].map((c,i)=>(
              <div key={i} id={`comp-${i}`} data-animate className={`gc scale-in s${i+1} ${vis(`comp-${i}`)?"visible":""}`}>
                <div className="inn" style={{ padding:40, textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:20, animation:"float 3s ease-in-out infinite", animationDelay:`${i*.3}s` }}>{c.icon}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:14 }}>{c.title}</div>
                  <div style={{ color:"#999", fontSize:14, lineHeight:1.8 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience */}
      <section id="experience" data-nav="experience" className="section">
        <div id="exp-h" data-animate className={`fade-up ${vis("exp-h")?"visible":""}`}><div className="sl">Experience</div><div className="st">Career History</div></div>
        <div style={{ marginTop:48 }}>
          {experiences.map((exp,i)=>(
            <div key={i} id={`exp-${i}`} data-animate className={`timeline-item fade-left s${i+1} ${vis(`exp-${i}`)?"visible":""}`}>
              <div className="timeline-dot"/>
              <div style={{ marginBottom:8 }}>
                <span style={{ fontSize:13, color:"#10B981", fontWeight:600 }}>{exp.period}</span>
                {exp.recent&&<span style={{ marginLeft:8, padding:"3px 12px", background:"rgba(59,130,246,.15)", color:"#3B82F6", borderRadius:12, fontSize:11, fontWeight:600 }}>Latest</span>}
              </div>
              <h3 style={{ fontSize:24, fontWeight:900, color:"#fff", marginBottom:4 }}>{exp.company}</h3>
              <div style={{ fontSize:15, color:"#CCC", marginBottom:12, fontWeight:500 }}>{exp.role}</div>
              <p style={{ fontSize:14, color:"#888", lineHeight:1.7, marginBottom:16 }}>{exp.desc}</p>
              {exp.projects.length>0&&<div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{exp.projects.map((p,j)=><span key={j} className="skill-tag" style={{ fontSize:12 }}>{p}</span>)}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Project List */}
      <section id="project-list" style={{ background:"#0F0F0F" }}>
        <div className="section">
          <div id="pl-h" data-animate className={`fade-up ${vis("pl-h")?"visible":""}`}>
            <div className="sl">Project Archive</div>
            <div className="st">All Projects</div>
            <p style={{ color:"#888", fontSize:15, lineHeight:1.7, maxWidth:640, marginBottom:16 }}>PM/PO로서 수행한 전체 프로젝트 목록입니다.</p>
          </div>

          {[
            { company:"㈜ 핸디", period:"2024.08 — 2025.08", role:"PO / 이사·팀장", color:"#3B82F6", items:[
              { name:"홈페이지 관리 CMS 기획 및 UI/UX 디자인", period:"2024.08 ~ 2025.05", tag:"자체 서비스" },
              { name:"부산 경상대학교 창업가꿈 홈페이지 구축", period:"2024.09 ~ 2024.10", tag:"신규 구축" },
              { name:"아르피나 수영장 선착순 예약 시스템 및 홈페이지 리뉴얼", period:"2024.10 ~ 2025.01", tag:"예약 시스템" },
              { name:"허치슨 홈페이지 리뉴얼", period:"2024.11 ~ 2025.02", tag:"리뉴얼" },
              { name:"부산경상대학교 메이커스페이스 홈페이지 신규구축", period:"2024.12 ~ 2025.02", tag:"신규 구축" },
              { name:"울산과학대학교 EPL 홈페이지 신규구축 (선착순 예약)", period:"2025.03 ~ 2025.04", tag:"예약 시스템" },
            ]},
            { company:"㈜ 아리모아", period:"2022.12 — 2024.07", role:"PM/PL · 과장", color:"#10B981", items:[
              { name:"경성대학교 LINC 3.0 사업단 홈페이지 구축", period:"2022.12 ~ 2023.03", tag:"프로그램 11개" },
              { name:"한국기술교육대학교 산학협력단 홈페이지 고도화", period:"2023.02 ~ 2023.04", tag:"고도화" },
              { name:"상지건축 50주년 홈페이지 리뉴얼", period:"2023.04 ~ 2023.09", tag:"리뉴얼" },
              { name:"동아대학교 교내 홈페이지 고도화 사업", period:"2023.05 ~ 2023.11", tag:"고도화" },
              { name:"울산과학대학교 통합 홈페이지 구축 (PHP→JAVA, 40개+)", period:"2023.10 ~ 2024.03", tag:"대규모" },
              { name:"경성대 LINC 3.0 공유형 컨텐츠 다중활용 구축", period:"2023.10 ~ 2024.01", tag:"신규 구축" },
              { name:"전국 기술사교육원 홈페이지 구축", period:"2023.11 ~ 2024.02", tag:"신규 구축" },
              { name:"(부트캠프) 철강산업 인적양성 부트캠프 홈페이지", period:"2023.11 ~ 2024.01", tag:"신규 구축" },
              { name:"한진 공식 홈페이지 메인 리뉴얼 및 정보 업데이트", period:"2024.02 ~ 2024.03", tag:"리뉴얼" },
              { name:"대동대학교 통합 홈페이지 구축 (30개)", period:"2024.02 ~ 2024.06", tag:"대규모" },
              { name:"영렘브란트 신규 홈페이지 구축", period:"2024.03 ~ 2024.04", tag:"신규 구축" },
              { name:"울산과학대 진로진학지원센터 외 부속 홈페이지", period:"2023.10 ~ 2024.03", tag:"다수 구축" },
            ]},
          ].map((group, gi) => {
            const total = group.items.length;
            return (
              <div key={gi} id={`pl-g${gi}`} data-animate className={`fade-up s${gi+1} ${vis(`pl-g${gi}`)?"visible":""}`} style={{ marginBottom:gi===0?48:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${group.color}22` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:4, height:36, borderRadius:2, background:group.color }} />
                    <div>
                      <h3 style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{group.company}</h3>
                      <span style={{ fontSize:13, color:"#888" }}>{group.period} · {group.role}</span>
                    </div>
                  </div>
                  <div style={{ padding:"6px 16px", background:`${group.color}15`, border:`1px solid ${group.color}30`, borderRadius:20, fontSize:13, fontWeight:700, color:group.color }}>
                    {total}개 프로젝트
                  </div>
                </div>
                <div style={{ display:"grid", gap:1, background:"#1A1A1A", borderRadius:12, overflow:"hidden", border:"1px solid #1E1E1E" }}>
                  {group.items.map((item, ii) => (
                    <div key={ii} style={{ display:"grid", gridTemplateColumns:"1fr auto auto", alignItems:"center", gap:16, padding:"14px 20px", background:"#111", transition:"background .3s" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#161616"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#111"}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ color:"#555", fontSize:12, fontWeight:700, fontVariantNumeric:"tabular-nums", flexShrink:0, width:22 }}>{String(ii+1).padStart(2,"0")}</span>
                        <span style={{ fontSize:14, color:"#DDD", fontWeight:500 }}>{item.name}</span>
                      </div>
                      <span style={{ padding:"3px 10px", background:`${group.color}10`, border:`1px solid ${group.color}25`, borderRadius:6, fontSize:11, color:group.color, fontWeight:600, whiteSpace:"nowrap" }}>{item.tag}</span>
                      <span style={{ fontSize:12, color:"#666", fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" }}>{item.period}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div id="pl-total" data-animate className={`fade-up s3 ${vis("pl-total")?"visible":""}`} style={{ marginTop:32, textAlign:"center", padding:"24px", background:"#141414", border:"1px solid #222", borderRadius:12 }}>
            <span style={{ fontSize:15, color:"#888" }}>총 수행 프로젝트 </span>
            <span style={{ fontSize:28, fontWeight:900, background:"linear-gradient(135deg,#10B981,#3B82F6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>18</span>
            <span style={{ fontSize:15, color:"#888" }}>건</span>
          </div>
        </div>
      </section>

      {/* Case Studies — Grid */}
      <section id="projects" data-nav="projects">
        <div className="section">
          <div id="case-h" data-animate className={`fade-up ${vis("case-h")?"visible":""}`}>
            <div className="sl">Case Studies</div>
            <div className="st">Problem-Solving in Action</div>
            <p style={{ color:"#888", fontSize:15, lineHeight:1.7, maxWidth:640, marginBottom:48 }}>현장에서 직면한 실제 문제들을 어떻게 해결했는지, 6가지 사례를 소개합니다.</p>
          </div>
          <div className="cases-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))", gap:20 }}>
            {caseStudies.map((cs,i)=>(
              <div key={i} id={`case-${i}`} data-animate className={`case-card fade-up s${i+1} ${vis(`case-${i}`)?"visible":""}`}>
                <div className="top-bar" style={{ background:cs.color }}/>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div className="case-icon" style={{ background:`${cs.color}15`, border:`1px solid ${cs.color}30` }}>{cs.icon}</div>
                    <h4 style={{ fontSize:17, fontWeight:800, color:"#fff", lineHeight:1.3 }}>{cs.title}</h4>
                  </div>
                  <div style={{ fontSize:42, fontWeight:900, lineHeight:1, color:cs.color, opacity:.18, flexShrink:0 }}>{cs.num}</div>
                </div>
                <div className="case-section">
                  <div className="case-label" style={{ color:cs.color }}>Problem</div>
                  <div className="case-text">{cs.problem}</div>
                </div>
                <div className="case-section">
                  <div className="case-label" style={{ color:cs.color }}>Solution</div>
                  <div className="case-text">{cs.solution}</div>
                </div>
                <div className="case-section" style={{ marginTop:"auto", paddingTop:12, borderTop:"1px solid #1E1E1E" }}>
                  <div className="case-label" style={{ color:cs.color }}>Result</div>
                  <div className="case-result">{cs.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Builds */}
      <section id="builds" data-nav="builds" style={{ background:"#0F0F0F" }}>
        <div className="section">
          <div id="sp-h" data-animate className={`fade-up ${vis("sp-h")?"visible":""}`}>
            <div className="sl">Personal Builds</div>
            <div className="st">직접 만든 제품들</div>
            <p style={{ color:"#888", fontSize:15, lineHeight:1.7, maxWidth:660, marginBottom:48 }}>기획에 머무르지 않고, AI 페어코딩(바이브코딩)으로 직접 설계·개발한 9개+의 앱·서비스입니다. 말이 아닌 결과물로 증명하는 실행형 PO.</p>
          </div>
          <div ref={buildsGridRef} className="cases-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20, willChange:"transform" }}>
            {sideProjects.map((p,i)=>{
              const lp=reduceMotion?1:Math.max(0,Math.min(1,(buildsProgress-i*0.045)*1.7));
              const e=1-Math.pow(1-lp,3);
              const ang=i*0.9-Math.PI/2, rad=(1-e)*520;
              const tx=Math.cos(ang)*rad, ty=Math.sin(ang)*rad*0.6;
              const rot=(1-e)*(i*10+35), sc=0.4+e*0.6;
              const op=Math.min(1,lp*1.6);
              const mid=lp>0&&lp<1;
              return (
              <div key={i} style={{ transform:mid?`translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`:lp>=1?"none":`translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`, opacity:op, willChange:mid?"transform,opacity":"auto" }}>
                <div className="case-card" style={{ height:"100%" }}>
                  <div className="top-bar" style={{ background:p.color }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <div className="case-icon" style={{ background:`${p.color}15`, border:`1px solid ${p.color}30`, fontSize:22, marginBottom:0 }}>{p.icon}</div>
                    <div>
                      <h4 style={{ fontSize:17, fontWeight:800, color:"#fff", lineHeight:1.2 }}>{p.name}</h4>
                      <div style={{ fontSize:12, color:p.color, fontWeight:600, marginTop:3 }}>{p.cat}</div>
                    </div>
                  </div>
                  <p className="case-text" style={{ marginBottom:16, flex:1 }}>{p.desc}</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {p.stack.split(" · ").map((s,j)=>(
                      <span key={j} style={{ padding:"3px 10px", background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:6, fontSize:11, color:"#AAA" }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", paddingTop:12, borderTop:"1px solid #1E1E1E" }}>
                    <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>{p.role}</span>
                    <span style={{ marginLeft:"auto", padding:"3px 10px", background:`${p.color}12`, border:`1px solid ${p.color}25`, borderRadius:20, fontSize:11, color:p.color, fontWeight:600 }}>{p.status}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" data-nav="skills" className="section">
        <div id="sk-h" data-animate className={`fade-up ${vis("sk-h")?"visible":""}`}><div className="sl">Skills</div><div className="st">Technical Proficiency</div></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:24, marginTop:48 }}>
          {skillCategories.map((cat,i)=>(
            <div key={i} id={`sk-${i}`} data-animate className={`gc fade-up s${Math.min(i+1,4)} ${vis(`sk-${i}`)?"visible":""}`}>
              <div className="inn" style={{ padding:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{cat.name}</span>
                  <span style={{ fontSize:13, color:"#10B981", fontWeight:700 }}>{cat.pct}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:vis(`sk-${i}`)?`${cat.pct}%`:"0%" }}/></div>
                <div style={{ marginTop:16, display:"flex", flexWrap:"wrap" }}>{cat.items.map((item,j)=><span key={j} className="skill-tag">{item}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section style={{ background:"#0F0F0F" }}>
        <div className="section">
          <div id="edu-h" data-animate className={`fade-up ${vis("edu-h")?"visible":""}`}><div className="sl">Education & Awards</div><div className="st">Background</div></div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:24, marginTop:48 }}>
            {[{icon:"🎓",title:"경성대학교",desc:"경영학과 졸업 (편입)",period:"2011 — 2019"},{icon:"🏆",title:"웹디자인개발기능사",desc:"한국산업인력공단",period:"2024.09"},{icon:"🥇",title:"서비스 디자인 청사진",desc:"경성대 우수과제공모전 최우수상",period:"2018"},{icon:"🤝",title:"KT&G 마케팅 캠프",desc:"롯데 에비뉴몰 전략 공모전 팀워크상",period:"2011"}].map((item,i)=>(
              <div key={i} id={`edu-${i}`} data-animate className={`gc scale-in s${i+1} ${vis(`edu-${i}`)?"visible":""}`}>
                <div className="inn" style={{ padding:28, display:"flex", gap:16, alignItems:"flex-start" }}>
                  <span style={{ fontSize:32, flexShrink:0, animation:"float 3s ease-in-out infinite", animationDelay:`${i*.4}s` }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:4 }}>{item.title}</div>
                    <div style={{ fontSize:13, color:"#999", marginBottom:4 }}>{item.desc}</div>
                    <div style={{ fontSize:12, color:"#10B981", fontWeight:600 }}>{item.period}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" data-nav="contact" className="section" style={{ textAlign:"center" }}>
        <div id="ct-c" data-animate className={`scale-in ${vis("ct-c")?"visible":""}`}>
          <div className="sl">Contact</div>
          <div className="st" style={{ marginBottom:16 }}>Let's Work Together</div>
          <p style={{ color:"#888", fontSize:15, marginBottom:48, lineHeight:1.7 }}>새로운 도전과 협업에 열려 있습니다. 언제든 연락 주세요.</p>
          <div style={{ display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap" }}>
            {[{icon:"✉️",label:"Email",value:"swat782@nate.com",href:"mailto:swat782@nate.com"},{icon:"📍",label:"Location",value:"부산광역시",href:null as string|null}].map((c,i)=>(
              <div key={i} className="gc" style={{ cursor:c.href?"pointer":"default", minWidth:220 }} onClick={()=>c.href&&window.open(c.href)}>
                <div className="inn" style={{ padding:"36px 44px" }}>
                  <div style={{ fontSize:32, marginBottom:14, animation:"float 2.5s ease-in-out infinite", animationDelay:`${i*.3}s` }}>{c.icon}</div>
                  <div style={{ fontSize:12, color:"#888", marginBottom:4, textTransform:"uppercase", letterSpacing:1.5 }}>{c.label}</div>
                  <div style={{ fontSize:15, color:"#fff", fontWeight:600 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop:"1px solid #1A1A1A", padding:"32px 24px", textAlign:"center" }}><p style={{ fontSize:13, color:"#444" }}>© 2025 Yang SoonMin — Built with passion.</p></footer>

      <div className="fab-pulse"/>
      <button className="chat-fab" onClick={()=>setChatOpen(o=>!o)} style={{ fontSize:chatOpen?22:26 }}>{chatOpen?"✕":"💬"}</button>
      <Chatbot isOpen={chatOpen} onClose={()=>setChatOpen(false)}/>
      <div className={`page-wipe ${wipe}`} aria-hidden="true"><span className="pw-mark">YSM<b>.</b></span></div>
      <Cursor/>
      <LoadingScreen/>
    </div>
  );
};

export default Portfolio;

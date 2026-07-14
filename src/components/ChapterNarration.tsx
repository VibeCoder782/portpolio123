import { JOURNEY } from "../journey/config";

// 챕터 내레이션 오버레이 — 스타일은 Director가 rAF에서 직접 구동 (타이틀 카드 연출 언어)
const LINES = [
  { id: "nar-p1", text: JOURNEY.narration.pivot1 },
  { id: "nar-p2", text: JOURNEY.narration.pivot2 },
  { id: "nar-conv", text: JOURNEY.narration.converge },
];

const ChapterNarration = () => (
  <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}>
    {LINES.map((l) => (
      <div key={l.id} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div
          id={l.id}
          style={{
            opacity: 0,
            color: "#F2F4F3",
            fontWeight: 800,
            fontSize: "clamp(26px,5.5vw,58px)",
            letterSpacing: ".22em",
            textAlign: "center",
            lineHeight: 1.35,
            padding: "0 28px",
            textShadow: "0 2px 44px rgba(0,0,0,.6)",
            willChange: "transform,opacity,filter",
          }}
        >
          {l.text}
        </div>
      </div>
    ))}
  </div>
);

export default ChapterNarration;

"use client";

import { useId } from "react";

// Palette sampled from the DandiyaDuo site
const BG = "#E9AB38";      // page orange
const CREAM = "#FEF6E6";   // card cream
const BROWN = "#3B2414";   // borders / buttons
const CRIMSON = "#AC2A31"; // sidebar stripe
const INDIGO = "#3B35A8";  // logo blue
const COLORS = [CREAM, CRIMSON, BROWN, INDIGO];
const DOTS = 8;
const CYCLE = 1.2; // seconds per clack

type Props = {
  size?: number;
  /** false = static "clack" pose (also used for reduced motion / snapshots) */
  animate?: boolean;
  label?: string;
};

const Stick = ({ x, dir, color, stripe, animate }: { x: number; dir: 1 | -1; color: string; stripe: string; animate: boolean }) => (
  <g
    className={animate ? (dir === 1 ? "dl-swing-l" : "dl-swing-r") : undefined}
    transform={`rotate(${dir * 15} ${x} 96)`}
  >
    <line x1={x} y1={96} x2={x} y2={40} stroke={BROWN} strokeWidth={9} strokeLinecap="round" />
    <line x1={x} y1={96} x2={x} y2={40} stroke={color} strokeWidth={5.4} strokeLinecap="round" />
    <line x1={x} y1={93} x2={x} y2={45} stroke={stripe} strokeWidth={5.4} strokeDasharray="3 6" opacity={0.85} />
    <circle cx={x} cy={40} r={4.2} fill={CREAM} stroke={BROWN} strokeWidth={1.8} />
    {/* grip */}
    <circle cx={x} cy={96} r={4.4} fill={CREAM} stroke={BROWN} strokeWidth={1.8} />
  </g>
);

export function DandiyaLoader({ size = 120, animate = true, label = "Loading" }: Props) {
  const id = "dl" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="status" aria-label={label}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={CREAM} stopOpacity={0.7} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
        {animate && (
          <style>{`
            .dl-ring{animation:dl-spin ${CYCLE * 8}s linear infinite;transform-origin:60px 60px}
            .dl-dot{animation:dl-pulse ${CYCLE}s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
            .dl-swing-l{animation:dl-l ${CYCLE}s infinite;transform-origin:46px 96px}
            .dl-swing-r{animation:dl-r ${CYCLE}s infinite;transform-origin:74px 96px}
            .dl-spark{animation:dl-spark ${CYCLE}s ease-out infinite;transform-origin:60px 42px}
            .dl-wave{animation:dl-wave ${CYCLE}s ease-out infinite;transform-box:fill-box;transform-origin:center}
            .dl-glow{animation:dl-flash ${CYCLE}s ease-out infinite}
            @keyframes dl-spin{to{transform:rotate(360deg)}}
            @keyframes dl-pulse{0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.55);opacity:1}}
            @keyframes dl-l{0%,100%{transform:rotate(-26deg);animation-timing-function:cubic-bezier(.55,0,.9,.4)}
              38%{transform:rotate(15deg);animation-timing-function:ease-out}
              47%{transform:rotate(5deg);animation-timing-function:ease-in-out}
              100%{transform:rotate(-26deg)}}
            @keyframes dl-r{0%,100%{transform:rotate(26deg);animation-timing-function:cubic-bezier(.55,0,.9,.4)}
              38%{transform:rotate(-15deg);animation-timing-function:ease-out}
              47%{transform:rotate(-5deg);animation-timing-function:ease-in-out}
              100%{transform:rotate(26deg)}}
            @keyframes dl-spark{0%,36%{opacity:0;transform:scale(.3)}40%{opacity:1;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.6)}}
            @keyframes dl-wave{0%,36%{opacity:0;transform:scale(.4)}40%{opacity:.8}80%,100%{opacity:0;transform:scale(3.4)}}
            @keyframes dl-flash{0%,36%{opacity:0}40%{opacity:1}75%,100%{opacity:0}}
            @media (prefers-reduced-motion:reduce){.dl-ring,.dl-dot,.dl-swing-l,.dl-swing-r,.dl-spark,.dl-wave,.dl-glow{animation:none}}
          `}</style>
        )}
      </defs>

      {/* garba circle: dots chase each other round the ring */}
      <g className={animate ? "dl-ring" : undefined}>
        {Array.from({ length: DOTS }, (_, i) => {
          const a = (i / DOTS) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              className={animate ? "dl-dot" : undefined}
              style={{ animationDelay: `${-(i * CYCLE) / DOTS}s` }}
              cx={60 + Math.cos(a) * 50}
              cy={60 + Math.sin(a) * 50}
              r={3.8}
              fill={COLORS[i % COLORS.length]}
              stroke={BROWN}
              strokeWidth={1.5}
            />
          );
        })}
      </g>

      {/* impact glow + ground shadow */}
      <circle className={animate ? "dl-glow" : undefined} cx={60} cy={42} r={22} fill={`url(#${id}-glow)`} opacity={animate ? 0 : 1} />
      <ellipse cx={60} cy={104} rx={28} ry={3.2} fill={BROWN} opacity={0.3} />

      {/* sticks */}
      <Stick x={46} dir={1} color={CRIMSON} stripe={CREAM} animate={animate} />
      <Stick x={74} dir={-1} color={CREAM} stripe={BROWN} animate={animate} />

      {/* clack burst */}
      <g className={animate ? "dl-spark" : undefined} opacity={animate ? 0 : 1}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r1 = 7, r2 = i % 2 ? 12 : 15;
          return (
            <line
              key={i}
              x1={60 + Math.cos(a) * r1}
              y1={42 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * r2}
              y2={42 + Math.sin(a) * r2}
              stroke={i % 2 ? BROWN : CREAM}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <circle className={animate ? "dl-wave" : undefined} cx={60} cy={42} r={5} stroke={BROWN} strokeWidth={1.6} opacity={animate ? 0 : 0.5} />
    </svg>
  );
}

/** Full-screen loader on the site's orange dotted background */
export function DandiyaLoaderScreen({ label = "Finding your circle…", size = 140 }: { label?: string; size?: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: `radial-gradient(rgba(59,36,20,.12) 1.2px, transparent 1.4px) 0 0 / 22px 22px, ${BG}`,
        color: BROWN,
        fontWeight: 700,
      }}
    >
      <DandiyaLoader size={size} label={label} />
      <span style={{ fontSize: 15, letterSpacing: 0.2 }}>{label}</span>
    </div>
  );
}

/** Inline (non-fullscreen) centered loader for cards and content areas. */
export function DandiyaLoaderInline({ label = "Loading…", size = 84 }: { label?: string; size?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-6" role="status" aria-label={label}>
      <DandiyaLoader size={size} label={label} />
      <span className="text-sm font-bold opacity-70">{label}</span>
    </div>
  );
}

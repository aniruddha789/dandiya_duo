/**
 * "The Duo": two original gender-neutral characters holding dandiya sticks.
 * Simple rounded SVG — hero, empty states, success moments.
 */

function Stick({ x, rotate, color }: { x: number; rotate: number; color: string }) {
  return (
    <g transform={`rotate(${rotate} ${x} 52)`}>
      <rect x={x - 3} y={18} width={6} height={68} rx={3} fill={color} />
      <rect x={x - 3} y={30} width={6} height={7} fill="#FFF3E0" opacity={0.75} />
      <rect x={x - 3} y={48} width={6} height={7} fill="#FFF3E0" opacity={0.75} />
    </g>
  );
}

function Buddy({
  cx, body, belly, stickColor, stickX, stickRotate, flip,
}: {
  cx: number; body: string; belly: string; stickColor: string; stickX: number; stickRotate: number; flip?: boolean;
}) {
  return (
    <g>
      <Stick x={stickX} rotate={stickRotate} color={stickColor} />
      <ellipse cx={cx} cy={104} rx={26} ry={30} fill={body} />
      <ellipse cx={cx} cy={112} rx={14} ry={16} fill={belly} opacity={0.55} />
      <circle cx={cx - 8} cy={98} r={2.6} fill="#1B1030" />
      <circle cx={cx + 8} cy={98} r={2.6} fill="#1B1030" />
      <circle cx={cx - 7.2} cy={97.2} r={0.9} fill="#FFF3E0" />
      <circle cx={cx + 8.8} cy={97.2} r={0.9} fill="#FFF3E0" />
      <path
        d={`M ${cx - 6} 106 Q ${cx} ${flip ? 109 : 111} ${cx + 6} 106`}
        stroke="#1B1030"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={cx - 15} cy={103} r={3} fill="#FF4F8B" opacity={0.5} />
      <circle cx={cx + 15} cy={103} r={3} fill="#FF4F8B" opacity={0.5} />
      {/* mirror-work dots on the outfit */}
      <circle cx={cx - 6} cy={120} r={1.6} fill="#FFF3E0" opacity={0.8} />
      <circle cx={cx + 6} cy={120} r={1.6} fill="#FFF3E0" opacity={0.8} />
      <circle cx={cx} cy={126} r={1.6} fill="#FFF3E0" opacity={0.8} />
    </g>
  );
}

export function Duo({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 150" fill="none" role="img" aria-label="The Duo, two friends with dandiya sticks">
      <ellipse cx={100} cy={138} rx={78} ry={9} fill="#000" opacity={0.25} />
      <Buddy cx={72} body="#FFB627" belly="#FF7A1A" stickColor="#FF4F8B" stickX={104} stickRotate={-18} />
      <Buddy cx={130} body="#1FB6A6" belly="#0d6e64" stickColor="#FFB627" stickX={98} stickRotate={18} flip />
      {/* sparkles */}
      <path d="M34 34 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" fill="#FFF3E0" opacity={0.9} />
      <path d="M166 26 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#FFB627" />
      <circle cx={156} cy={60} r={2.4} fill="#FF4F8B" />
      <circle cx={44} cy={66} r={2.4} fill="#1FB6A6" />
    </svg>
  );
}

export function DuoMini({ size = 96 }: { size?: number }) {
  return <Duo size={size} />;
}

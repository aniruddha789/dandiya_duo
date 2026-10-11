/**
 * DandiyaDuo logo: two crossed dandiya sticks ("duo" = X) with a diya flame
 * where they cross. Three forms: full lockup, mark only, monochrome.
 */

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="DandiyaDuo mark">
      <line x1="14" y1="50" x2="50" y2="14" stroke="#FFB627" strokeWidth={7} strokeLinecap="round" />
      <line x1="14" y1="50" x2="50" y2="14" stroke="#FF7A1A" strokeWidth={7} strokeLinecap="round" strokeDasharray="4 7" opacity={0.85} />
      <line x1="50" y1="50" x2="14" y2="14" stroke="#FF4F8B" strokeWidth={7} strokeLinecap="round" />
      <line x1="50" y1="50" x2="14" y2="14" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeDasharray="2 9" opacity={0.5} />
      <path d="M32 20 C36 26 38 29 32 35 C26 29 28 26 32 20 Z" fill="#FFD700" stroke="#FF7A1A" strokeWidth={1.5} />
      <circle cx={32} cy={32} r={3.2} fill="#1B1030" />
    </svg>
  );
}

export function LogoLockup({ size = 40 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 4.6);
  return (
    <svg width={w} height={h} viewBox="0 0 184 40" fill="none" role="img" aria-label="DandiyaDuo">
      <g transform="translate(0,2) scale(0.56)">
        <line x1="14" y1="50" x2="50" y2="14" stroke="#FFB627" strokeWidth={7} strokeLinecap="round" />
        <line x1="50" y1="50" x2="14" y2="14" stroke="#FF4F8B" strokeWidth={7} strokeLinecap="round" />
        <path d="M32 20 C36 26 38 29 32 35 C26 29 28 26 32 20 Z" fill="#FFD700" />
      </g>
      <text x={40} y={28} fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={24} fill="#FFF3E0">
        Dandiya
      </text>
      <text x={124} y={28} fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={24} fill="#FF4F8B">
        Duo
      </text>
    </svg>
  );
}

export function LogoMono({ size = 40, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="DandiyaDuo mark">
      <line x1="14" y1="50" x2="50" y2="14" stroke={color} strokeWidth={7} strokeLinecap="round" />
      <line x1="50" y1="50" x2="14" y2="14" stroke={color} strokeWidth={7} strokeLinecap="round" />
      <path d="M32 20 C36 26 38 29 32 35 C26 29 28 26 32 20 Z" fill={color} />
    </svg>
  );
}

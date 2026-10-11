/* DandiyaDuo mascots — original artwork supplied by the team, inline SVG. */

export function SunflowerMascot({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img" aria-label="Sunny the smiling sunflower">
      <g fill="#FFC700" stroke="#E6A100" strokeWidth={2} strokeLinejoin="round">
        <path d="M60 10 C65 25, 55 25, 60 10 Z" />
        <path d="M60 10 C67 22, 77 28, 77 28 C77 28, 68 38, 60 38" />
        <path d="M60 12 C66 28 72 32 82 20 C78 34 85 42 100 40 C88 49 90 60 105 60 C90 60 88 71 100 80 C85 78 78 86 82 100 C72 88 66 92 60 108 C54 92 48 88 38 100 C42 86 35 78 20 80 C32 71 30 60 15 60 C30 60 32 49 20 40 C35 42 42 34 38 20 C48 32 54 28 60 12 Z" />
      </g>
      <circle cx="60" cy="60" r="32" fill="#7B3F00" stroke="#5A2E00" strokeWidth={2} />
      <circle cx="50" cy="55" r="4" fill="#1A1A1A" />
      <circle cx="70" cy="55" r="4" fill="#1A1A1A" />
      <circle cx="51.5" cy="53.5" r="1.5" fill="#FFFFFF" />
      <circle cx="71.5" cy="53.5" r="1.5" fill="#FFFFFF" />
      <ellipse cx="43" cy="63" rx="5" ry="3" fill="#FF8A8A" opacity={0.8} />
      <ellipse cx="77" cy="63" rx="5" ry="3" fill="#FF8A8A" opacity={0.8} />
      <path d="M52 65 Q60 74 68 65" stroke="#1A1A1A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function DiyaMascot({ size = 120, lit = true }: { size?: number; lit?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" role="img" aria-label="Dee the smiling diya lamp">
      {lit && <circle cx="50" cy="30" r="18" fill="#FFD700" opacity={0.25} />}
      {lit && <path d="M50 12 C58 24 64 32 50 44 C36 32 42 24 50 12 Z" fill="#FF4500" />}
      {lit && <path d="M50 20 C54 27 57 32 50 40 C43 32 46 27 50 20 Z" fill="#FFD700" />}
      <path d="M20 48 Q50 40 80 48 C85 68 68 82 50 82 C32 82 15 68 20 48 Z" fill="#E65100" stroke="#B71C1C" strokeWidth={2.5} />
      <ellipse cx="50" cy="48" rx="30" ry="6" fill="#FF9800" stroke="#B71C1C" strokeWidth={2} />
      <circle cx="41" cy="60" r="3.5" fill="#1A1A1A" />
      <circle cx="59" cy="60" r="3.5" fill="#1A1A1A" />
      <circle cx="42" cy="58.5" r="1.2" fill="#FFFFFF" />
      <circle cx="60" cy="58.5" r="1.2" fill="#FFFFFF" />
      <ellipse cx="34" cy="65" rx="4" ry="2.5" fill="#FF8A8A" opacity={0.8} />
      <ellipse cx="66" cy="65" rx="4" ry="2.5" fill="#FF8A8A" opacity={0.8} />
      <path d="M44 66 Q50 73 56 66" stroke="#1A1A1A" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function DancerPeek({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" role="img" aria-label="A dancer peeking in">
      <path d="M25 140 Q30 85 70 85 Q110 85 115 140 Z" fill="#E91E63" stroke="#880E4F" strokeWidth={2.5} />
      <path d="M40 140 Q70 100 100 140" fill="none" stroke="#FFD700" strokeWidth={4} strokeDasharray="6,4" />
      <circle cx="70" cy="55" r="28" fill="#1A1A1A" />
      <circle cx="70" cy="58" r="22" fill="#FCD5CE" />
      <circle cx="70" cy="48" r="2" fill="#D32F2F" />
      <path d="M58 58 Q63 53 66 58" stroke="#1A1A1A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <circle cx="78" cy="57" r="3" fill="#1A1A1A" />
      <ellipse cx="54" cy="64" rx="4" ry="2.5" fill="#FF8A8A" />
      <ellipse cx="86" cy="64" rx="4" ry="2.5" fill="#FF8A8A" />
      <path d="M64 65 Q70 73 76 65" stroke="#1A1A1A" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <g transform="rotate(-25 35 75)">
        <rect x="20" y="30" width="8" height="65" rx="4" fill="#FF9800" stroke="#E65100" strokeWidth={1.5} />
        <line x1="20" y1="45" x2="28" y2="45" stroke="#FFD700" strokeWidth={3} />
        <line x1="20" y1="60" x2="28" y2="60" stroke="#E91E63" strokeWidth={3} />
        <circle cx="24" cy="70" r="6" fill="#FCD5CE" />
      </g>
      <g transform="rotate(30 105 75)">
        <rect x="112" y="30" width="8" height="65" rx="4" fill="#4CAF50" stroke="#1B5E20" strokeWidth={1.5} />
        <line x1="112" y1="45" x2="120" y2="45" stroke="#FFD700" strokeWidth={3} />
        <line x1="112" y1="60" x2="120" y2="60" stroke="#E91E63" strokeWidth={3} />
        <circle cx="116" cy="70" r="6" fill="#FCD5CE" />
      </g>
    </svg>
  );
}

/** Small diya icon used for the 6-step wizard progress. */
export function DiyaIcon({ filled, size = 30 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      {filled && (
        <>
          <path d="M16 3 C19 8 22 11 16 16 C10 11 13 8 16 3 Z" fill="#FF4500" />
          <path d="M16 7 C18 10 19 12 16 15 C13 12 14 10 16 7 Z" fill="#FFD700" />
        </>
      )}
      <path
        d="M6 17 Q16 13 26 17 C28 25 22 29 16 29 C10 29 4 25 6 17 Z"
        fill={filled ? "#FF9800" : "transparent"}
        stroke="#E65100"
        strokeWidth={1.5}
      />
      <ellipse cx="16" cy="17" rx="10" ry="2.5" fill={filled ? "#FFB74D" : "none"} />
    </svg>
  );
}

export function ProgressDiyas({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="img" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <DiyaIcon key={i} filled={i < step} />
      ))}
    </div>
  );
}

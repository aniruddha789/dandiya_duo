import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  selected,
  children,
  ...rest
}: { selected?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-pressed={!!selected} className="chip" {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("sticker-card p-4 sm:p-5", className)}>{children}</div>;
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn("btn-primary", props.className)} />;
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn("btn-secondary", props.className)} />;
}

export function Banner({ icon, children, tone = "dark" }: { icon: string; children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <div className={tone === "light" ? "banner banner-on-light" : "banner"} role="note">
      <span aria-hidden>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="vibe-badge" aria-label={`${score} percent vibe`}>
      <div className="leading-tight">
        <div className="font-display text-lg font-extrabold">{score}%</div>
        <div className="text-[10px] font-bold">vibe</div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#FFB627", "#FF4F8B", "#1FB6A6", "#FFF3E0", "#FF7A1A"];

/** Short brand-colour sparkle burst. Static (no motion) under reduced-motion. */
export function Confetti({ pieces = 26 }: { pieces?: number }) {
  const parts = Array.from({ length: pieces });
  return (
    <div className="sparkle-field" aria-hidden>
      {parts.map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 97) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.07}s`,
            width: i % 3 === 0 ? 10 : 7,
            height: i % 3 === 0 ? 10 : 7,
          }}
        />
      ))}
    </div>
  );
}

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

export function Banner({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="banner" role="note">
      <span aria-hidden>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className="absolute right-2 top-2 flex h-16 w-16 rotate-6 items-center justify-center rounded-full border-[3px] text-center"
      style={{ background: "#ffd166", borderColor: "var(--bark)" }}
      aria-label={`${score} percent good vibes`}
    >
      <div className="leading-tight">
        <div className="font-display text-lg font-black">{score}%</div>
        <div className="text-[10px] font-bold">good vibes</div>
      </div>
    </div>
  );
}

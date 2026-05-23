import { useEffect, useState } from "react";

export type Grade = "A" | "B" | "C" | "D" | "F";

export function gradeForScore(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

const GRADE_COLOR: Record<Grade, string> = {
  A: "var(--color-primary)",         // green
  B: "oklch(0.78 0.13 195)",         // teal
  C: "var(--color-warning)",         // amber
  D: "oklch(0.72 0.19 50)",          // orange
  F: "var(--color-destructive)",     // red
};

export function ScoreRing({
  score,
  size = 110,
  stroke = 9,
  animate = true,
}: {
  score: number;
  size?: number;
  stroke?: number;
  animate?: boolean;
}) {
  const [shown, setShown] = useState(animate ? 0 : score);
  useEffect(() => {
    if (!animate) { setShown(score); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animate]);

  const grade = gradeForScore(shown);
  const color = GRADE_COLOR[grade];
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, shown)) / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 240ms ease, stroke 240ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-extrabold leading-none" style={{ color }}>{grade}</div>
        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{shown}</div>
      </div>
    </div>
  );
}

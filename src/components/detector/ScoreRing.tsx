// 环境风险环形仪表：SVG 圆环 + 数字滚动，颜色随风险等级变化。
import { useEffect, useRef, useState } from "react";

export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    if (first.current) {
      first.current = false;
      setShown(0);
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{shown}</>;
}

export function riskTone(score: number) {
  if (score >= 70) return "risk";
  if (score >= 31) return "warn";
  if (score > 0) return "light";
  return "ok";
}

export function ScoreRing({ score, size = 168, stroke = 11, active }: { score: number; size?: number; stroke?: number; active: boolean }) {
  const tone = riskTone(score);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setFilled(score);
      return;
    }
    const frame = requestAnimationFrame(() => setFilled(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circumference * (1 - Math.min(100, filled) / 100);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`ring-stroke ring-${tone}`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className={`font-sora text-[2.6rem] leading-none font-semibold tabular-nums ${active ? `text-${tone === "ok" ? "ok" : tone === "risk" ? "risk" : tone === "warn" ? "warn" : "ink"}` : "text-muted"}`}>
            <CountUp value={active ? score : 0} />
          </p>
          <p className="mt-1 text-[0.7rem] tracking-[0.18em] text-muted uppercase">/ 100</p>
        </div>
      </div>
    </div>
  );
}

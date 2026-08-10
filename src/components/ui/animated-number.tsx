"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  className?: string;
  jitter?: boolean;
}

const ANIMATION_DURATION_MS = 700;
const ANIMATION_STEP_MS = 40;

export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  className,
  jitter = true,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  // Tracks the last rendered value so a value change animates smoothly from
  // wherever the number currently is, not from zero every time — matters
  // once `value` starts changing repeatedly (e.g. live match polling).
  const displayRef = useRef(0);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    const start = Date.now();

    // setInterval rather than requestAnimationFrame: rAF callbacks are
    // silently never invoked while the tab/frame isn't actively
    // compositing, which would leave this stuck permanently — setInterval
    // keeps ticking regardless.
    const interval = setInterval(() => {
      const progress = Math.min((Date.now() - start) / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (to - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (progress >= 1) clearInterval(interval);
    }, ANIMATION_STEP_MS);

    return () => clearInterval(interval);
  }, [value]);

  useEffect(() => {
    if (!jitter) return;
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * Math.abs(value) * 0.015;
      const next = value + noise;
      displayRef.current = next;
      setDisplay(next);
    }, 2600);
    return () => clearInterval(interval);
  }, [value, jitter]);

  const sign = display >= 0 ? "+" : "-";
  const formatted = Math.abs(display).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {sign}
      {prefix}
      {formatted}
    </span>
  );
}

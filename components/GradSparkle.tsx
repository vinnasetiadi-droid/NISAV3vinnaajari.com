"use client";

import { useId } from "react";
import { Sparkles } from "lucide-react";

/** Sparkle dengan fill gradient cyan→biru (sama seperti ikon di komposer). */
export function GradSparkle({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="55%" stopColor="#38b6ff" />
            <stop offset="100%" stopColor="#0a70ff" />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles
        size={size}
        stroke={`url(#${id})`}
        fill={`url(#${id})`}
        className={className}
      />
    </>
  );
}

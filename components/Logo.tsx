import { cn } from "@/lib/utils";

/** NISA glyph — two rounded strokes, slight italic slant. */
export function Glyph({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <g transform="skewX(-8)">
        <rect x="16" y="6" width="7.5" height="26" rx="3.75" fill={color} />
        <rect x="27.5" y="16" width="7.5" height="26" rx="3.75" fill={color} />
      </g>
    </svg>
  );
}

export function LogoLockup({
  className,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-nisa.png"
      alt="NISA — Powered by Ajari"
      className={cn("h-9 w-auto", className)}
    />
  );
}

/** Wordmark NISA — varian gelap/terang otomatis mengikuti tema. */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-nisa-light.png"
        alt="NISA"
        className={cn("w-auto dark:hidden", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-nisa.png"
        alt="NISA"
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}

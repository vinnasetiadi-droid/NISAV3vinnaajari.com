"use client";

/**
 * Bola AI NISA. Dua sumber video di-swap mengikuti tema:
 * light → orb-light.mp4 (bg putih, bola ≈93.6% tinggi frame → zoom 107%)
 * dark  → orb.mp4 (bg hitam, bola ≈88% frame → zoom 112%)
 */
export function OrbVideo({ smoothLoop }: { smoothLoop?: boolean }) {
  const onTime = smoothLoop
    ? (e: React.SyntheticEvent<HTMLVideoElement>) => {
        // loop mulus: lompat balik sesaat sebelum frame terakhir
        const v = e.currentTarget;
        if (v.duration && v.duration - v.currentTime < 0.1) v.currentTime = 0.02;
      }
    : undefined;
  const base =
    "absolute left-1/2 top-1/2 w-auto max-w-none -translate-x-1/2 -translate-y-1/2";
  return (
    <>
      <video
        src="/orb-light.mp4"
        autoPlay
        muted
        loop
        playsInline
        onTimeUpdate={onTime}
        className={`${base} h-[107%] dark:hidden`}
      />
      <video
        src="/orb.mp4"
        autoPlay
        muted
        loop
        playsInline
        onTimeUpdate={onTime}
        className={`${base} hidden h-[112%] dark:block`}
      />
    </>
  );
}

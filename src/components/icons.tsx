import type { SVGProps } from "react";

export const PAW_PATH =
  "M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5zM19.28 26.71C21.07 30.08 20.42 33.92 17.84 35.29C15.25 36.67 11.71 35.05 9.92 31.69C8.13 28.32 8.78 24.48 11.36 23.11C13.95 21.73 17.49 23.35 19.28 26.71ZM29.62 15.64C30.32 19.62 28.46 23.26 25.47 23.79C22.48 24.32 19.48 21.53 18.78 17.56C18.08 13.58 19.94 9.94 22.93 9.41C25.92 8.88 28.92 11.67 29.62 15.64ZM45.22 17.56C44.52 21.53 41.52 24.32 38.53 23.79C35.54 23.26 33.68 19.62 34.38 15.64C35.08 11.67 38.08 8.88 41.07 9.41C44.06 9.94 45.92 13.58 45.22 17.56ZM54.08 31.69C52.29 35.05 48.75 36.67 46.16 35.29C43.58 33.92 42.93 30.08 44.72 26.71C46.51 23.35 50.05 21.73 52.64 23.11C55.22 24.48 55.87 28.32 54.08 31.69Z";

export function PawIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" fill="currentColor" {...props}>
      <path d={PAW_PATH} />
    </svg>
  );
}

const SPARKLE_PATH = "M20 3c1.6 9.4 7.6 15.4 17 17-9.4 1.6-15.4 7.6-17 17-1.6-9.4-7.6-15.4-17-17 9.4-1.6 15.4-7.6 17-17z";

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <path d={SPARKLE_PATH} fill="currentColor" />
    </svg>
  );
}

/** A scatter of twinkling sparkles, positioned in percentages of the parent. */
export function Twinkles({
  stars,
  className = "pointer-events-none absolute inset-0",
}: {
  stars: [left: number, top: number, size: number][];
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={className}>
      {stars.map(([left, top, size], i) => (
        <SparkleIcon
          key={i}
          className="tp-twinkle absolute text-honey"
          style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, animationDelay: `${(i * 0.4).toFixed(2)}s` }}
        />
      ))}
    </div>
  );
}

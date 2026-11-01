import { getImageProps } from "next/image";
import { useId } from "react";
import type { Puppy } from "@/lib/content";

/** Korea → Dubai flight path with a plane carrying a puppy in its porthole. */
export function Flight({ pup }: { pup: Puppy }) {
  const clipId = useId();
  const { src } = getImageProps({ src: pup.cover.url, alt: "", width: 64, height: 64 }).props;
  return (
    <div className="tp-flight">
      <svg viewBox="0 0 660 300" role="img" aria-label={`A plane bringing a ${pup.displayName} puppy from Korea to Dubai`}>
        <defs>
          <clipPath id={clipId}>
            <circle r="25" />
          </clipPath>
        </defs>
        <path d="M40 250 C 170 40, 470 20, 620 168" className="tp-flight__route" />
        <circle cx="40" cy="250" r="7" className="tp-flight__dot" />
        <circle cx="620" cy="168" r="7" className="tp-flight__dot" />
        <text x="40" y="284" textAnchor="middle" className="tp-flight__label">
          Korea
        </text>
        <text x="620" y="202" textAnchor="middle" className="tp-flight__label">
          Dubai
        </text>
        <g transform="translate(410 70)">
          <g transform="translate(-126 -78)">
            <path d="M28 60 L8 26 L34 26 L60 54 Z" className="tp-flight__wing" />
            <path d="M108 112 L142 156 L172 156 L158 112 Z" className="tp-flight__wing tp-flight__wing--far" />
            <path
              d="M20 80 C20 52 52 44 80 44 L168 44 C200 44 224 60 232 80 C224 100 200 112 168 112 L80 112 C52 112 20 104 20 80 Z"
              className="tp-flight__body"
            />
            <path d="M104 44 L138 2 L168 2 L154 44 Z" className="tp-flight__wing" />
            <path d="M206 64 C215 67 221 73 224 80" className="tp-flight__line" />
          </g>
          <g transform="translate(10 2)">
            <image
              href={src}
              x="-25"
              y="-25"
              width="50"
              height="50"
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle r="25" className="tp-flight__porthole" />
          </g>
        </g>
      </svg>
    </div>
  );
}

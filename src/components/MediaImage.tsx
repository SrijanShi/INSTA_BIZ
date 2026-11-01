import Image from "next/image";
import type { CSSProperties } from "react";
import { focalPosition, type Media } from "@/lib/content";

type Props = {
  media: Media;
  sizes: string;
  alt?: string;
  className?: string;
  /** Above-the-fold hero images: preload with high priority. */
  preload?: boolean;
  /** Load immediately without preloading. */
  eager?: boolean;
  quality?: number;
  /** "fill" covers its (positioned) parent; "natural" keeps the aspect ratio. */
  layout?: "fill" | "natural";
  style?: CSSProperties;
};

/**
 * A CMS photo: blurred placeholder and dominant colour while loading, and
 * cropped around its focal point so the puppy stays in frame.
 */
export function MediaImage({ media, sizes, alt, className, preload, eager, quality = 75, layout = "fill", style }: Props) {
  const common = {
    src: media.url,
    sizes,
    quality,
    preload,
    loading: preload || eager ? "eager" : "lazy",
    fetchPriority: preload ? "high" : undefined,
    placeholder: (media.blurDataUrl ?? "empty") as `data:image/${string}` | "empty",
    className,
  } as const;

  if (layout === "natural") {
    return (
      <Image
        {...common}
        alt={alt ?? media.alt}
        width={media.width}
        height={media.height}
        style={{ width: "100%", height: "auto", backgroundColor: media.color, ...style }}
      />
    );
  }
  return (
    <Image
      {...common}
      alt={alt ?? media.alt}
      fill
      style={{ objectFit: "cover", objectPosition: focalPosition(media), backgroundColor: media.color, ...style }}
    />
  );
}

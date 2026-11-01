import type { CSSProperties, HTMLAttributes } from "react";

/** Sky colours of a scene; the home page goes from morning to night. */
export type Tone = { top: string; bottom: string; dark?: boolean; sunset?: boolean };

export const tones = {
  morning: { top: "#fffdf8", bottom: "#fff1d8" },
  meet: { top: "#fff1d8", bottom: "#fbe3b4" },
  paths: { top: "#fbe3b4", bottom: "#f7d18d" },
  chat: { top: "#f7d18d", bottom: "#f0b866" },
  passport: { top: "#f0b866", bottom: "#a65a30", sunset: true },
  dusk: { top: "#a65a30", bottom: "#4d2b19", dark: true },
  night: { top: "#4d2b19", bottom: "#2f1a10", dark: true },
  home: { top: "#2f1a10", bottom: "#24130b", dark: true },
} satisfies Record<string, Tone>;

const CITY =
  "M0 160V118h34v-14h22v-22h30v34h18V96h26v30h22v-18h16v-30h34v40h20V70h28v56h24V98h18v-26h30v54h20v-38h26v-40l14-6 14 6v40h22v46h18V84h26v-30h22v50h24V76h36v50h20V96h18v-58h30v44h14V96h22v-30h16v22h26v-52l6-8v-24l4-6v-30l3-18 3 18v30l4 6v24l6 8v52h26v30h22V82h30v-20h24v48h20V90h28v-36h26v56h18V74h30v36h22V94h26v-24h30v62h20V102h26v20h34v38z";

type Props = HTMLAttributes<HTMLElement> & { tone: Tone; style?: CSSProperties };

/**
 * A full-bleed section with its own sky gradient. Scenes are also the
 * places the home page's walking Teddy passes through.
 */
export function Scene({ tone, className = "", style, children, ...props }: Props) {
  return (
    <section
      data-pup-scene
      data-tone={tone.dark ? "dark" : "light"}
      className={`tp-scene ${className}`}
      style={{ "--sky-top": tone.top, "--sky-bottom": tone.bottom, ...style } as CSSProperties}
      {...props}
    >
      {children}
      {tone.sunset && (
        <div aria-hidden="true" className="tp-horizon">
          <span className="tp-horizon__sun" />
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="tp-horizon__city">
            <path d={CITY} />
          </svg>
        </div>
      )}
    </section>
  );
}

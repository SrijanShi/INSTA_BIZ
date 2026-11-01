import type { CSSProperties } from "react";
import type { PoseName } from "./rig";
import { PupBuddy } from "./PupBuddy";

type Props = {
  pose: PoseName;
  facing?: "left" | "right";
  /** What the home-page walker does on arrival. */
  act?: "peekaboo" | "basket" | "tilt" | "treadmill";
  /** The walker should tuck in behind scenery here. */
  behind?: boolean;
  /** Stop sits on its own lane (the walker leaves the path to reach it). */
  lane?: boolean;
  label?: string;
  className: string;
  style?: CSSProperties;
};

/**
 * A spot where Teddy sits in a scene. On the home page the walking Teddy
 * visits each stop in turn (and the static one hides); elsewhere it is just
 * an interactive {@link PupBuddy}.
 */
export function PupStop({ pose, facing = "right", act, behind, lane, label, className, style }: Props) {
  return (
    <div
      data-pup-stop="true"
      data-pose={pose}
      data-facing={facing}
      data-act={act}
      data-behind={behind || undefined}
      data-lane={lane || undefined}
      className={`pup-stop ${className}`}
      style={style}
    >
      <PupBuddy pose={pose} facing={facing} label={label} asStop />
    </div>
  );
}

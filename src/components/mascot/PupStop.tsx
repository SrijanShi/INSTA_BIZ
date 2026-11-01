import type { PoseName } from "./rig";
import { PupBuddy } from "./PupBuddy";

type Props = {
  pose: PoseName;
  facing?: "left" | "right";
  /** What the home-page walker does on arrival ("peekaboo", "basket", "tilt"). */
  act?: "peekaboo" | "basket" | "tilt";
  /** The walker should tuck in behind scenery here. */
  behind?: boolean;
  /** Stop sits on its own lane (the walker leaves the path to reach it). */
  lane?: boolean;
  label: string;
  className: string;
};

/**
 * A spot where Teddy sits in a scene. On the home page the walking Teddy
 * visits each stop in turn (and the static one hides); elsewhere it is just
 * an interactive {@link PupBuddy}.
 */
export function PupStop({ pose, facing = "right", act, behind, lane, label, className }: Props) {
  return (
    <div
      data-pup-stop="true"
      data-pose={pose}
      data-facing={facing}
      data-act={act}
      data-behind={behind || undefined}
      data-lane={lane || undefined}
      className={`pup-stop ${className}`}
    >
      <PupBuddy pose={pose} facing={facing} act={act === "tilt" ? "tilt" : undefined} label={label} asStop />
    </div>
  );
}

/** What the walking Teddy should glance at, for how long, and what to say. */
export type PupCue = { look: Element; secs: number; say?: string };

const EVENT = "tp:pup-cue";

/** Ask the home page's walking Teddy to look at something. */
export function cuePup(cue: PupCue) {
  dispatchEvent(new CustomEvent<PupCue>(EVENT, { detail: cue }));
}

export function onPupCue(handler: (cue: PupCue) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<PupCue>).detail);
  addEventListener(EVENT, listener);
  return () => removeEventListener(EVENT, listener);
}

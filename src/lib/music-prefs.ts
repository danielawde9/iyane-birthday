export const MUSIC_PREF_KEY = "iyane.music";

type Readable = Pick<Storage, "getItem">;
type Writable = Pick<Storage, "setItem">;

/** null = no saved preference yet. */
export type MusicPref = "on" | "off" | null;

/** SSR/private-mode safe; never throws. */
export function loadMusicPref(storage: Readable): MusicPref {
  try {
    const v = storage.getItem(MUSIC_PREF_KEY);
    return v === "on" || v === "off" ? v : null;
  } catch {
    return null;
  }
}

export function saveMusicPref(storage: Writable, pref: "on" | "off"): void {
  try {
    storage.setItem(MUSIC_PREF_KEY, pref);
  } catch {
    /* ignore disabled/full storage */
  }
}

/**
 * Attempt autoplay on load unless the user explicitly turned music off.
 * First visit (null) and a saved "on" both opt in; only "off" stays silent.
 */
export function shouldAutoplayOnLoad(pref: MusicPref): boolean {
  return pref !== "off";
}

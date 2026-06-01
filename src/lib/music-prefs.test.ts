import { describe, it, expect } from "vitest";
import { loadMusicPref, saveMusicPref, shouldAutoplayOnLoad, MUSIC_PREF_KEY } from "./music-prefs";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
  };
}

describe("music prefs", () => {
  it("returns null when nothing is saved", () => {
    expect(loadMusicPref(fakeStorage())).toBeNull();
  });

  it("loads a saved 'on' or 'off'", () => {
    expect(loadMusicPref(fakeStorage({ [MUSIC_PREF_KEY]: "on" }))).toBe("on");
    expect(loadMusicPref(fakeStorage({ [MUSIC_PREF_KEY]: "off" }))).toBe("off");
  });

  it("treats junk values as no preference", () => {
    expect(loadMusicPref(fakeStorage({ [MUSIC_PREF_KEY]: "maybe" }))).toBeNull();
  });

  it("saves a preference and reloads it", () => {
    const s = fakeStorage();
    saveMusicPref(s, "off");
    expect(loadMusicPref(s)).toBe("off");
  });

  it("autoplays on first visit (null) and when 'on', but not when 'off'", () => {
    expect(shouldAutoplayOnLoad(null)).toBe(true);
    expect(shouldAutoplayOnLoad("on")).toBe(true);
    expect(shouldAutoplayOnLoad("off")).toBe(false);
  });
});

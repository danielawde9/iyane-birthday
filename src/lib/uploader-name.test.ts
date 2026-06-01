import { describe, it, expect } from "vitest";
import {
  loadUploaderName,
  saveUploaderName,
  clearUploaderName,
  UPLOADER_NAME_KEY,
} from "./uploader-name";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    has: (k: string) => store.has(k),
  };
}

describe("uploader-name store", () => {
  it("returns empty string when nothing is saved", () => {
    expect(loadUploaderName(fakeStorage())).toBe("");
  });

  it("saves a trimmed name and loads it back", () => {
    const s = fakeStorage();
    saveUploaderName(s, "  Daniel  ");
    expect(loadUploaderName(s)).toBe("Daniel");
  });

  it("saving an empty / whitespace name clears the key", () => {
    const s = fakeStorage({ [UPLOADER_NAME_KEY]: "Old" });
    saveUploaderName(s, "   ");
    expect(s.has(UPLOADER_NAME_KEY)).toBe(false);
  });

  it("clear removes the stored name", () => {
    const s = fakeStorage({ [UPLOADER_NAME_KEY]: "Daniel" });
    clearUploaderName(s);
    expect(loadUploaderName(s)).toBe("");
  });

  it("trims whitespace on load", () => {
    const s = fakeStorage({ [UPLOADER_NAME_KEY]: "  Mae " });
    expect(loadUploaderName(s)).toBe("Mae");
  });
});

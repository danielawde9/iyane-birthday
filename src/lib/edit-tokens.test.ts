import { describe, it, expect } from "vitest";
import {
  EDIT_TOKENS_KEY,
  MAX_STORED_TOKENS,
  loadEditToken,
  saveEditToken,
  forgetEditToken,
  listOwnedIds,
  clearEditTokens,
} from "./edit-tokens";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    has: (k: string) => store.has(k),
    raw: () => store.get(EDIT_TOKENS_KEY) ?? "",
  };
}

/** Private mode / disabled storage: every method throws. */
const hostileStorage = {
  getItem: () => {
    throw new DOMException("denied");
  },
  setItem: () => {
    throw new DOMException("quota");
  },
  removeItem: () => {
    throw new DOMException("denied");
  },
};

describe("edit-tokens store", () => {
  it("returns null for a row it holds no token for", () => {
    expect(loadEditToken(fakeStorage(), "photo", "p1")).toBeNull();
  });

  it("saves a token and reads it back", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "p1", "tok-1");
    expect(loadEditToken(s, "photo", "p1")).toBe("tok-1");
  });

  it("keeps photo and guestbook ids in separate namespaces", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "x", "photo-token");
    saveEditToken(s, "guestbook", "x", "wish-token");
    expect(loadEditToken(s, "photo", "x")).toBe("photo-token");
    expect(loadEditToken(s, "guestbook", "x")).toBe("wish-token");
  });

  it("forgets a single token without touching the others", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "p1", "a");
    saveEditToken(s, "photo", "p2", "b");
    forgetEditToken(s, "photo", "p1");
    expect(loadEditToken(s, "photo", "p1")).toBeNull();
    expect(loadEditToken(s, "photo", "p2")).toBe("b");
  });

  it("lists the ids this browser owns, per kind", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "p1", "a");
    saveEditToken(s, "photo", "p2", "b");
    saveEditToken(s, "guestbook", "g1", "c");
    expect(listOwnedIds(s, "photo").sort()).toEqual(["p1", "p2"]);
    expect(listOwnedIds(s, "guestbook")).toEqual(["g1"]);
  });

  it("clears everything", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "p1", "a");
    clearEditTokens(s);
    expect(listOwnedIds(s, "photo")).toEqual([]);
  });

  it("survives storage that throws on every call (private mode)", () => {
    expect(() => saveEditToken(hostileStorage, "photo", "p1", "a")).not.toThrow();
    expect(loadEditToken(hostileStorage, "photo", "p1")).toBeNull();
    expect(listOwnedIds(hostileStorage, "photo")).toEqual([]);
    expect(() => forgetEditToken(hostileStorage, "photo", "p1")).not.toThrow();
    expect(() => clearEditTokens(hostileStorage)).not.toThrow();
  });

  it("survives a corrupt blob rather than throwing", () => {
    const s = fakeStorage({ [EDIT_TOKENS_KEY]: "{not json" });
    expect(loadEditToken(s, "photo", "p1")).toBeNull();
    expect(listOwnedIds(s, "photo")).toEqual([]);
    saveEditToken(s, "photo", "p1", "a");
    expect(loadEditToken(s, "photo", "p1")).toBe("a");
  });

  it("ignores a blob of the wrong shape", () => {
    const s = fakeStorage({ [EDIT_TOKENS_KEY]: JSON.stringify(["not", "an", "object"]) });
    expect(listOwnedIds(s, "photo")).toEqual([]);
  });

  it("ignores entries whose token is not a string", () => {
    const s = fakeStorage({ [EDIT_TOKENS_KEY]: JSON.stringify({ "photo:p1": { t: 42, at: 1 } }) });
    expect(loadEditToken(s, "photo", "p1")).toBeNull();
    expect(listOwnedIds(s, "photo")).toEqual([]);
  });

  it("caps the store and evicts the oldest entries first", () => {
    const s = fakeStorage();
    for (let i = 0; i < MAX_STORED_TOKENS + 5; i++) saveEditToken(s, "photo", `p${i}`, `t${i}`, i);
    const owned = listOwnedIds(s, "photo");
    expect(owned.length).toBe(MAX_STORED_TOKENS);
    expect(owned).not.toContain("p0");
    expect(owned).toContain(`p${MAX_STORED_TOKENS + 4}`);
  });

  it("re-saving a row updates its token in place rather than adding a second entry", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "p1", "old");
    saveEditToken(s, "photo", "p1", "new");
    expect(loadEditToken(s, "photo", "p1")).toBe("new");
    expect(listOwnedIds(s, "photo")).toEqual(["p1"]);
  });

  it("keeps everything under one storage key", () => {
    const s = fakeStorage();
    saveEditToken(s, "photo", "p1", "a");
    saveEditToken(s, "guestbook", "g1", "b");
    expect(s.has(EDIT_TOKENS_KEY)).toBe(true);
  });
});

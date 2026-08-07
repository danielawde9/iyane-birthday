/**
 * Where the browser keeps the capability tokens for the rows it created.
 *
 * There are no accounts on this site, so this store IS the guest's identity: a
 * token here is the only proof that this browser posted a given photo or wish.
 * That has two consequences the UI has to say out loud — the tokens are tied to
 * this device and browser, and clearing site data means the host becomes the
 * only way to change anything.
 *
 * Same defensive shape as `uploader-name.ts`: storage is injected rather than
 * reached for, and nothing here throws — Safari private mode throws on
 * `setItem`, and a full quota throws on write.
 */

export const EDIT_TOKENS_KEY = "iyane_edit_tokens_v1";

/** A phone at a party uploads a lot; keep the blob bounded and evict the oldest. */
export const MAX_STORED_TOKENS = 200;

export type EditKind = "photo" | "guestbook";

type Readable = Pick<Storage, "getItem">;
type Writable = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Removable = Pick<Storage, "removeItem">;

/** One entry per row: the token plus when we stored it (for eviction order). */
interface Entry {
  t: string;
  at: number;
}

const entryKey = (kind: EditKind, id: string): string => `${kind}:${id}`;

function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Partial<Entry>;
  return typeof e.t === "string" && e.t.length > 0 && typeof e.at === "number";
}

/** Every valid entry in the store. A corrupt, absent or hostile store reads as empty. */
function readAll(storage: Readable): Record<string, Entry> {
  let raw: string | null = null;
  try {
    raw = storage.getItem(EDIT_TOKENS_KEY);
  } catch {
    return {};
  }
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, Entry> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isEntry(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(storage: Writable, entries: Record<string, Entry>): void {
  try {
    storage.setItem(EDIT_TOKENS_KEY, JSON.stringify(entries));
  } catch {
    /* private mode / quota — the guest simply loses the affordance */
  }
}

export function loadEditToken(storage: Readable, kind: EditKind, id: string): string | null {
  return readAll(storage)[entryKey(kind, id)]?.t ?? null;
}

/** Ids of the rows of this kind that this browser can edit. */
export function listOwnedIds(storage: Readable, kind: EditKind): string[] {
  const prefix = `${kind}:`;
  return Object.keys(readAll(storage))
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}

/** `at` is injectable so the eviction order is testable without faking the clock. */
export function saveEditToken(storage: Writable, kind: EditKind, id: string, token: string, at = Date.now()): void {
  if (!token) return;
  const entries = readAll(storage);
  entries[entryKey(kind, id)] = { t: token, at };

  const keys = Object.keys(entries);
  if (keys.length > MAX_STORED_TOKENS) {
    const oldestFirst = keys.sort((a, b) => entries[a].at - entries[b].at);
    for (const key of oldestFirst.slice(0, keys.length - MAX_STORED_TOKENS)) delete entries[key];
  }

  writeAll(storage, entries);
}

export function forgetEditToken(storage: Writable, kind: EditKind, id: string): void {
  const entries = readAll(storage);
  if (!(entryKey(kind, id) in entries)) return;
  delete entries[entryKey(kind, id)];
  writeAll(storage, entries);
}

export function clearEditTokens(storage: Removable): void {
  try {
    storage.removeItem(EDIT_TOKENS_KEY);
  } catch {
    /* ignore */
  }
}

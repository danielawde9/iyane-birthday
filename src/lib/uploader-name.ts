export const UPLOADER_NAME_KEY = "iyane_uploader_name";

type Readable = Pick<Storage, "getItem">;
type Writable = Pick<Storage, "setItem" | "removeItem">;
type Removable = Pick<Storage, "removeItem">;

/** Trimmed saved name, or "" when absent/blank. Never throws (private mode/SSR safe). */
export function loadUploaderName(storage: Readable): string {
  try {
    return (storage.getItem(UPLOADER_NAME_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

/** Persist a trimmed name; a blank name clears the key instead. */
export function saveUploaderName(storage: Writable, name: string): void {
  const trimmed = name.trim();
  try {
    if (trimmed) storage.setItem(UPLOADER_NAME_KEY, trimmed);
    else storage.removeItem(UPLOADER_NAME_KEY);
  } catch {
    /* ignore disabled/full storage */
  }
}

export function clearUploaderName(storage: Removable): void {
  try {
    storage.removeItem(UPLOADER_NAME_KEY);
  } catch {
    /* ignore */
  }
}

# Upload: Stage-Then-Send Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make photo upload "stage then send" — photos compress + preview locally and only upload on an explicit Send tap — with a device-remembered uploader name and a mobile-correct layout.

**Architecture:** Extract the two genuinely pure pieces (a bounded-concurrency map and a `localStorage` name store) into `src/lib/` and unit-test them with Vitest, matching the existing `src/lib/files.ts` / `src/lib/ratelimit.ts` pattern. Then rewrite the `Uploader` client component to stage files, send them through the concurrency helper, remember the name, and reorder for mobile. The API route, DB schema, and compression settings are untouched.

**Tech Stack:** Next.js 16 (App Router) + React 19, TypeScript, Vitest (node environment), Tailwind CSS v4, `browser-image-compression` + `heic2any` (already wired).

---

## Pre-flight notes (read before starting)

- **Test environment reality:** `vitest.config.ts` runs in `environment: "node"` with `include: ["src/**/*.test.ts"]`. There is **no** jsdom / React Testing Library in the project. So the React component (`Uploader.tsx`) is **not** unit-tested here — that would mean adding a whole test harness, which is out of scope. Tasks 1–2 are real TDD on pure logic; Task 3 (the component) is verified by `npx tsc --noEmit`, `npm run lint`, and the manual run in Task 4. This is deliberate and matches how the repo already tests (`files.test.ts`, `ratelimit.test.ts` test pure functions, never components).
- **Git preference:** the repo owner manages their own commits. Commit steps are included for the normal TDD rhythm, but if you're handing back to the owner, you may batch or skip commits — confirm with them. Do not push.
- **Path alias:** `@/` maps to `src/` (see existing `import { cn } from "@/lib/cn"`).
- **Out of scope (explicitly deferred per spec):** changing the `/api/upload` 12/min rate limit, and friendlier HEIC-failure UX. Leave both as-is.

---

## Task 1: Bounded-concurrency map helper

Powers "send ~3 photos in parallel" without flooding the network. Pure async, fully unit-testable in the node environment.

**Files:**
- Create: `src/lib/concurrency.ts`
- Test: `src/lib/concurrency.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/concurrency.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mapWithConcurrency } from "./concurrency";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe("mapWithConcurrency", () => {
  it("returns results in input order", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n * 10);
    expect(out).toEqual([10, 20, 30, 40]);
  });

  it("returns an empty array for no items", async () => {
    expect(await mapWithConcurrency<number, number>([], 3, async (n) => n)).toEqual([]);
  });

  it("never runs more than `limit` workers at once", async () => {
    const started: number[] = [];
    const gates = Array.from({ length: 5 }, () => deferred<void>());
    const p = mapWithConcurrency([0, 1, 2, 3, 4], 2, async (i) => {
      started.push(i);
      await gates[i]!.promise;
      return i;
    });
    await flush();
    expect(started).toEqual([0, 1]); // only `limit` started

    gates[0]!.resolve();
    await flush();
    expect(started).toEqual([0, 1, 2]); // freeing one starts the next

    gates[1]!.resolve();
    gates[2]!.resolve();
    gates[3]!.resolve();
    gates[4]!.resolve();
    expect(await p).toEqual([0, 1, 2, 3, 4]);
  });

  it("caps workers at the item count when limit is larger", async () => {
    const out = await mapWithConcurrency([1, 2], 10, async (n) => n + 1);
    expect(out).toEqual([2, 3]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/concurrency.test.ts`
Expected: FAIL — `Failed to resolve import "./concurrency"` / `mapWithConcurrency is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/concurrency.ts`:

```ts
/**
 * Run `worker` over `items` with at most `limit` in flight at once.
 * Results come back in the original input order. Workers are expected to
 * handle their own errors (the uploader updates item status in place); a
 * worker that rejects will reject the whole batch.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  if (items.length === 0) return results;
  const size = Math.max(1, Math.min(limit, items.length));
  let next = 0;
  async function runner(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: size }, () => runner()));
  return results;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/concurrency.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/concurrency.ts src/lib/concurrency.test.ts
git commit -m "feat: add bounded-concurrency map helper"
```

---

## Task 2: Remembered-uploader-name store

Reads/writes the uploader name in `localStorage` so a returning guest doesn't retype it. The `Storage` dependency is injected so it tests in the node environment with a fake.

**Files:**
- Create: `src/lib/uploader-name.ts`
- Test: `src/lib/uploader-name.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/uploader-name.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/uploader-name.test.ts`
Expected: FAIL — `Failed to resolve import "./uploader-name"`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/uploader-name.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/uploader-name.test.ts`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add src/lib/uploader-name.ts src/lib/uploader-name.test.ts
git commit -m "feat: add remembered uploader-name store"
```

---

## Task 3: Rewrite the Uploader component (stage → send)

This is one focused rewrite of a ~300-line client component. It is delivered as the complete replacement file because the changes (Item type, staging, send-with-concurrency, name chip, remove ✕, mobile reorder, copy) are interleaved through the same render and splitting them into separate edit passes over one file invites mismatched intermediate states. No unit test (see Pre-flight notes); verified by typecheck + lint here and the manual run in Task 4.

**Files:**
- Modify (full replace): `src/components/upload/Uploader.tsx`

**What changes vs. the current file:**
1. `Item` gains `full`/`thumb`/`width`/`height` and a `"ready"` status.
2. `handleFiles` is split into `stageFiles` (compress + preview, status → `ready`; no upload) and `uploadItem` + `sendStaged` (POST on demand via `mapWithConcurrency`, limit 3).
3. New state: `remembered`, `sending`. Mount effect loads the saved name.
4. Name renders as an **"Adding as {name} ✕"** chip when `remembered`, else the editable input. `clearName` wipes it.
5. Each staged tile gets a **✕** (visible while `ready`/`error`) that removes it and revokes its object URL.
6. Layout reordered so on mobile the signing panel (name/note/Send) sits **above** the staged grid; desktop keeps the two-column look via explicit grid placement.
7. The "Fill these in first…" line is reworded; a **Send** button appears when there are staged photos.

- [ ] **Step 1: Replace the file contents**

Write `src/components/upload/Uploader.tsx` with exactly:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { CrestSmall } from "@/components/brand/Crest";
import { cn } from "@/lib/cn";
import { mapWithConcurrency } from "@/lib/concurrency";
import { loadUploaderName, saveUploaderName, clearUploaderName } from "@/lib/uploader-name";

type Stage = "locked" | "ready";

interface Item {
  id: string;
  name: string;
  preview: string;
  status: "processing" | "ready" | "uploading" | "done" | "error";
  error?: string;
  full?: File;
  thumb?: File;
  width?: number;
  height?: number;
}

async function imageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(blob);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dims;
  } catch {
    return { width: 1200, height: 900 };
  }
}

/** Convert HEIC → JPEG (if needed), then produce a compressed full image + thumbnail. */
async function prepareImage(file: File): Promise<{ full: File; thumb: File; width: number; height: number }> {
  let source: Blob = file;
  const isHeic = /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    source = Array.isArray(out) ? out[0]! : out;
  }
  const sourceFile = new File([source], "photo.jpg", { type: "image/jpeg" });

  const imageCompression = (await import("browser-image-compression")).default;
  const [full, thumb] = await Promise.all([
    imageCompression(sourceFile, { maxWidthOrHeight: 1600, maxSizeMB: 1.6, useWebWorker: true, fileType: "image/jpeg", initialQuality: 0.82 }),
    imageCompression(sourceFile, { maxWidthOrHeight: 520, maxSizeMB: 0.2, useWebWorker: true, fileType: "image/jpeg", initialQuality: 0.7 }),
  ]);
  const { width, height } = await imageDimensions(full);

  return {
    full: new File([full], "photo.jpg", { type: "image/jpeg" }),
    thumb: new File([thumb], "thumb.jpg", { type: "image/jpeg" }),
    width,
    height,
  };
}

export function Uploader({ requirePin }: { requirePin: boolean }) {
  const [stage, setStage] = useState<Stage>(requirePin ? "locked" : "ready");
  const [pin, setPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [caption, setCaption] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [drag, setDrag] = useState(false);
  const [sending, setSending] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = loadUploaderName(window.localStorage);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: remembered name is read from localStorage after mount
      setName(saved);
      setRemembered(true);
    }
  }, []);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/upload`, {
      margin: 1,
      width: 240,
      color: { dark: "#221B03", light: "#FFF8F0" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setLockError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't unlock uploads.");
      setStage("ready");
    } catch (err) {
      setLockError(err instanceof Error ? err.message : "Couldn't unlock uploads.");
    } finally {
      setUnlocking(false);
    }
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((it) => it.id !== id);
    });
  }

  function clearName() {
    clearUploaderName(window.localStorage);
    setName("");
    setRemembered(false);
  }

  /** Compress + preview each file on-device. Nothing uploads until Send. */
  async function stageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    for (const file of list) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setItems((prev) => [{ id, name: file.name, preview, status: "processing" }, ...prev]);
      try {
        const { full, thumb, width, height } = await prepareImage(file);
        updateItem(id, { status: "ready", full, thumb, width, height });
      } catch (err) {
        updateItem(id, { status: "error", error: err instanceof Error ? err.message : "Couldn't read this photo." });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadItem(it: Item) {
    if (!it.full || !it.thumb) return;
    updateItem(it.id, { status: "uploading" });
    const fd = new FormData();
    fd.append("image", it.full);
    fd.append("thumb", it.thumb);
    fd.append("width", String(it.width ?? 1200));
    fd.append("height", String(it.height ?? 800));
    if (name.trim()) fd.append("uploaderName", name.trim());
    if (caption.trim()) fd.append("caption", caption.trim());
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "locked") setStage("locked");
        throw new Error(data.error ?? "Upload failed.");
      }
      // Keep the object URL alive — the placed tile still renders it. It is
      // revoked on explicit removal (removeItem); leaving it matches the
      // original behavior and avoids blanking thumbnails under memory pressure.
      updateItem(it.id, { status: "done" });
      setDoneCount((c) => c + 1);
    } catch (err) {
      updateItem(it.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  async function sendStaged() {
    const ready = items.filter((it) => it.status === "ready");
    if (ready.length === 0 || sending) return;
    setSending(true);
    try {
      await mapWithConcurrency(ready, 3, (it) => uploadItem(it));
      if (name.trim()) {
        saveUploaderName(window.localStorage, name);
        setRemembered(true);
      }
    } finally {
      setSending(false);
    }
  }

  if (stage === "locked") {
    return (
      <form onSubmit={unlock} className="deco-card mx-auto max-w-md p-9 text-center">
        <CrestSmall className="mx-auto h-10 w-16" />
        <p className="eyebrow mt-4">By invitation</p>
        <h2 className="h-title mt-2 text-3xl text-ink">Enter the party code</h2>
        <p className="mt-3 font-display text-ink-soft">Ask the host for the code to begin adding photographs.</p>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="••••"
          className="mt-7 w-full border-0 border-b border-ink bg-transparent pb-2 text-center text-2xl tracking-[0.5em] text-ink outline-none transition focus:border-accent"
        />
        {lockError && <p className="mt-3 text-sm text-red-800">{lockError}</p>}
        <Button type="submit" variant="navy" disabled={unlocking || pin.length === 0} className="mt-7 w-full">
          {unlocking ? "Checking…" : "Unlock"}
        </Button>
      </form>
    );
  }

  const readyCount = items.filter((it) => it.status === "ready").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* Drop zone — always first */}
      <div className="lg:col-start-1 lg:row-start-1">
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void stageFiles(e.dataTransfer.files);
          }}
          className={cn("cursor-pointer transition-colors", drag ? "bg-paper-deep" : "bg-surface hover:bg-paper-deep")}
        >
          <div className="iy-drop-frame">
            <div className="flex flex-col items-center gap-3 text-center">
              <CrestSmall className="h-9 w-14" />
              <p className="h-title text-2xl text-ink sm:text-3xl">Drop your photographs here</p>
              <p className="eyebrow eyebrow-mute">or tap to choose</p>
              <p className="font-display text-sm italic text-ink-soft">
                JPEG · PNG · HEIC — optimised on your device before they&apos;re placed.
              </p>
            </div>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => stageFiles(e.target.files)}
        />
      </div>

      {/* Signature + Send + phone QR — above the grid on mobile, right rail on desktop */}
      <aside className="flex flex-col gap-6 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24">
        <div className="deco-card p-7">
          <p className="eyebrow">Sign your photographs</p>
          {remembered ? (
            <div className="mt-5">
              <p className="field-label">Adding as</p>
              <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1 font-display text-ink">
                {name}
                <button
                  type="button"
                  onClick={clearName}
                  aria-label="Clear saved name"
                  className="leading-none text-ink-soft transition hover:text-primary"
                >
                  ✕
                </button>
              </span>
            </div>
          ) : (
            <>
              <label className="field-label mt-5" htmlFor="up-name">
                Your name{" "}
                <span className="font-display normal-case italic tracking-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="up-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="field-input"
                placeholder="So we know who to thank"
              />
            </>
          )}
          <label className="field-label mt-7" htmlFor="up-caption">
            A note{" "}
            <span className="font-display normal-case italic tracking-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="up-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={140}
            className="field-input"
            placeholder="Applied to the photos you add"
          />
          <p className="mt-6 font-display text-sm italic text-ink-soft">
            Your name signs every photo in this batch — add it before you send.
          </p>
          {readyCount > 0 && (
            <Button variant="navy" onClick={sendStaged} disabled={sending} className="mt-6 w-full">
              {sending ? "Sending…" : `Send ${readyCount} photograph${readyCount === 1 ? "" : "s"}`}
            </Button>
          )}
        </div>

        <div className="deco-card flex items-center gap-4 p-5">
          {qr && (
            <span className="block shrink-0 bg-bg p-2 ring-1 ring-accent">
              <img src={qr} alt="Scan to open this page on your phone" className="block h-[84px] w-[84px]" />
            </span>
          )}
          <p className="font-display text-sm italic text-ink-soft">
            On your phone? Scan to open this page and add photos straight from your camera roll.
          </p>
        </div>
      </aside>

      {/* Staged grid + confirmation */}
      <div className="lg:col-start-1 lg:row-start-2">
        {doneCount > 0 && (
          <p className="text-center font-display text-lg italic text-ink-soft">
            {doneCount} photograph{doneCount === 1 ? "" : "s"} placed — thank you.{" "}
            <Link href="/gallery" className="text-gold-deep underline-offset-4 hover:underline">
              See the wall →
            </Link>
          </p>
        )}

        {items.length > 0 && (
          <div className={cn(doneCount > 0 && "mt-7")}>
            <p className="eyebrow mb-3">Just added</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((it) => (
                <figure key={it.id} className="iy-tile">
                  <div className="iy-shot aspect-square">
                    <img
                      src={it.preview}
                      alt={it.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ filter: "saturate(0.92) contrast(1.02)" }}
                    />
                    {(it.status === "processing" || it.status === "uploading") && (
                      <div className="absolute inset-0 flex items-center justify-center bg-projector-deep/55">
                        <span className="iy-spin" />
                      </div>
                    )}
                    {(it.status === "ready" || it.status === "error") && (
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        aria-label="Remove this photo"
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-projector-deep/70 text-bg transition hover:bg-primary"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <figcaption className="iy-cap">
                    <p
                      className={cn(
                        "iy-cap-name",
                        it.status === "ready" && "!text-ink-soft",
                        it.status === "done" && "!text-gold-deep",
                        it.status === "error" && "!text-primary",
                      )}
                    >
                      {it.status === "processing" && "Optimising…"}
                      {it.status === "ready" && "Ready to send"}
                      {it.status === "uploading" && "Placing…"}
                      {it.status === "done" && "★ Placed"}
                      {it.status === "error" && (it.error ?? "Failed")}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `tsc` isn't found, use `npx --yes typescript@5 tsc --noEmit` or `npm run build`.)

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: **0 errors**, and no warnings attributed to `src/components/upload/Uploader.tsx`. Notes: (1) `@next/next/no-img-element` is globally `"off"` in `eslint.config.mjs`, so the `<img>` tags need **no** `eslint-disable` comments — adding them produces "unused directive" warnings. (2) The mount effect's `setName`/`setRemembered` would otherwise trip `react-hooks/set-state-in-effect`; the single inline `eslint-disable-next-line` above `setName` (matching the house pattern in `PhotoStage.tsx`/`useRotation.ts`) is the SSR-safe fix — do **not** convert to a `useState` initializer (that reads `localStorage` during SSR and causes a hydration mismatch). The repo also has ~7 pre-existing unused-`no-img-element`-directive warnings in other files; leave them.

- [ ] **Step 4: Run the full unit suite (nothing else regressed)**

Run: `npx vitest run`
Expected: all tests pass, including Tasks 1–2.

- [ ] **Step 5: Commit**

```bash
git add src/components/upload/Uploader.tsx
git commit -m "feat: stage-then-send uploader with remembered name and mobile order"
```

---

## Task 4: Manual end-to-end verification

No automated browser harness exists, so verify the real flow once in the dev server. (Uploads work in demo mode with the DB unset — files are returned as base64 data URIs — so a full Supabase setup is not required to exercise the UI.)

- [ ] **Step 1: Start the app**

Run: `npm run dev` and open `http://localhost:3000/upload` (if PIN gating is on, unlock first).

- [ ] **Step 2: Walk the checklist** (each must hold)

- [ ] Drop/select several photos → they appear as **"Optimising…"** then **"Ready to send"**. The network tab shows **no** `POST /api/upload` yet.
- [ ] Hover/tap a staged tile's **✕** → the photo is removed; no upload fired.
- [ ] A **"Send N photographs"** button shows the correct count; tapping it uploads (tiles go **"Placing…" → "★ Placed"**), and the "{n} placed — See the wall →" line appears.
- [ ] Reload the page → your name is pre-filled and shown as the **"Adding as {name} ✕"** chip (not an empty input).
- [ ] Tap the chip **✕** → the editable name input returns and the chip is gone. Reload again → name stays cleared.
- [ ] Resize to a narrow/mobile viewport → the name/note/**Send** panel renders **above** the "Just added" grid (matches the "add it before you send" copy).
- [ ] Send a batch of more than 12 photos → confirm the overflow returns `429` (known, accepted limitation — note it, don't fix).

- [ ] **Step 3: Stop the dev server.** Implementation complete.

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-06-01-upload-stage-then-send-design.md`):
- Stage-then-send → Task 3 (`stageFiles` / `sendStaged`). ✅
- Send is an explicit tap → Task 3 Send `Button`. ✅
- ~3 parallel uploads → Task 1 helper used in `sendStaged`. ✅
- Remembered name + "Adding as X ✕" chip + clear → Task 2 store + Task 3 chip/`clearName`. ✅
- Mobile order (sign above grid) + reworded copy → Task 3 grid placement + new helper line. ✅
- Remove a staged photo (✕ + URL revoke) → Task 3 `removeItem`. ✅
- Quality unchanged, no DB/API change → `prepareImage` and FormData fields untouched; no migration. ✅
- Known limitations (rate limit, HEIC) left alone → Pre-flight + Task 4 note. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✅

**Type consistency:** `Item` (with `full`/`thumb`/`width`/`height`/`"ready"`) is defined once and used by `stageFiles`/`uploadItem`/`sendStaged`/render. `mapWithConcurrency(items, limit, worker)` signature matches Task 1. `loadUploaderName`/`saveUploaderName`/`clearUploaderName` signatures match Task 2. ✅

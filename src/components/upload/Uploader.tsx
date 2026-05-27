"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { CrestSmall } from "@/components/brand/Crest";
import { cn } from "@/lib/cn";

type Stage = "locked" | "ready";

interface Item {
  id: string;
  name: string;
  preview: string;
  status: "processing" | "uploading" | "done" | "error";
  error?: string;
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
  const [caption, setCaption] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [drag, setDrag] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/upload`, {
      margin: 1,
      width: 240,
      color: { dark: "#0E2240", light: "#F6EFE2" },
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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);

    for (const file of list) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setItems((prev) => [{ id, name: file.name, preview, status: "processing" }, ...prev]);

      try {
        const { full, thumb, width, height } = await prepareImage(file);
        updateItem(id, { status: "uploading" });

        const fd = new FormData();
        fd.append("image", full);
        fd.append("thumb", thumb);
        fd.append("width", String(width));
        fd.append("height", String(height));
        if (name.trim()) fd.append("uploaderName", name.trim());
        if (caption.trim()) fd.append("caption", caption.trim());

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.code === "locked") setStage("locked");
          throw new Error(data.error ?? "Upload failed.");
        }
        updateItem(id, { status: "done" });
        setDoneCount((c) => c + 1);
      } catch (err) {
        updateItem(id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
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

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* Left — drop zone + staged grid */}
      <div className="flex flex-col gap-7">
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
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn("cursor-pointer transition-colors", drag ? "bg-paper-deep" : "bg-surface hover:bg-paper-deep")}
        >
          <div className="iy-drop-frame">
            <div className="flex flex-col items-center gap-3 text-center">
              <CrestSmall className="h-9 w-14" />
              <p className="h-title text-2xl text-ink sm:text-3xl">Drop your photographs here</p>
              <p className="eyebrow eyebrow-mute">or tap to choose</p>
              <p className="font-display text-sm italic text-muted">
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
          onChange={(e) => handleFiles(e.target.files)}
        />

        {doneCount > 0 && (
          <p className="text-center font-display text-lg italic text-ink-soft">
            {doneCount} photograph{doneCount === 1 ? "" : "s"} placed — thank you.{" "}
            <Link href="/gallery" className="text-gold-deep underline-offset-4 hover:underline">
              See the wall →
            </Link>
          </p>
        )}

        {items.length > 0 && (
          <div>
            <p className="eyebrow mb-3">Just added</p>
            <div className="grid grid-cols-3 gap-px bg-[color:var(--c-gold-rule-faint)] p-px sm:grid-cols-4">
              {items.map((it) => (
                <div key={it.id} className="relative aspect-square overflow-hidden bg-paper-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} alt={it.name} className="h-full w-full object-cover" style={{ filter: "saturate(0.92) contrast(1.02)" }} />
                  {it.status !== "done" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/55 px-2 text-center font-sc text-[10px] uppercase tracking-[0.18em] text-on-dark">
                      {it.status === "processing" && "Optimising…"}
                      {it.status === "uploading" && "Placing…"}
                      {it.status === "error" && (it.error ?? "Failed")}
                    </div>
                  )}
                  {it.status === "done" && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-accent bg-primary/70 text-[11px] text-accent">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right — signature + phone QR */}
      <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
        <div className="deco-card p-6">
          <p className="eyebrow">Sign your photographs</p>
          <label className="field-label mt-5" htmlFor="up-name">
            Your name{" "}
            <span className="font-display normal-case italic tracking-normal text-muted">(optional)</span>
          </label>
          <input
            id="up-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="field-input"
            placeholder="So we know who to thank"
          />
          <label className="field-label mt-7" htmlFor="up-caption">
            A note{" "}
            <span className="font-display normal-case italic tracking-normal text-muted">(optional)</span>
          </label>
          <input
            id="up-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={140}
            className="field-input"
            placeholder="Applied to the photos you add"
          />
          <p className="mt-6 font-display text-sm italic text-muted">
            Fill these in first — they&apos;re signed onto the photographs you add next.
          </p>
        </div>

        <div className="flex items-center gap-4 border border-[color:var(--c-gold-rule-faint)] p-4">
          {qr && (
            <span className="block shrink-0 bg-bg p-2 ring-1 ring-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Scan to open this page on your phone" className="block h-[84px] w-[84px]" />
            </span>
          )}
          <p className="font-display text-sm italic text-ink-soft">
            On your phone? Scan to open this page and add photos straight from your camera roll.
          </p>
        </div>
      </aside>
    </div>
  );
}

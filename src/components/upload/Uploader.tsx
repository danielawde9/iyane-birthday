"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { CrestSmall } from "@/components/brand/Crest";
import { cn } from "@/lib/cn";
import { mapWithConcurrency } from "@/lib/concurrency";
import { loadUploaderName, saveUploaderName, clearUploaderName } from "@/lib/uploader-name";
import { saveEditToken } from "@/lib/edit-tokens";
import { qrOptions } from "@/lib/qr";

interface Item {
  id: string;
  name: string;
  file: File;
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

export function Uploader() {
  const [name, setName] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [caption, setCaption] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadedCount = items.filter((it) => it.status === "done").length;
  const allUploaded = items.length > 0 && uploadedCount === items.length;
  // Latest name/caption, read inside async uploads so a name typed mid-batch still applies.
  const sigRef = useRef({ name: "", caption: "" });
  useEffect(() => {
    sigRef.current = { name, caption };
  }, [name, caption]);

  useEffect(() => {
    const saved = loadUploaderName(window.localStorage);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: remembered name is read from localStorage after mount
      setName(saved);
      setRemembered(true);
    }
  }, []);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/upload`, qrOptions(240))
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

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

  function resetUploaderUi() {
    for (const it of items) URL.revokeObjectURL(it.preview);
    setItems([]);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Compress + upload one staged item immediately. */
  async function processAndUpload(it: Item) {
    try {
      const { full, thumb, width, height } = await prepareImage(it.file);
      updateItem(it.id, { status: "uploading" });

      const { name: signName, caption: signCaption } = sigRef.current;
      const fd = new FormData();
      fd.append("image", full);
      fd.append("thumb", thumb);
      fd.append("width", String(width));
      fd.append("height", String(height));
      if (signName.trim()) fd.append("uploaderName", signName.trim());
      if (signCaption.trim()) fd.append("caption", signCaption.trim());

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed.");
      }
      // The server returns this photo's capability token exactly once. Without
      // keeping it, the guest can never edit or remove what they just uploaded.
      if (typeof data.editToken === "string" && typeof data.photo?.id === "string") {
        saveEditToken(window.localStorage, "photo", data.photo.id, data.editToken);
      }
      updateItem(it.id, { status: "done" });
      if (signName.trim()) {
        saveUploaderName(window.localStorage, signName);
        setRemembered(true);
      }
    } catch (err) {
      updateItem(it.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  /** Picking photos uploads them straight away — no separate send step. */
  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    // Copy out of the live FileList BEFORE resetting the input (resetting empties it).
    const fresh: Item[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      preview: URL.createObjectURL(file),
      status: "processing",
    }));
    if (fileRef.current) fileRef.current.value = "";
    setItems((prev) => [...fresh, ...prev]);
    await mapWithConcurrency(fresh, 3, (it) => processAndUpload(it));
  }

  if (allUploaded) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="deco-card p-7 text-center sm:p-10">
          <p className="eyebrow">Thank you</p>
          <h2 className="h-title mt-3 text-3xl text-ink sm:text-4xl">All images are uploaded, thank you</h2>
          <p className="mx-auto mt-4 max-w-md font-display text-base italic text-ink-soft sm:text-lg">
            {uploadedCount} photograph{uploadedCount === 1 ? "" : "s"} joined Iyane&apos;s keepsake.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/gallery" className="btn-ticket">
              See Gallery
            </Link>
            <Link href="/" className="btn-ticket btn-ticket-blue">
              Go Home
            </Link>
            <button type="button" onClick={resetUploaderUi} className="btn-ticket !bg-bg !text-ink">
              Add More Photos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* 1 — Who's sharing (name first; remembered for next time) */}
      <div className="deco-card p-6">
        {remembered ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow eyebrow-mute">Adding as</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1 font-display text-lg text-ink">
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
            <label className="field-label" htmlFor="up-name">
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
        <label className="field-label mt-5" htmlFor="up-caption">
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
      </div>

      {/* 2 — Add photos (uploads immediately on pick) */}
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
          void uploadFiles(e.dataTransfer.files);
        }}
        className={cn("cursor-pointer transition-colors", drag ? "bg-paper-deep" : "bg-surface hover:bg-paper-deep")}
      >
        <div className="iy-drop-frame">
          <div className="flex flex-col items-center gap-3 text-center">
            <CrestSmall className="h-9 w-14" />
            <p className="h-title text-2xl text-ink sm:text-3xl">Add your photographs</p>
            <p className="eyebrow eyebrow-mute">tap to choose — or drop them here</p>
            <p className="font-display text-sm italic text-ink-soft">
              They&apos;re optimised on your device and added the moment you choose them.
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
        onChange={(e) => uploadFiles(e.target.files)}
      />

      {/* 3 — Live progress + the wall link */}
      {uploadedCount > 0 && (
        <p className="text-center font-display text-lg italic text-ink-soft">
          {uploadedCount} photograph{uploadedCount === 1 ? "" : "s"} added — thank you.{" "}
          <Link href="/gallery" className="text-gold-deep underline-offset-4 hover:underline">
            See the wall →
          </Link>
        </p>
      )}

      {items.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Your photographs</p>
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
                  {it.status === "error" && (
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      aria-label="Dismiss this photo"
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
                      it.status === "done" && "!text-gold-deep",
                      it.status === "error" && "!text-primary",
                    )}
                  >
                    {it.status === "processing" && "Optimising…"}
                    {it.status === "uploading" && "Adding…"}
                    {it.status === "done" && "◆ Added"}
                    {it.status === "error" && (it.error ?? "Failed — tap ✕")}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* On a computer? Hand the phone over. */}
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
    </div>
  );
}

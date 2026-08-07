"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThisDeviceNote } from "@/components/guest/ThisDeviceNote";
import type { PhotoDTO } from "@/lib/photo";

type Send = (id: string, init: { method: "PATCH" | "DELETE"; body?: unknown }) => Promise<Response>;

/**
 * Edit / Remove for a photo this browser holds the token for. Only the caption
 * and the name shown under it can change — the picture itself is what it is.
 */
export function OwnPhotoControls({
  photo,
  send,
  onEdited,
  onRemoved,
}: {
  photo: PhotoDTO;
  send: Send;
  onEdited: (photo: PhotoDTO) => void;
  onRemoved: (id: string) => void;
}) {
  const [mode, setMode] = useState<"idle" | "editing" | "confirming">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [uploaderName, setUploaderName] = useState(photo.uploaderName ?? "");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await send(photo.id, { method: "PATCH", body: { caption, uploaderName } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that change.");
      onEdited(data.photo as PhotoDTO);
      setMode("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that change.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await send(photo.id, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't remove that.");
      onRemoved(photo.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that.");
      setBusy(false);
    }
  }

  if (mode === "editing") {
    return (
      <form onSubmit={save} className="px-4 pb-4">
        <label className="field-label" htmlFor={`photo-name-${photo.id}`}>
          Your name
        </label>
        <input
          id={`photo-name-${photo.id}`}
          className="field-input"
          value={uploaderName}
          maxLength={60}
          placeholder="Leave blank to stay anonymous"
          onChange={(e) => setUploaderName(e.target.value)}
        />
        <label className="field-label mt-3" htmlFor={`photo-caption-${photo.id}`}>
          Caption
        </label>
        <input
          id={`photo-caption-${photo.id}`}
          className="field-input"
          value={caption}
          maxLength={140}
          placeholder="A few words about this one"
          onChange={(e) => setCaption(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="submit" variant="navy" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setCaption(photo.caption ?? "");
              setUploaderName(photo.uploaderName ?? "");
              setError(null);
              setMode("idle");
            }}
          >
            Cancel
          </Button>
        </div>
        <ThisDeviceNote className="mt-3" />
      </form>
    );
  }

  if (mode === "confirming") {
    return (
      <div className="px-4 pb-4">
        <p className="font-body text-sm text-ink">Take this photo off the wall?</p>
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="navy" disabled={busy} onClick={remove}>
            {busy ? "Removing…" : "Yes, remove it"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => setMode("idle")}>
            Keep it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 pb-3">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft">Yours</span>
      <button
        type="button"
        onClick={() => setMode("editing")}
        className="font-body text-sm text-ink underline underline-offset-4 transition hover:text-primary"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setMode("confirming")}
        className="font-body text-sm text-ink-soft underline underline-offset-4 transition hover:text-primary"
      >
        Remove
      </button>
      {error && <p className="text-sm text-red-800">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThisDeviceNote } from "@/components/guest/ThisDeviceNote";
import type { Entry } from "./GuestbookWall";

type Send = (id: string, init: { method: "PATCH" | "DELETE"; body?: unknown }) => Promise<Response>;

/**
 * Edit / Remove for a wish this browser holds the token for. Inline rather than
 * a dialog: the card is already the right size, and it keeps focus where the
 * guest is looking.
 */
export function WishControls({
  entry,
  send,
  onEdited,
  onRemoved,
}: {
  entry: Entry;
  send: Send;
  onEdited: (entry: Entry) => void;
  onRemoved: (id: string) => void;
}) {
  const [mode, setMode] = useState<"idle" | "editing" | "confirming">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(entry.name);
  const [message, setMessage] = useState(entry.message);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await send(entry.id, { method: "PATCH", body: { name, message } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that change.");
      onEdited(data.entry as Entry);
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
      const res = await send(entry.id, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't remove that.");
      onRemoved(entry.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that.");
      setBusy(false);
    }
  }

  if (mode === "editing") {
    return (
      <form onSubmit={save} className="mt-4 border-t border-ink/10 pt-4">
        <label className="field-label" htmlFor={`wish-name-${entry.id}`}>
          Your name
        </label>
        <input
          id={`wish-name-${entry.id}`}
          className="field-input"
          value={name}
          maxLength={80}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <label className="field-label mt-4" htmlFor={`wish-message-${entry.id}`}>
          Your message
        </label>
        <textarea
          id={`wish-message-${entry.id}`}
          className="field-textarea mt-1"
          rows={4}
          maxLength={400}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button type="submit" variant="navy" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setName(entry.name);
              setMessage(entry.message);
              setError(null);
              setMode("idle");
            }}
          >
            Cancel
          </Button>
        </div>
        <ThisDeviceNote className="mt-4" />
      </form>
    );
  }

  if (mode === "confirming") {
    return (
      <div className="mt-4 border-t border-ink/10 pt-4">
        <p className="font-body text-sm text-ink">Take this wish down?</p>
        {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
        <div className="mt-3 flex gap-2">
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
    <div className="mt-4 border-t border-ink/10 pt-3">
      <div className="flex items-center gap-4">
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
      </div>
      {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}

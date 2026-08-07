"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StarRule } from "@/components/ui/StarRule";
import { clearUploaderName, loadUploaderName, saveUploaderName } from "@/lib/uploader-name";
import { saveEditToken } from "@/lib/edit-tokens";
import { useOwnedRows } from "@/components/guest/useOwnedRows";
import { WishControls } from "./WishControls";

export interface Entry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export function GuestbookWall({ initial }: { initial: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initial);
  const owned = useOwnedRows("guestbook");
  const [name, setName] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadUploaderName(window.localStorage);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: remembered name is read from localStorage after mount
      setName(saved);
      setRemembered(true);
    }
  }, []);

  function clearName() {
    clearUploaderName(window.localStorage);
    setName("");
    setRemembered(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setStatus("submitting");
    setError(null);
    const form = new FormData(formEl);
    const submittedName = String(form.get("name") ?? "").trim();
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), message: form.get("message") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't post your message.");
      const entry = data.entry as Entry;
      setEntries((prev) => [entry, ...prev]);
      // The capability token comes back exactly once. Keep it, or this guest
      // loses the ability to edit the wish they just wrote.
      if (typeof data.editToken === "string") {
        saveEditToken(window.localStorage, "guestbook", entry.id, data.editToken);
        owned.remember(entry.id);
      }
      if (submittedName) {
        saveUploaderName(window.localStorage, submittedName);
        setName(submittedName);
        setRemembered(true);
      }
      const messageEl = formEl.elements.namedItem("message");
      if (messageEl instanceof HTMLTextAreaElement) messageEl.value = "";
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post your message.");
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form onSubmit={onSubmit} className="deco-card h-fit p-7 lg:sticky lg:top-24">
        <p className="eyebrow">A line for the keepsake</p>
        <h2 className="h-title mt-2 text-3xl text-ink">Leave a few words</h2>
        {remembered ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="eyebrow eyebrow-mute">Signing as</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1 font-display text-lg text-ink">
              {name}
              <button
                type="button"
                onClick={clearName}
                aria-label="Clear saved name"
                className="leading-none text-ink-soft transition hover:text-primary"
              >
                x
              </button>
            </span>
            <input type="hidden" name="name" value={name} />
          </div>
        ) : (
          <>
            <label className="field-label mt-6" htmlFor="gb-name">Your name</label>
            <input
              id="gb-name"
              name="name"
              required
              maxLength={80}
              className="field-input"
              placeholder="e.g. Jiddo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </>
        )}
        <label className="field-label mt-7" htmlFor="gb-message">Your message</label>
        <textarea
          id="gb-message"
          name="message"
          required
          rows={4}
          maxLength={400}
          className="field-textarea mt-1"
          placeholder="A few words for Iyane to find one day…"
        />
        {error && <p className="mt-3 text-sm text-red-800">{error}</p>}
        <Button type="submit" variant="navy" disabled={status === "submitting"} className="mt-6 w-full">
          {status === "submitting" ? "Signing…" : "Sign the guestbook"}
        </Button>
      </form>

      <div>
        {entries.length === 0 ? (
          <p className="deco-card p-12 text-center font-display text-lg italic text-ink-soft">
            The page is blank — be the first to leave a line.
          </p>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 [&>article]:mb-5">
            {entries.map((entry, i) => (
              <article key={entry.id} className="ticket-stub break-inside-avoid">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    ✎ A Wish
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                    No. {entries.length - i}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap font-body text-[1.05rem] italic leading-relaxed text-ink">
                  {entry.message}
                </p>
                <StarRule className="my-4" />
                <p className="script text-right text-3xl text-gold-deep">{entry.name}</p>
                {owned.owns(entry.id) && (
                  <WishControls
                    entry={entry}
                    send={owned.send}
                    onEdited={(updated) =>
                      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
                    }
                    onRemoved={(id) => {
                      owned.forget(id);
                      setEntries((prev) => prev.filter((e) => e.id !== id));
                    }}
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

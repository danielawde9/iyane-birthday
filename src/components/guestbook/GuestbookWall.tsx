"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface Entry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export function GuestbookWall({ initial }: { initial: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initial);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setStatus("submitting");
    setError(null);
    const form = new FormData(formEl);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), message: form.get("message") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't post your message.");
      setEntries((prev) => [data.entry as Entry, ...prev]);
      formEl.reset();
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
        <label className="field-label mt-6" htmlFor="gb-name">Your name</label>
        <input id="gb-name" name="name" required maxLength={80} className="field-input" placeholder="e.g. Jiddo" />
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
          <p className="border border-dashed border-[color:var(--c-gold-rule)] bg-surface p-12 text-center font-display text-lg italic text-muted">
            The page is blank — be the first to leave a line.
          </p>
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
            {entries.map((entry) => (
              <article key={entry.id} className="deco-card break-inside-avoid p-6">
                <p className="whitespace-pre-wrap font-display text-[1.05rem] italic leading-relaxed text-ink">
                  {entry.message}
                </p>
                <hr className="rule-gold my-4" />
                <p className="script text-3xl text-accent">{entry.name}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

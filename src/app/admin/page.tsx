import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser, isAdminBypass } from "@/lib/auth";
import { getActiveEvent, listEvents, listAllPhotos, listContributors, listGuestbook } from "@/db/queries";
import { listThemes } from "@/themes";
import { toPublicUrl } from "@/lib/storage";
import {
  deletePhotoAction,
  setPhotoStatusAction,
  setFeaturedAction,
  setGuestbookStatusAction,
  updateActiveEventAction,
  createNextYearAction,
  setActiveEventAction,
  signOutAction,
} from "./actions";

export const dynamic = "force-dynamic";

const input = "w-full rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-accent";
const card = "rounded-2xl border border-primary/10 bg-surface p-6 shadow-sm";
const h2 = "font-display text-2xl text-primary";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  const event = await getActiveEvent();
  const events = await listEvents();
  const photos = event ? await listAllPhotos(event.id) : [];
  const contributors = event ? await listContributors(event.id) : [];
  const wishes = event ? await listGuestbook(event.id, true) : [];
  const themes = listThemes();

  const visiblePhotos = photos.filter((p) => p.status === "visible").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">Admin</h1>
          <p className="text-sm text-on-surface/60">Signed in as {admin.email}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-gold-deep underline-offset-4 hover:underline">View site →</Link>
          <form action={signOutAction}>
            <button className="rounded-full border border-primary/20 px-4 py-2 hover:bg-primary/5">Sign out</button>
          </form>
        </div>
      </header>

      {isAdminBypass && (
        <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Local preview mode — admin auth is bypassed because Supabase isn&apos;t configured. In production, access requires a
          Supabase login whose email is in <code>ADMIN_EMAILS</code>.
        </p>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <Stat label="Photos" value={`${visiblePhotos}/${photos.length}`} hint="visible / total" />
        <Stat label="Contributors" value={String(contributors.length)} hint="guests who shared" />
        <Stat label="Wishes" value={String(wishes.length)} />
      </div>

      {/* Event & theme */}
      <section className={`${card} mb-6`}>
        <h2 className={h2}>Active celebration</h2>
        {event ? (
          <form action={updateActiveEventAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Title"><input name="title" defaultValue={event.title} className={input} /></Field>
            <Field label="Date & time"><input type="datetime-local" name="eventDate" defaultValue={toLocalInput(event.eventDate)} className={input} /></Field>
            <Field label="Venue"><input name="venue" defaultValue={event.venue ?? ""} className={input} /></Field>
            <Field label="Address"><input name="address" defaultValue={event.address ?? ""} className={input} /></Field>
            <Field label="Map URL"><input name="mapUrl" defaultValue={event.mapUrl ?? ""} className={input} /></Field>
            <Field label="Dress code"><input name="dressCode" defaultValue={event.dressCode ?? ""} className={input} /></Field>
            <Field label="Hero line" full><input name="heroCopy" defaultValue={event.heroCopy ?? ""} className={input} /></Field>
            <div className="sm:col-span-2">
              <button className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-on-dark hover:bg-primary-deep">
                Save details
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 text-on-surface/70">No active event.</p>
        )}

        <div className="mt-6 border-t border-primary/10 pt-5">
          <h3 className="text-sm font-medium uppercase tracking-wider text-on-surface/70">Years</h3>
          <ul className="mt-3 space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <strong>Year {e.year}</strong> · {e.title} {e.isActive && <span className="text-gold-deep">(active)</span>}
                </span>
                {!e.isActive && (
                  <form action={setActiveEventAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="rounded-full border border-primary/20 px-3 py-1 text-xs hover:bg-primary/5">Make active</button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          <form action={createNextYearAction} className="mt-4 grid items-end gap-3 sm:grid-cols-4">
            <Field label="New year #"><input type="number" name="year" min={1} max={99} defaultValue={(event?.year ?? 1) + 1} className={input} /></Field>
            <Field label="Title"><input name="title" placeholder="Iyane turns 2" className={input} /></Field>
            <Field label="Theme">
              <select name="themeSlug" className={input} defaultValue="big-top">
                {themes.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="makeActive" /> Make active
            </label>
            <div className="sm:col-span-4">
              <button className="rounded-full border border-primary/20 px-5 py-2 text-sm hover:bg-primary/5">Add year</button>
            </div>
          </form>
        </div>
      </section>

      {/* Photos */}
      <section className={`${card} mb-6`}>
        <h2 className={h2}>Photos ({photos.length})</h2>
        {photos.length === 0 ? (
          <p className="mt-3 text-on-surface/60">No photos yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="relative overflow-hidden rounded-xl border border-primary/10 bg-white">
                {p.featured && (
                  <span className="absolute left-1.5 top-1.5 z-10 rounded bg-primary/85 px-1.5 py-0.5 text-[9px] text-accent">★ Featured</span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={toPublicUrl(p.thumbKey)} alt={p.caption ?? "Photo"} className={`aspect-square w-full object-cover ${p.status === "hidden" ? "opacity-40" : ""}`} />
                <div className="space-y-2 p-2 text-xs">
                  <p className="truncate text-on-surface/70">{p.uploaderName ?? "Guest"}{p.caption ? ` · ${p.caption}` : ""}</p>
                  <form action={setFeaturedAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className={`w-full rounded-md border py-1 ${p.featured ? "border-accent bg-accent/15 text-primary" : "border-primary/20 hover:bg-primary/5"}`}>
                      {p.featured ? "★ Featured" : "☆ Feature"}
                    </button>
                  </form>
                  <div className="flex gap-2">
                    <form action={setPhotoStatusAction} className="flex-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={p.status === "visible" ? "hidden" : "visible"} />
                      <button className="w-full rounded-md border border-primary/20 py-1 hover:bg-primary/5">{p.status === "visible" ? "Hide" : "Show"}</button>
                    </form>
                    <form action={deletePhotoAction} className="flex-1">
                      <input type="hidden" name="id" value={p.id} />
                      <button className="w-full rounded-md border border-red-200 py-1 text-red-700 hover:bg-red-50">Delete</button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guestbook */}
      <section className={card}>
        <h2 className={h2}>Wishes ({wishes.length})</h2>
        {wishes.length === 0 ? (
          <p className="mt-3 text-on-surface/60">No wishes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {wishes.map((g) => (
              <li key={g.id} className={`flex items-start justify-between gap-4 rounded-xl border border-primary/10 p-3 text-sm ${g.status === "hidden" ? "opacity-50" : ""}`}>
                <div>
                  <p className="text-on-surface">{g.message}</p>
                  <p className="mt-1 font-script text-xl text-gold-deep">{g.name}</p>
                </div>
                <form action={setGuestbookStatusAction}>
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="status" value={g.status === "visible" ? "hidden" : "visible"} />
                  <button className="whitespace-nowrap rounded-md border border-primary/20 px-3 py-1 text-xs hover:bg-primary/5">{g.status === "visible" ? "Hide" : "Show"}</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-surface p-4 shadow-sm">
      <div className="font-display text-3xl text-gold-deep">{value}</div>
      <div className="text-xs uppercase tracking-wider text-on-surface/60">{label}</div>
      {hint && <div className="text-[11px] text-on-surface/45">{hint}</div>}
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs uppercase tracking-wider text-on-surface/60">{label}</span>
      {children}
    </label>
  );
}

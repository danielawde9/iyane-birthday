import { NextResponse } from "next/server";
import { getActiveEvent } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * Lightweight health check that touches the database. A daily Vercel Cron hits
 * this to keep a free-tier Supabase project from pausing (see vercel.json), and
 * a free external pinger (e.g. UptimeRobot) on this URL is the reliable backup.
 */
export async function GET() {
  try {
    const event = await getActiveEvent();
    return NextResponse.json({ ok: true, activeYear: event?.year ?? null });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

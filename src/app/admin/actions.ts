"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeFromStorage } from "@/lib/storage";
import { sanitizeText, clampInt } from "@/lib/sanitize";
import {
  getActiveEvent,
  updateEvent,
  createEvent,
  setActiveEvent,
  deletePhoto,
  setPhotoStatus,
  setFeatured,
  setGuestbookStatus,
} from "@/db/queries";

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");
}

function refreshPublic() {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/guestbook");
  revalidatePath("/archive");
  revalidatePath("/admin");
}

export async function deletePhotoAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const photo = await deletePhoto(id);
  if (photo) await removeFromStorage([photo.storageKey, photo.thumbKey]);
  refreshPublic();
}

export async function setPhotoStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "hidden" ? "hidden" : "visible";
  if (id) await setPhotoStatus(id, status);
  refreshPublic();
}

export async function setFeaturedAction(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEvent();
  const id = String(formData.get("id") ?? "");
  if (event && id) await setFeatured(event.id, id);
  refreshPublic();
}

export async function setGuestbookStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "hidden" ? "hidden" : "visible";
  if (id) await setGuestbookStatus(id, status);
  refreshPublic();
}

export async function updateActiveEventAction(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEvent();
  if (!event) return;

  const dateRaw = sanitizeText(formData.get("eventDate"), 40);
  const parsedDate = dateRaw ? new Date(dateRaw) : null;

  await updateEvent(event.id, {
    title: sanitizeText(formData.get("title"), 120) ?? event.title,
    venue: sanitizeText(formData.get("venue"), 160),
    address: sanitizeText(formData.get("address"), 240),
    mapUrl: sanitizeText(formData.get("mapUrl"), 500),
    dressCode: sanitizeText(formData.get("dressCode"), 120),
    heroCopy: sanitizeText(formData.get("heroCopy"), 240),
    eventDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
  });
  refreshPublic();
}

export async function createNextYearAction(formData: FormData) {
  await requireAdmin();
  const year = clampInt(formData.get("year"), 1, 99, 2);
  const title = sanitizeText(formData.get("title"), 120) ?? `Iyane turns ${year}`;
  const themeSlug = sanitizeText(formData.get("themeSlug"), 60) ?? "big-top";
  const makeActive = formData.get("makeActive") === "on";

  const created = await createEvent({ year, title, themeSlug, isActive: false });
  if (makeActive) await setActiveEvent(created.id);
  refreshPublic();
}

export async function setActiveEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await setActiveEvent(id);
  refreshPublic();
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

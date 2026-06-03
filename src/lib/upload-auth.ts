import { env } from "./env";

/**
 * Upload geo-gate: anyone may VIEW the site from anywhere, but photo uploads are
 * limited to guests in UPLOAD_ALLOWED_COUNTRY (default Lebanon). Country comes from
 * Cloudflare's `cf-ipcountry` header (with Vercel's as a fallback). The authoritative
 * block is a Cloudflare WAF rule on POST /api/upload; this is a cheap in-app backstop
 * and drives the friendly "not in Lebanon" message on the upload page.
 */
export function isUploadCountryAllowed(country: string | null | undefined): boolean {
  if (!country) return false;
  return env.uploadAllowedCountries.includes(country.trim().toUpperCase());
}

/** Read the request's country code (Cloudflare first, Vercel fallback). */
export function countryFromHeaders(h: Headers): string {
  return (h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "").toUpperCase();
}

/**
 * Skip the upload geo check. Defaults ON in dev (no `cf-ipcountry` header locally)
 * and OFF in production. Set UPLOAD_GEO_BYPASS=0/1 to override.
 */
export function uploadGeoBypass(): boolean {
  if (process.env.UPLOAD_GEO_BYPASS === "1") return true;
  if (process.env.UPLOAD_GEO_BYPASS === "0") return false;
  return !env.isProd;
}

/** Final decision: may this request upload, from a location standpoint? */
export function isUploadGeoAllowed(h: Headers): boolean {
  if (uploadGeoBypass()) return true;
  return isUploadCountryAllowed(countryFromHeaders(h));
}

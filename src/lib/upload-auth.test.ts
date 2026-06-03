import { describe, it, expect, afterEach, vi } from "vitest";
import { isUploadCountryAllowed, uploadGeoBypass, isUploadGeoAllowed } from "./upload-auth";

// env.uploadAllowedCountries defaults to ["LB"] (UPLOAD_ALLOWED_COUNTRY unset in tests).
describe("isUploadCountryAllowed", () => {
  it("allows the configured country, case-insensitively", () => {
    expect(isUploadCountryAllowed("LB")).toBe(true);
    expect(isUploadCountryAllowed("lb")).toBe(true);
    expect(isUploadCountryAllowed(" Lb ")).toBe(true);
  });

  it("rejects other / missing countries", () => {
    expect(isUploadCountryAllowed("US")).toBe(false);
    expect(isUploadCountryAllowed("")).toBe(false);
    expect(isUploadCountryAllowed(null)).toBe(false);
    expect(isUploadCountryAllowed(undefined)).toBe(false);
  });
});

describe("uploadGeoBypass", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("honours the explicit override", () => {
    vi.stubEnv("UPLOAD_GEO_BYPASS", "1");
    expect(uploadGeoBypass()).toBe(true);
    vi.stubEnv("UPLOAD_GEO_BYPASS", "0");
    expect(uploadGeoBypass()).toBe(false);
  });
});

describe("isUploadGeoAllowed", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("bypasses entirely when UPLOAD_GEO_BYPASS=1", () => {
    vi.stubEnv("UPLOAD_GEO_BYPASS", "1");
    expect(isUploadGeoAllowed(new Headers({ "cf-ipcountry": "US" }))).toBe(true);
  });

  it("gates by cf-ipcountry when the check is on", () => {
    vi.stubEnv("UPLOAD_GEO_BYPASS", "0");
    expect(isUploadGeoAllowed(new Headers({ "cf-ipcountry": "LB" }))).toBe(true);
    expect(isUploadGeoAllowed(new Headers({ "cf-ipcountry": "US" }))).toBe(false);
  });

  it("falls back to x-vercel-ip-country", () => {
    vi.stubEnv("UPLOAD_GEO_BYPASS", "0");
    expect(isUploadGeoAllowed(new Headers({ "x-vercel-ip-country": "LB" }))).toBe(true);
    expect(isUploadGeoAllowed(new Headers())).toBe(false);
  });
});

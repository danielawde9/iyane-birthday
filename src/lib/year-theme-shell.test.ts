import { describe, expect, it } from "vitest";
import type { EventRow } from "@/db/schema";
import { getArchiveYearThemeShell } from "./year-theme-shell";

function event(overrides: Partial<EventRow>): EventRow {
  return {
    id: overrides.id ?? `event-${overrides.year ?? 1}`,
    year: overrides.year ?? 1,
    themeSlug: overrides.themeSlug ?? "big-top",
    title: overrides.title ?? `Year ${overrides.year ?? 1}`,
    eventDate: overrides.eventDate ?? null,
    venue: overrides.venue ?? null,
    address: overrides.address ?? null,
    mapUrl: overrides.mapUrl ?? null,
    dressCode: overrides.dressCode ?? null,
    heroCopy: overrides.heroCopy ?? null,
    isActive: overrides.isActive ?? false,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
  };
}

describe("getArchiveYearThemeShell", () => {
  it("resolves an archive year to its event, theme, CSS vars, and archive chrome labels", () => {
    const shell = getArchiveYearThemeShell(
      [
        event({ year: 2, themeSlug: "sweet-sophomore", title: "Iyane - Year Two", isActive: true }),
        event({ year: 1, themeSlug: "big-top", title: "Iyane - Year One" }),
      ],
      "1",
    );

    expect(shell?.event.year).toBe(1);
    expect(shell?.theme.slug).toBe("big-top");
    expect(shell?.cssVars["--c-primary"]).toBe("#A3322E");
    expect(shell?.chrome.yearLabel).toBe("Viewing Year 1");
    expect(shell?.chrome.themeLabel).toBe("The Greatest Little Show on Earth");
    expect(shell?.chrome.homeHref).toBe("/archive/1");
  });

  it("returns null when the requested archive year does not exist", () => {
    expect(getArchiveYearThemeShell([event({ year: 1 })], "99")).toBeNull();
  });
});

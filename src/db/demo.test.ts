import { describe, expect, it } from "vitest";
import {
  DEMO_EVENT,
  DEMO_EVENTS,
  DEMO_PHOTOS,
  getDemoEvents,
  getDemoPhotos,
  isLocalTestEvent,
} from "./demo";

describe("demo archive years", () => {
  it("keeps the default demo event list production-safe", () => {
    expect(DEMO_EVENT.year).toBe(1);
    expect(DEMO_EVENTS.map((event) => event.year)).toEqual([1]);
    expect(DEMO_PHOTOS.every((photo) => photo.eventId === DEMO_EVENT.id)).toBe(true);
  });

  it("can include a second inactive local test event for archived theme testing", () => {
    const events = getDemoEvents({ includeLocalTestYears: true });
    const yearTwo = events.find((event) => event.year === 2);

    expect(DEMO_EVENT.year).toBe(1);
    expect(yearTwo?.themeSlug).toBe("tiny-astronaut");
    expect(yearTwo?.title).toBe("Iyane - Mission Two");
    expect(yearTwo?.isActive).toBe(false);
    expect(yearTwo && isLocalTestEvent(yearTwo)).toBe(true);
  });

  it("has visible local test photos for year two when local test years are enabled", () => {
    const yearTwo = getDemoEvents({ includeLocalTestYears: true }).find((event) => event.year === 2);
    const photos = getDemoPhotos({ includeLocalTestYears: true }).filter(
      (photo) => photo.eventId === yearTwo?.id && photo.status === "visible",
    );

    expect(photos.length).toBeGreaterThan(0);
    expect(photos.some((photo) => photo.featured)).toBe(true);
  });
});

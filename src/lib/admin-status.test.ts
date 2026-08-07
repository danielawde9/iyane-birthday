import { describe, it, expect } from "vitest";
import { statusControl } from "./admin-status";

describe("statusControl", () => {
  it("offers Hide on a live row and shows no badge", () => {
    expect(statusControl("visible")).toEqual({ badge: null, action: "Hide", nextStatus: "hidden", dim: false });
  });

  it("tells the host apart from the guest when a row is down", () => {
    expect(statusControl("hidden").badge).toBe("Hidden by you");
    expect(statusControl("removed").badge).toBe("Removed by guest");
  });

  it("restores either kind of takedown to visible", () => {
    expect(statusControl("hidden").nextStatus).toBe("visible");
    expect(statusControl("removed").nextStatus).toBe("visible");
  });

  it("labels a guest removal Restore rather than Show", () => {
    expect(statusControl("removed").action).toBe("Restore");
    expect(statusControl("hidden").action).toBe("Show");
  });

  it("dims anything that is not live", () => {
    expect(statusControl("visible").dim).toBe(false);
    expect(statusControl("hidden").dim).toBe(true);
    expect(statusControl("removed").dim).toBe(true);
  });

  it("surfaces an unknown status instead of rendering it as live", () => {
    const c = statusControl("quarantined");
    expect(c.badge).toContain("quarantined");
    expect(c.dim).toBe(true);
    expect(c.nextStatus).toBe("visible");
  });
});

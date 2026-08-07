/**
 * How a row's status reads on the host's admin page.
 *
 * The three states are not interchangeable: `hidden` is the host's own
 * moderation, `removed` is a guest taking their row down. Both are restorable,
 * but the host should be able to see at a glance which happened — a guest
 * changing their mind is not the same event as the host stepping in.
 */
export type RowStatus = "visible" | "hidden" | "removed";

export interface StatusControl {
  /** Short label shown on the row, or null when it's simply live. */
  badge: string | null;
  /** Text for the toggle button. */
  action: string;
  /** Status the toggle writes. */
  nextStatus: RowStatus;
  /** Whether to fade the row. */
  dim: boolean;
}

export function statusControl(status: string): StatusControl {
  switch (status) {
    case "hidden":
      return { badge: "Hidden by you", action: "Show", nextStatus: "visible", dim: true };
    case "removed":
      return { badge: "Removed by guest", action: "Restore", nextStatus: "visible", dim: true };
    case "visible":
      return { badge: null, action: "Hide", nextStatus: "hidden", dim: false };
    default:
      // An unknown status is a data problem, not a reason to render a broken
      // control: surface it and offer the safe move.
      return { badge: `Unknown (${status})`, action: "Show", nextStatus: "visible", dim: true };
  }
}

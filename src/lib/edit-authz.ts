import { verifyEditToken } from "./edit-token";

/**
 * The guest edit/remove authorization rules, as one pure function.
 *
 * Writes reach the database through the Supabase service role, which bypasses
 * RLS — so this is the ONLY thing standing between a stranger and someone
 * else's photo. It fails closed: anything not explicitly allowed is a 403.
 */

/** The narrow row shape the rules need. Deliberately not `PhotoRow`. */
export interface EditableRow {
  status: string;
  editTokenHash: string | null;
}

export type EditIntent = "patch" | "delete";

export type EditDenialCode = "forbidden" | "locked_by_host" | "already_removed";

export type EditAuthz = { ok: true } | { ok: false; status: 403; code: EditDenialCode };

const deny = (code: EditDenialCode): EditAuthz => ({ ok: false, status: 403, code });

export function authorizeEdit(row: EditableRow | null, token: unknown, intent: EditIntent): EditAuthz {
  // A missing row and a bad token answer identically. A 404/403 split would let
  // anyone enumerate which row ids exist.
  if (!row) return deny("forbidden");
  if (!verifyEditToken(token, row.editTokenHash)) return deny("forbidden");

  // The token is proven. Only now may the reason mention the row's state.
  switch (row.status) {
    case "visible":
      return { ok: true };
    case "hidden":
      // The host took this down. A guest cannot edit around that, or undo it.
      return deny("locked_by_host");
    case "removed":
      // Already gone by the guest's own hand: removing again is a harmless no-op,
      // editing is not (it would silently resurrect nothing).
      return intent === "delete" ? { ok: true } : deny("already_removed");
    default:
      return deny("forbidden");
  }
}

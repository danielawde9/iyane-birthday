import { describe, it, expect } from "vitest";
import { createEditToken } from "./edit-token";
import { authorizeEdit } from "./edit-authz";

const mine = createEditToken();
const theirs = createEditToken();

const visibleRow = { status: "visible", editTokenHash: mine.hash };

describe("authorizeEdit", () => {
  it("allows the holder of the row's token to patch it", () => {
    expect(authorizeEdit(visibleRow, mine.token, "patch")).toEqual({ ok: true });
  });

  it("allows the holder of the row's token to remove it", () => {
    expect(authorizeEdit(visibleRow, mine.token, "delete")).toEqual({ ok: true });
  });

  it("denies a request with no token", () => {
    const r = authorizeEdit(visibleRow, null, "patch");
    expect(r).toEqual({ ok: false, status: 403, code: "forbidden" });
  });

  it("denies a wrong token", () => {
    expect(authorizeEdit(visibleRow, "not-the-token", "patch")).toMatchObject({ ok: false, status: 403 });
  });

  it("denies another row's token", () => {
    expect(authorizeEdit(visibleRow, theirs.token, "patch")).toMatchObject({ ok: false, status: 403 });
  });

  // A missing row answers exactly like a wrong token, so nobody can probe which
  // uuids exist by watching for a 404.
  it("denies a missing row with the same shape as a wrong token", () => {
    expect(authorizeEdit(null, mine.token, "patch")).toEqual({ ok: false, status: 403, code: "forbidden" });
  });

  it("denies a row the host has hidden, even with the right token", () => {
    const row = { status: "hidden", editTokenHash: mine.hash };
    expect(authorizeEdit(row, mine.token, "patch")).toEqual({ ok: false, status: 403, code: "locked_by_host" });
    expect(authorizeEdit(row, mine.token, "delete")).toEqual({ ok: false, status: 403, code: "locked_by_host" });
  });

  it("denies editing an already-removed row but treats removing it as a no-op success", () => {
    const row = { status: "removed", editTokenHash: mine.hash };
    expect(authorizeEdit(row, mine.token, "patch")).toEqual({ ok: false, status: 403, code: "already_removed" });
    expect(authorizeEdit(row, mine.token, "delete")).toEqual({ ok: true });
  });

  it("denies a row with no stored hash", () => {
    expect(authorizeEdit({ status: "visible", editTokenHash: null }, mine.token, "patch")).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("fails closed on an unrecognised status", () => {
    const row = { status: "quarantined", editTokenHash: mine.hash };
    expect(authorizeEdit(row, mine.token, "patch")).toMatchObject({ ok: false, status: 403 });
    expect(authorizeEdit(row, mine.token, "delete")).toMatchObject({ ok: false, status: 403 });
  });

  it("checks the token before the status, so a stranger cannot learn a row is hidden", () => {
    const row = { status: "hidden", editTokenHash: mine.hash };
    expect(authorizeEdit(row, theirs.token, "patch")).toEqual({ ok: false, status: 403, code: "forbidden" });
  });
});

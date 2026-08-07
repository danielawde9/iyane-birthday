import { describe, it, expect } from "vitest";
import { parsePhotoEdit, parseGuestbookEdit } from "./edit-payload";

describe("parsePhotoEdit", () => {
  it("accepts a caption and an uploader name, trimmed, as snake_case columns", () => {
    const r = parsePhotoEdit({ caption: "  the cake  ", uploaderName: " Mae " });
    expect(r).toEqual({ ok: true, columns: { caption: "the cake", uploader_name: "Mae" } });
  });

  it("accepts clearing a field with null", () => {
    const r = parsePhotoEdit({ caption: null });
    expect(r).toEqual({ ok: true, columns: { caption: null } });
  });

  it("treats a field trimmed to nothing as clearing it", () => {
    const r = parsePhotoEdit({ caption: "   " });
    expect(r).toEqual({ ok: true, columns: { caption: null } });
  });

  it("omits fields that were not sent", () => {
    const r = parsePhotoEdit({ caption: "hi" });
    expect(r.ok && Object.keys(r.columns)).toEqual(["caption"]);
  });

  it("rejects an attempt to set status", () => {
    expect(parsePhotoEdit({ caption: "hi", status: "visible" })).toMatchObject({ ok: false });
  });

  it("rejects an attempt to set featured", () => {
    expect(parsePhotoEdit({ featured: true })).toMatchObject({ ok: false });
  });

  it("rejects an attempt to set the token hash", () => {
    expect(parsePhotoEdit({ caption: "hi", edit_token_hash: "x" })).toMatchObject({ ok: false });
    expect(parsePhotoEdit({ caption: "hi", editTokenHash: "x" })).toMatchObject({ ok: false });
  });

  it("rejects an attempt to move the row to another event", () => {
    expect(parsePhotoEdit({ eventId: "other" })).toMatchObject({ ok: false });
  });

  it("rejects an empty patch", () => {
    expect(parsePhotoEdit({})).toMatchObject({ ok: false });
  });

  it("rejects a caption over 140 characters", () => {
    expect(parsePhotoEdit({ caption: "x".repeat(141) })).toMatchObject({ ok: false });
    expect(parsePhotoEdit({ caption: "x".repeat(140) })).toMatchObject({ ok: true });
  });

  it("rejects an uploader name over 60 characters", () => {
    expect(parsePhotoEdit({ uploaderName: "x".repeat(61) })).toMatchObject({ ok: false });
  });

  it("rejects a non-object body without throwing", () => {
    expect(parsePhotoEdit(null)).toMatchObject({ ok: false });
    expect(parsePhotoEdit("caption=hi")).toMatchObject({ ok: false });
    expect(parsePhotoEdit([{ caption: "hi" }])).toMatchObject({ ok: false });
  });

  it("rejects a wrong-typed field", () => {
    expect(parsePhotoEdit({ caption: 42 })).toMatchObject({ ok: false });
  });

  // Second gate: even if the schema above ever regressed, the emitted object is
  // built key-by-key, so no other column can reach the database.
  it("never emits a column outside the allow-list", () => {
    const r = parsePhotoEdit({ caption: "a", uploaderName: "b" });
    expect(r.ok && Object.keys(r.columns).sort()).toEqual(["caption", "uploader_name"]);
  });
});

describe("parseGuestbookEdit", () => {
  it("accepts a name and message, trimmed", () => {
    const r = parseGuestbookEdit({ name: " Mae ", message: "  happy birthday  " });
    expect(r).toEqual({ ok: true, columns: { name: "Mae", message: "happy birthday" } });
  });

  it("rejects a blank name, which the column forbids", () => {
    expect(parseGuestbookEdit({ name: "   " })).toMatchObject({ ok: false });
    expect(parseGuestbookEdit({ name: null })).toMatchObject({ ok: false });
  });

  it("rejects a blank message, which the column forbids", () => {
    expect(parseGuestbookEdit({ message: "  " })).toMatchObject({ ok: false });
  });

  it("rejects an attempt to set status", () => {
    expect(parseGuestbookEdit({ message: "hi", status: "visible" })).toMatchObject({ ok: false });
  });

  it("rejects an empty patch", () => {
    expect(parseGuestbookEdit({})).toMatchObject({ ok: false });
  });

  it("rejects a message over 400 characters and a name over 80", () => {
    expect(parseGuestbookEdit({ message: "x".repeat(401) })).toMatchObject({ ok: false });
    expect(parseGuestbookEdit({ name: "x".repeat(81) })).toMatchObject({ ok: false });
  });

  it("never emits a column outside the allow-list", () => {
    const r = parseGuestbookEdit({ name: "a", message: "b" });
    expect(r.ok && Object.keys(r.columns).sort()).toEqual(["message", "name"]);
  });
});

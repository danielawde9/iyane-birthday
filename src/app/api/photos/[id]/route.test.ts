import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEditToken, EDIT_TOKEN_HEADER } from "@/lib/edit-token";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

// The limiter is a module-global with a real 8-per-minute budget; left alone it
// would make this file order-dependent. Stubbed to "allowed", with the 429 path
// asserted explicitly below.
const limiterCheck = vi.fn(() => ({ allowed: true, remaining: 7, retryAfterMs: 0 }));
vi.mock("@/lib/ratelimit-instance", () => ({
  writeLimiter: { check: (...args: unknown[]) => limiterCheck(...(args as [])) },
  uploadLimiter: { check: () => ({ allowed: true, remaining: 7, retryAfterMs: 0 }) },
}));
const geoAllowed = vi.fn(() => true);
vi.mock("@/lib/upload-auth", () => ({ isUploadGeoAllowed: () => geoAllowed() }));
vi.mock("@/db/queries", () => ({
  getPhotoAuthRow: vi.fn(),
  updatePhotoContent: vi.fn(),
  softRemovePhoto: vi.fn(),
  deletePhoto: vi.fn(), // must never be called from a guest route
  setPhotoStatus: vi.fn(), // ditto: guests do not set arbitrary statuses
}));
vi.mock("@/lib/storage", () => ({
  removeFromStorage: vi.fn(), // must never be called from a guest route
  toPublicUrl: (k: string) => `https://cdn.example/${k}`,
}));

const queries = await import("@/db/queries");
const storage = await import("@/lib/storage");
const { PATCH, DELETE } = await import("./route");

const mine = createEditToken();
const theirs = createEditToken();
const ctx = { params: Promise.resolve({ id: "p1" }) };

function req(method: string, opts: { token?: string | null; body?: unknown } = {}): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.token) headers.set(EDIT_TOKEN_HEADER, opts.token);
  return new Request("http://localhost/api/photos/p1", {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

const photoRow = {
  id: "p1",
  eventId: "e1",
  storageKey: "e1/a.jpg",
  thumbKey: "e1/thumb/a.jpg",
  width: 1200,
  height: 800,
  uploaderName: "Mae",
  caption: "the cake",
  featured: false,
  status: "visible",
  editedAt: new Date("2026-08-07T10:00:00Z"),
  createdAt: new Date("2026-08-06T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  limiterCheck.mockReturnValue({ allowed: true, remaining: 7, retryAfterMs: 0 });
  geoAllowed.mockReturnValue(true);
  vi.mocked(queries.getPhotoAuthRow).mockResolvedValue({ status: "visible", editTokenHash: mine.hash });
  vi.mocked(queries.updatePhotoContent).mockResolvedValue(photoRow as never);
});

describe("guest write gate", () => {
  it("applies the geo gate before anything else, exactly as POST does", async () => {
    geoAllowed.mockReturnValue(false);
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("geo_locked");
    expect(queries.getPhotoAuthRow).not.toHaveBeenCalled();
  });

  it("rate limits with the shared write limiter", async () => {
    limiterCheck.mockReturnValue({ allowed: false, remaining: 0, retryAfterMs: 30_000 });
    const res = await DELETE(req("DELETE", { token: mine.token }), ctx as never);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(queries.softRemovePhoto).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/photos/[id] — who may edit", () => {
  it("edits the caption for the holder of the row's token", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "the cake" } }), ctx as never);
    expect(res.status).toBe(200);
    expect(vi.mocked(queries.updatePhotoContent).mock.calls[0][1]).toEqual({ caption: "the cake" });
  });

  it("rejects a request with no token", async () => {
    const res = await PATCH(req("PATCH", { body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects a wrong token", async () => {
    const res = await PATCH(req("PATCH", { token: "not-a-token", body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects another row's token", async () => {
    const res = await PATCH(req("PATCH", { token: theirs.token, body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects a token for a row that does not exist, without revealing that", async () => {
    vi.mocked(queries.getPhotoAuthRow).mockResolvedValue(null);
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
  });

  it("rejects editing a row the host has hidden, even with the right token", async () => {
    vi.mocked(queries.getPhotoAuthRow).mockResolvedValue({ status: "hidden", editTokenHash: mine.hash });
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects editing a row the guest already removed", async () => {
    vi.mocked(queries.getPhotoAuthRow).mockResolvedValue({ status: "removed", editTokenHash: mine.hash });
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "hi" } }), ctx as never);
    expect(res.status).toBe(403);
  });

  it("never leaks the token hash in a response", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "hi" } }), ctx as never);
    expect(JSON.stringify(await res.json())).not.toContain(mine.hash);
  });
});

describe("PATCH /api/photos/[id] — what may be edited", () => {
  it("rejects an attempt to set status", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { status: "visible" } }), ctx as never);
    expect(res.status).toBe(400);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects an attempt to set featured", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { caption: "hi", featured: true } }), ctx as never);
    expect(res.status).toBe(400);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects an attempt to overwrite the token hash", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { edit_token_hash: "x" } }), ctx as never);
    expect(res.status).toBe(400);
    expect(queries.updatePhotoContent).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const bad = new Request("http://localhost/api/photos/p1", {
      method: "PATCH",
      headers: new Headers({ [EDIT_TOKEN_HEADER]: mine.token }),
      body: "not json",
    });
    expect((await PATCH(bad, ctx as never)).status).toBe(400);
  });

  it("only ever writes caption and uploader_name", async () => {
    await PATCH(req("PATCH", { token: mine.token, body: { caption: "a", uploaderName: "b" } }), ctx as never);
    const columns = vi.mocked(queries.updatePhotoContent).mock.calls[0][1];
    expect(Object.keys(columns).sort()).toEqual(["caption", "uploader_name"]);
  });
});

describe("DELETE /api/photos/[id]", () => {
  it("soft-removes the row for the token holder", async () => {
    const res = await DELETE(req("DELETE", { token: mine.token }), ctx as never);
    expect(res.status).toBe(200);
    expect(queries.softRemovePhoto).toHaveBeenCalledWith("p1", expect.any(Date));
  });

  it("never hard-deletes the row and never touches the storage object", async () => {
    await DELETE(req("DELETE", { token: mine.token }), ctx as never);
    expect(queries.deletePhoto).not.toHaveBeenCalled();
    expect(storage.removeFromStorage).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong token", async () => {
    expect((await DELETE(req("DELETE"), ctx as never)).status).toBe(403);
    expect((await DELETE(req("DELETE", { token: theirs.token }), ctx as never)).status).toBe(403);
    expect(queries.softRemovePhoto).not.toHaveBeenCalled();
  });

  it("rejects removing a row the host has hidden", async () => {
    vi.mocked(queries.getPhotoAuthRow).mockResolvedValue({ status: "hidden", editTokenHash: mine.hash });
    expect((await DELETE(req("DELETE", { token: mine.token }), ctx as never)).status).toBe(403);
    expect(queries.softRemovePhoto).not.toHaveBeenCalled();
  });

  it("is idempotent on an already-removed row", async () => {
    vi.mocked(queries.getPhotoAuthRow).mockResolvedValue({ status: "removed", editTokenHash: mine.hash });
    expect((await DELETE(req("DELETE", { token: mine.token }), ctx as never)).status).toBe(200);
  });
});

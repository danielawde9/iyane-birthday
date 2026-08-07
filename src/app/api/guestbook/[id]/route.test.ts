import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEditToken, EDIT_TOKEN_HEADER } from "@/lib/edit-token";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const limiterCheck = vi.fn(() => ({ allowed: true, remaining: 7, retryAfterMs: 0 }));
vi.mock("@/lib/ratelimit-instance", () => ({
  writeLimiter: { check: (...args: unknown[]) => limiterCheck(...(args as [])) },
  uploadLimiter: { check: () => ({ allowed: true, remaining: 7, retryAfterMs: 0 }) },
}));
vi.mock("@/lib/upload-auth", () => ({ isUploadGeoAllowed: () => true }));
vi.mock("@/db/queries", () => ({
  getGuestbookAuthRow: vi.fn(),
  updateGuestbookContent: vi.fn(),
  softRemoveGuestbook: vi.fn(),
  setGuestbookStatus: vi.fn(),
}));

const queries = await import("@/db/queries");
const { PATCH, DELETE } = await import("./route");

const mine = createEditToken();
const theirs = createEditToken();
const ctx = { params: Promise.resolve({ id: "g1" }) };

function req(method: string, opts: { token?: string; body?: unknown } = {}): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.token) headers.set(EDIT_TOKEN_HEADER, opts.token);
  return new Request("http://localhost/api/guestbook/g1", {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

const wishRow = {
  id: "g1",
  eventId: "e1",
  name: "Mae",
  message: "happy birthday",
  status: "visible",
  editedAt: new Date("2026-08-07T10:00:00Z"),
  createdAt: new Date("2026-08-06T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  limiterCheck.mockReturnValue({ allowed: true, remaining: 7, retryAfterMs: 0 });
  vi.mocked(queries.getGuestbookAuthRow).mockResolvedValue({ status: "visible", editTokenHash: mine.hash });
  vi.mocked(queries.updateGuestbookContent).mockResolvedValue(wishRow as never);
});

describe("PATCH /api/guestbook/[id]", () => {
  it("edits the message for the holder of the row's token", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { message: "happy birthday" } }), ctx as never);
    expect(res.status).toBe(200);
    expect((await res.json()).entry.message).toBe("happy birthday");
  });

  it("rejects a missing, wrong, or another row's token", async () => {
    expect((await PATCH(req("PATCH", { body: { message: "x" } }), ctx as never)).status).toBe(403);
    expect((await PATCH(req("PATCH", { token: "nope", body: { message: "x" } }), ctx as never)).status).toBe(403);
    expect((await PATCH(req("PATCH", { token: theirs.token, body: { message: "x" } }), ctx as never)).status).toBe(403);
    expect(queries.updateGuestbookContent).not.toHaveBeenCalled();
  });

  it("rejects editing a wish the host has hidden", async () => {
    vi.mocked(queries.getGuestbookAuthRow).mockResolvedValue({ status: "hidden", editTokenHash: mine.hash });
    const res = await PATCH(req("PATCH", { token: mine.token, body: { message: "x" } }), ctx as never);
    expect(res.status).toBe(403);
    expect(queries.updateGuestbookContent).not.toHaveBeenCalled();
  });

  it("rejects an attempt to set status", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { message: "x", status: "visible" } }), ctx as never);
    expect(res.status).toBe(400);
    expect(queries.updateGuestbookContent).not.toHaveBeenCalled();
  });

  it("rejects a blank message, which the column forbids", async () => {
    expect((await PATCH(req("PATCH", { token: mine.token, body: { message: "  " } }), ctx as never)).status).toBe(400);
  });

  it("only ever writes name and message", async () => {
    await PATCH(req("PATCH", { token: mine.token, body: { name: "Mae", message: "hi" } }), ctx as never);
    expect(Object.keys(vi.mocked(queries.updateGuestbookContent).mock.calls[0][1]).sort()).toEqual(["message", "name"]);
  });

  it("never returns the row's status or token hash to the guest", async () => {
    const res = await PATCH(req("PATCH", { token: mine.token, body: { message: "hi" } }), ctx as never);
    const body = JSON.stringify(await res.json());
    expect(body).not.toContain(mine.hash);
    expect(body).not.toContain("status");
  });
});

describe("DELETE /api/guestbook/[id]", () => {
  it("soft-removes the wish for the token holder", async () => {
    const res = await DELETE(req("DELETE", { token: mine.token }), ctx as never);
    expect(res.status).toBe(200);
    expect(queries.softRemoveGuestbook).toHaveBeenCalledWith("g1", expect.any(Date));
    expect(queries.setGuestbookStatus).not.toHaveBeenCalled();
  });

  it("rejects a missing or foreign token", async () => {
    expect((await DELETE(req("DELETE"), ctx as never)).status).toBe(403);
    expect((await DELETE(req("DELETE", { token: theirs.token }), ctx as never)).status).toBe(403);
    expect(queries.softRemoveGuestbook).not.toHaveBeenCalled();
  });

  it("rejects removing a wish the host has hidden", async () => {
    vi.mocked(queries.getGuestbookAuthRow).mockResolvedValue({ status: "hidden", editTokenHash: mine.hash });
    expect((await DELETE(req("DELETE", { token: mine.token }), ctx as never)).status).toBe(403);
    expect(queries.softRemoveGuestbook).not.toHaveBeenCalled();
  });
});

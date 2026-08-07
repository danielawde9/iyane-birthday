import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashEditToken } from "@/lib/edit-token";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/db/queries", () => ({
  getActiveEvent: vi.fn(),
  insertGuestbook: vi.fn(),
  listGuestbook: vi.fn(),
}));

const queries = await import("@/db/queries");
const { POST } = await import("./route");

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/guestbook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(queries.getActiveEvent).mockResolvedValue({ id: "e1" } as never);
  vi.mocked(queries.insertGuestbook).mockImplementation(
    async (values) =>
      ({
        id: "g1",
        eventId: values.eventId,
        name: values.name,
        message: values.message,
        status: "visible",
        editedAt: null,
        createdAt: new Date("2026-08-07T10:00:00Z"),
      }) as never,
  );
});

describe("POST /api/guestbook", () => {
  it("returns a capability token with the new entry", async () => {
    const res = await POST(jsonRequest({ name: "Mae", message: "happy birthday" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.entry.id).toBe("g1");
    expect(typeof body.editToken).toBe("string");
    expect(body.editToken.length).toBeGreaterThan(20);
  });

  it("stores only the hash of the token, never the token itself", async () => {
    const res = await POST(jsonRequest({ name: "Mae", message: "happy birthday" }));
    const { editToken } = await res.json();

    const stored = vi.mocked(queries.insertGuestbook).mock.calls[0][0];
    expect(stored.editTokenHash).not.toBe(editToken);
    expect(stored.editTokenHash).toBe(hashEditToken(editToken));
  });

  it("mints a fresh token per entry", async () => {
    const a = await (await POST(jsonRequest({ name: "A", message: "one" }))).json();
    const b = await (await POST(jsonRequest({ name: "B", message: "two" }))).json();
    expect(a.editToken).not.toBe(b.editToken);
  });

  it("never puts the token inside the public entry payload", async () => {
    const res = await POST(jsonRequest({ name: "Mae", message: "hi" }));
    const { entry, editToken } = await res.json();
    expect(JSON.stringify(entry)).not.toContain(editToken);
  });
});

import { describe, it, expect } from "vitest";
import { mapWithConcurrency } from "./concurrency";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

describe("mapWithConcurrency", () => {
  it("returns results in input order", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n * 10);
    expect(out).toEqual([10, 20, 30, 40]);
  });

  it("returns an empty array for no items", async () => {
    expect(await mapWithConcurrency<number, number>([], 3, async (n) => n)).toEqual([]);
  });

  it("never runs more than `limit` workers at once", async () => {
    const started: number[] = [];
    const gates = Array.from({ length: 5 }, () => deferred<void>());
    const p = mapWithConcurrency([0, 1, 2, 3, 4], 2, async (i) => {
      started.push(i);
      await gates[i]!.promise;
      return i;
    });
    await flush();
    expect(started).toEqual([0, 1]); // only `limit` started

    gates[0]!.resolve();
    await flush();
    expect(started).toEqual([0, 1, 2]); // freeing one starts the next

    gates[1]!.resolve();
    gates[2]!.resolve();
    gates[3]!.resolve();
    gates[4]!.resolve();
    expect(await p).toEqual([0, 1, 2, 3, 4]);
  });

  it("caps workers at the item count when limit is larger", async () => {
    const out = await mapWithConcurrency([1, 2], 10, async (n) => n + 1);
    expect(out).toEqual([2, 3]);
  });
});

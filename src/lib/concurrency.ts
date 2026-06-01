/**
 * Run `worker` over `items` with at most `limit` in flight at once.
 * Results come back in the original input order. Workers are expected to
 * handle their own errors (the uploader updates item status in place); a
 * worker that rejects will reject the whole batch.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  if (items.length === 0) return results;
  const size = Math.max(1, Math.min(limit, items.length));
  let next = 0;
  async function runner(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: size }, () => runner()));
  return results;
}

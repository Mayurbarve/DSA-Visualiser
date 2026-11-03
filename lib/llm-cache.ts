/* ------------------------------------------------------------------ *
 * Server-side memo for generated content.
 *
 * Two jobs:
 *   1. Do not pay for the same generation twice — a second visit, a second
 *      tab or a reload is served from memory until the entry ages out.
 *   2. Collapse concurrent requests for the same thing into one generation,
 *      so two tabs opening the same problem do not race six model calls.
 *
 * Lives on globalThis so a Next dev hot-reload keeps the warm entries.
 * ------------------------------------------------------------------ */

type Entry = { at: number; value: unknown };

const globalStore = globalThis as unknown as {
  __aaLlmCache?: { entries: Map<string, Entry>; inflight: Map<string, Promise<unknown>> };
};

const store =
  globalStore.__aaLlmCache ??
  (globalStore.__aaLlmCache = { entries: new Map<string, Entry>(), inflight: new Map<string, Promise<unknown>>() });

/** Generated bundles stay warm for six hours; free models are the slow part. */
export const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_ENTRIES = 120;

function evictOldest() {
  if (store.entries.size <= MAX_ENTRIES) return;
  const oldest = [...store.entries.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, store.entries.size - MAX_ENTRIES);
  oldest.forEach(([key]) => store.entries.delete(key));
}

export function peek<T>(key: string, ttlMs = CACHE_TTL_MS): T | null {
  const hit = store.entries.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    store.entries.delete(key);
    return null;
  }
  return hit.value as T;
}

export function remember<T>(key: string, value: T): T {
  store.entries.set(key, { at: Date.now(), value });
  evictOldest();
  return value;
}

export function forget(key: string) {
  store.entries.delete(key);
}

/** Returns a cached value, joins an in-flight generation, or starts one. */
export async function memo<T>(key: string, produce: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<{ value: T; cached: boolean }> {
  const hit = peek<T>(key, ttlMs);
  if (hit !== null) return { value: hit, cached: true };

  const running = store.inflight.get(key);
  if (running) return { value: (await running) as T, cached: true };

  const task = produce()
    .then((value) => remember(key, value))
    .finally(() => store.inflight.delete(key));

  store.inflight.set(key, task);
  return { value: await task, cached: false };
}

export function cacheStats() {
  return { entries: store.entries.size, inflight: store.inflight.size };
}

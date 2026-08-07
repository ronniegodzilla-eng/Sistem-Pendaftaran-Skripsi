// In-memory TTL cache for Firestore reads.
//
// Firestore bills per document returned, so every `getDocs(collection(...))` in this
// app costs one read per document in that collection. Before this cache, a single
// dashboard render re-read `students`, `submissions` and `schedules` several times
// over, and the notification poll repeated all of it every minute.
//
// Reads go through `getCached`, which serves a recent result instead of re-fetching
// and collapses concurrent requests for the same key into one network call.
// Every write path calls `invalidateCache` so the next read sees fresh data.

export const CACHE_KEYS = {
  students: 'students',
  submissions: 'submissions',
  schedules: 'schedules',
  rooms: 'rooms',
};

// Settings docs are stored per requirement type, so they get their own key each.
export const settingsKey = (docId: string) => `settings:${docId}`;

export const CACHE_TTL = {
  // Data that several users edit during the day. Kept short so other people's
  // changes still show up quickly.
  volatile: 30 * 1000,
  // Master data and configuration, only changed by an admin action that
  // invalidates this cache anyway.
  stable: 5 * 60 * 1000,
};

type CacheEntry = { data: unknown; fetchedAt: number };

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Returns a cached value when it is younger than `ttl`, otherwise runs `fetcher`
 * and caches the result. Concurrent calls for the same key share one `fetcher` run.
 *
 * Pass `forceFresh` where staleness would be incorrect (schedule conflict checks,
 * validation) to bypass the cache while still refreshing it for later readers.
 *
 * A failing `fetcher` is never cached; the rejection propagates to the caller so
 * existing local-storage fallbacks still run.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  forceFresh = false
): Promise<T> {
  if (!forceFresh) {
    const entry = store.get(key);
    if (entry && Date.now() - entry.fetchedAt < ttl) {
      return entry.data as T;
    }
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const request = (async () => {
    const data = await fetcher();
    store.set(key, { data, fetchedAt: Date.now() });
    return data;
  })();

  inflight.set(key, request);
  try {
    return await request;
  } finally {
    // Only clear if a newer forced request has not already replaced this one.
    if (inflight.get(key) === request) inflight.delete(key);
  }
}

export const invalidateCache = (...keys: string[]) => {
  keys.forEach(key => {
    store.delete(key);
    inflight.delete(key);
  });
};

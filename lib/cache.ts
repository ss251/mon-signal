// Simple in-memory session cache for client-side data
// Cache is cleared on page refresh/app reopen

type CacheEntry<T> = {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export const sessionCache = {
  get<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    return entry.data
  },

  set<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() })
  },

  has(key: string): boolean {
    return cache.has(key)
  },

  invalidate(key: string): void {
    cache.delete(key)
  },

  clear(): void {
    cache.clear()
  },
}

// Cache keys
export const CACHE_KEYS = {
  following: (fid: number) => `following:${fid}`,
  trades: (fid: number) => `trades:${fid}`,
}

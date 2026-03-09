/**
 * Cache - tương tự Rails.cache.
 * Dùng node-cache (in-memory). Có thể thay bằng Redis cho production.
 */
import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 300, // 5 phút mặc định
  checkperiod: 60,
});

export const Cache = {
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  set<T>(key: string, value: T, ttl?: number): boolean {
    return cache.set(key, value, ttl ?? 300);
  },

  del(key: string): number {
    return cache.del(key);
  },

  flush(): void {
    cache.flushAll();
  },

  has(key: string): boolean {
    return cache.has(key);
  },
};

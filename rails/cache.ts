import { RailsApplication } from "./railsApplication";

/** Interface để ứng dụng có thể chọn công nghệ cache (Memory, Redis, Memcached...) */
export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): boolean;
  del(key: string): number;
  flush(): void;
  has(key: string): boolean;
}

export const Cache = {
  get<T>(key: string): T | undefined {
    return RailsApplication.cacheStore?.get<T>(key);
  },

  set<T>(key: string, value: T, ttl?: number): boolean {
    return RailsApplication.cacheStore?.set(key, value, ttl) ?? false;
  },

  del(key: string): number {
    return RailsApplication.cacheStore?.del(key) ?? 0;
  },

  flush(): void {
    RailsApplication.cacheStore?.flush();
  },

  has(key: string): boolean {
    return RailsApplication.cacheStore?.has(key) ?? false;
  },
};

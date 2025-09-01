interface CacheEntry {
  value: string;
  timestamp: number;
  ttl: number;
}

interface ImageCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  clear(): Promise<void>;
}

export class ImageCacheManager implements ImageCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly defaultTTL: number = 3600; // 1 hour in seconds
  private readonly maxMemoryEntries: number = 100;

  constructor(defaultTTL?: number) {
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
    
    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanExpiredEntries(), 5 * 60 * 1000);
  }

  async get(key: string): Promise<string | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.value;
    }

    // Remove expired memory entry
    if (memoryEntry && this.isExpired(memoryEntry)) {
      this.memoryCache.delete(key);
    }

    // Check localStorage
    try {
      const localStorageValue = localStorage.getItem(`image_cache_${key}`);
      if (localStorageValue) {
        const entry: CacheEntry = JSON.parse(localStorageValue);
        if (!this.isExpired(entry)) {
          // Restore to memory cache for faster access
          this.memoryCache.set(key, entry);
          return entry.value;
        } else {
          // Remove expired localStorage entry
          localStorage.removeItem(`image_cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  async set(key: string, value: string, ttl: number = this.defaultTTL): Promise<void> {
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);
    
    // Enforce memory cache size limit
    if (this.memoryCache.size > this.maxMemoryEntries) {
      this.evictOldestMemoryEntry();
    }

    // Store in localStorage
    try {
      localStorage.setItem(`image_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
      // Continue without localStorage if it fails
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear localStorage entries
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('image_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanExpiredEntries(): void {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('image_cache_')) {
          try {
            const entry: CacheEntry = JSON.parse(localStorage.getItem(key)!);
            if (this.isExpired(entry)) {
              keysToRemove.push(key);
            }
          } catch {
            // Remove invalid entries
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clean localStorage:', error);
    }
  }

  private evictOldestMemoryEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  // Utility methods for cache statistics
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  getLocalStorageCacheSize(): number {
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('image_cache_')) {
          count++;
        }
      }
    } catch (error) {
      console.warn('Failed to count localStorage entries:', error);
    }
    return count;
  }
}
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageCacheManager } from '../services/imageCacheManager';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ImageCacheManager', () => {
  let cacheManager: ImageCacheManager;

  beforeEach(() => {
    cacheManager = new ImageCacheManager(60); // 1 minute TTL for testing
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Memory Cache', () => {
    it('should store and retrieve values from memory cache', async () => {
      await cacheManager.set('test-key', 'test-value');
      const result = await cacheManager.get('test-key');
      
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non-existent');
      
      expect(result).toBeNull();
    });

    it('should respect TTL and expire entries', async () => {
      vi.useFakeTimers();
      
      await cacheManager.set('test-key', 'test-value', 1); // 1 second TTL
      
      // Should be available immediately
      let result = await cacheManager.get('test-key');
      expect(result).toBe('test-value');
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(2000);
      
      // Should be expired
      result = await cacheManager.get('test-key');
      expect(result).toBeNull();
      
      vi.useRealTimers();
    });

    it('should enforce memory cache size limit', async () => {
      const smallCacheManager = new ImageCacheManager();
      
      // Fill cache beyond limit (assuming 100 is the limit)
      for (let i = 0; i < 105; i++) {
        await smallCacheManager.set(`key-${i}`, `value-${i}`);
      }
      
      expect(smallCacheManager.getMemoryCacheSize()).toBeLessThanOrEqual(100);
    });
  });

  describe('LocalStorage Integration', () => {
    it('should store values in localStorage', async () => {
      await cacheManager.set('test-key', 'test-value');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'image_cache_test-key',
        expect.stringContaining('test-value')
      );
    });

    it('should retrieve values from localStorage when not in memory', async () => {
      const cacheEntry = {
        value: 'test-value',
        timestamp: Date.now(),
        ttl: 60000
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheEntry));
      
      const result = await cacheManager.get('test-key');
      
      expect(result).toBe('test-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('image_cache_test-key');
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw error
      await expect(cacheManager.set('test-key', 'test-value')).resolves.toBeUndefined();
    });

    it('should remove expired entries from localStorage', async () => {
      const expiredEntry = {
        value: 'test-value',
        timestamp: Date.now() - 120000, // 2 minutes ago
        ttl: 60000 // 1 minute TTL
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredEntry));
      
      const result = await cacheManager.get('test-key');
      
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('image_cache_test-key');
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache entries', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      
      localStorageMock.length = 3;
      localStorageMock.key.mockImplementation((index) => {
        const keys = ['image_cache_key1', 'image_cache_key2', 'other_key'];
        return keys[index];
      });
      
      await cacheManager.clear();
      
      expect(cacheManager.getMemoryCacheSize()).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('image_cache_key1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('image_cache_key2');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');
    });

    it('should provide cache statistics', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      
      expect(cacheManager.getMemoryCacheSize()).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed localStorage entries', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const result = await cacheManager.get('test-key');
      
      expect(result).toBeNull();
    });

    it('should handle localStorage read errors', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      const result = await cacheManager.get('test-key');
      
      expect(result).toBeNull();
    });
  });
});
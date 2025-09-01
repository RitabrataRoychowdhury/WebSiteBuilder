// Unit tests for ImageConfigManager

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageConfigManager } from '../services/imageConfigManager';

// Mock environment variables
const mockEnv = {
  VITE_ENABLE_IMAGE_PROCESSING: 'true',
  VITE_UNSPLASH_ACCESS_KEY: 'test-access-key',
  VITE_UNSPLASH_SECRET_KEY: 'test-secret-key',
  VITE_UNSPLASH_APPLICATION_ID: '12345',
  VITE_MAX_CONCURRENT_IMAGE_REQUESTS: '5',
  VITE_IMAGE_CACHE_TTL: '3600',
  VITE_IMAGE_REQUEST_TIMEOUT: '10000',
  VITE_UNSPLASH_REQUESTS_PER_HOUR: '50',
  VITE_UNSPLASH_REQUESTS_PER_MINUTE: '50'
};

describe('ImageConfigManager', () => {
  beforeEach(() => {
    // Reset singleton instance
    (ImageConfigManager as any).instance = undefined;
    
    // Mock import.meta.env
    Object.defineProperty(import.meta, 'env', {
      value: { ...mockEnv },
      writable: true,
      configurable: true
    });
  });

  describe('getInstance', () => {
    it('should create a singleton instance', () => {
      const instance1 = ImageConfigManager.getInstance();
      const instance2 = ImageConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getImageProcessingConfig', () => {
    it('should return default configuration', () => {
      const manager = ImageConfigManager.getInstance();
      const config = manager.getImageProcessingConfig();
      
      expect(config).toEqual({
        provider: 'unsplash',
        enableCache: true,
        enableLazyLoading: true,
        fallbackStrategy: 'placeholder',
        maxConcurrentRequests: 5,
        timeout: 10000,
        cacheTTL: 3600
      });
    });

    it('should parse environment variables correctly', () => {
      // Reset singleton instance
      (ImageConfigManager as any).instance = undefined;
      
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...mockEnv,
          VITE_MAX_CONCURRENT_IMAGE_REQUESTS: '10',
          VITE_IMAGE_CACHE_TTL: '7200',
          VITE_ENABLE_IMAGE_CACHE: 'false'
        },
        writable: true,
        configurable: true
      });

      const manager = ImageConfigManager.getInstance();
      const config = manager.getImageProcessingConfig();
      
      expect(config.maxConcurrentRequests).toBe(10);
      expect(config.cacheTTL).toBe(7200);
      expect(config.enableCache).toBe(false);
    });
  });

  describe('getUnsplashConfig', () => {
    it('should return Unsplash configuration', () => {
      const manager = ImageConfigManager.getInstance();
      const config = manager.getUnsplashConfig();
      
      expect(config).toEqual({
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key',
        applicationId: '12345',
        rateLimit: {
          requestsPerHour: 50,
          requestsPerMinute: 50
        },
        defaultImageSize: {
          width: 800,
          height: 600,
          quality: 'medium'
        },
        cacheTTL: 3600
      });
    });

    it('should throw error when credentials are missing', () => {
      // Reset singleton instance
      (ImageConfigManager as any).instance = undefined;
      
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...mockEnv,
          VITE_UNSPLASH_ACCESS_KEY: undefined
        },
        writable: true,
        configurable: true
      });

      expect(() => {
        ImageConfigManager.getInstance();
      }).toThrow('Missing Unsplash API credentials');
    });
  });

  describe('isImageProcessingEnabled', () => {
    it('should return true when enabled with valid credentials', () => {
      const manager = ImageConfigManager.getInstance();
      
      expect(manager.isImageProcessingEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      // Reset singleton instance
      (ImageConfigManager as any).instance = undefined;
      
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...mockEnv,
          VITE_ENABLE_IMAGE_PROCESSING: 'false'
        },
        writable: true,
        configurable: true
      });

      const manager = ImageConfigManager.getInstance();
      
      expect(manager.isImageProcessingEnabled()).toBe(false);
    });

    it('should return false when credentials are missing', () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            ...mockEnv,
            VITE_UNSPLASH_ACCESS_KEY: undefined
          }
        }
      });

      expect(() => {
        const manager = ImageConfigManager.getInstance();
        manager.isImageProcessingEnabled();
      }).toThrow();
    });
  });

  describe('hasValidUnsplashCredentials', () => {
    it('should return true with all credentials present', () => {
      const manager = ImageConfigManager.getInstance();
      
      expect(manager.hasValidUnsplashCredentials()).toBe(true);
    });

    it('should return false with missing access key', () => {
      // Reset singleton instance
      (ImageConfigManager as any).instance = undefined;
      
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...mockEnv,
          VITE_UNSPLASH_ACCESS_KEY: undefined
        },
        writable: true,
        configurable: true
      });

      expect(() => {
        ImageConfigManager.getInstance();
      }).toThrow();
    });
  });

  describe('validateConfiguration', () => {
    it('should return valid for correct configuration', () => {
      const manager = ImageConfigManager.getInstance();
      const validation = manager.validateConfiguration();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for invalid configuration', () => {
      // Reset singleton instance
      (ImageConfigManager as any).instance = undefined;
      
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...mockEnv,
          VITE_MAX_CONCURRENT_IMAGE_REQUESTS: '25', // Too high
          VITE_IMAGE_REQUEST_TIMEOUT: '500', // Too low
          VITE_IMAGE_CACHE_TTL: '30' // Too low
        },
        writable: true,
        configurable: true
      });

      const manager = ImageConfigManager.getInstance();
      const validation = manager.validateConfiguration();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Max concurrent requests must be between 1 and 20');
      expect(validation.errors).toContain('Timeout must be between 1000ms and 60000ms');
      expect(validation.errors).toContain('Cache TTL must be between 60 seconds and 24 hours');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const manager = ImageConfigManager.getInstance();
      
      manager.updateConfig({
        maxConcurrentRequests: 8,
        enableCache: false
      });
      
      const config = manager.getImageProcessingConfig();
      expect(config.maxConcurrentRequests).toBe(8);
      expect(config.enableCache).toBe(false);
    });
  });
});
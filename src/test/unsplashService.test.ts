// Unit tests for UnsplashService

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnsplashService } from '../services/unsplashService';
import { UnsplashConfig, ImageError, ImageProcessingError } from '../types/image';

// Mock fetch globally
global.fetch = vi.fn();

describe('UnsplashService', () => {
  let unsplashService: UnsplashService;
  let mockConfig: UnsplashConfig;

  beforeEach(() => {
    mockConfig = {
      accessKey: 'test-access-key-12345678901234567890',
      secretKey: 'test-secret-key',
      applicationId: 'test-app-id',
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
    };

    unsplashService = new UnsplashService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchImages', () => {
    it('should successfully search for images', async () => {
      const mockResponse = {
        results: [
          {
            id: 'test-id-1',
            urls: {
              regular: 'https://example.com/image1.jpg',
              thumb: 'https://example.com/thumb1.jpg'
            },
            width: 800,
            height: 600,
            alt_description: 'Test image 1',
            user: {
              name: 'Test Photographer',
              links: {
                html: 'https://example.com/photographer'
              }
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const results = await unsplashService.searchImages('nature');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'test-id-1',
        url: 'https://example.com/image1.jpg',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        width: 800,
        height: 600,
        altText: 'Test image 1',
        photographer: 'Test Photographer',
        photographerUrl: 'https://example.com/photographer'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.unsplash.com/search/photos'),
        expect.objectContaining({
          headers: {
            'Authorization': 'Client-ID test-access-key-12345678901234567890',
            'Accept-Version': 'v1'
          }
        })
      );
    });

    it('should throw error for empty query', async () => {
      await expect(unsplashService.searchImages('')).rejects.toThrow(ImageProcessingError);
      await expect(unsplashService.searchImages('   ')).rejects.toThrow(ImageProcessingError);
    });

    it('should handle API rate limit error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      await expect(unsplashService.searchImages('nature')).rejects.toThrow(
        expect.objectContaining({
          type: ImageError.API_RATE_LIMIT,
          retryable: true
        })
      );
    });

    it('should handle invalid API key error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(unsplashService.searchImages('nature')).rejects.toThrow(
        expect.objectContaining({
          type: ImageError.INVALID_API_KEY,
          retryable: false
        })
      );
    });

    it('should handle quota exceeded error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Quota exceeded')
      });

      await expect(unsplashService.searchImages('nature')).rejects.toThrow(
        expect.objectContaining({
          type: ImageError.QUOTA_EXCEEDED,
          retryable: false
        })
      );
    });

    it('should handle invalid response format', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      await expect(unsplashService.searchImages('nature')).rejects.toThrow(
        expect.objectContaining({
          type: ImageError.INVALID_RESPONSE
        })
      );
    });

    it('should use search options correctly', async () => {
      const mockResponse = {
        results: []
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await unsplashService.searchImages('nature', {
        count: 5,
        orientation: 'portrait',
        category: 'nature'
      });

      const fetchCall = (fetch as any).mock.calls[0];
      const url = new URL(fetchCall[0]);
      
      expect(url.searchParams.get('per_page')).toBe('5');
      expect(url.searchParams.get('orientation')).toBe('portrait');
      expect(url.searchParams.get('category')).toBe('nature');
    });
  });

  describe('getImageUrl', () => {
    it('should successfully get image URL', async () => {
      const mockResponse = {
        urls: {
          regular: 'https://example.com/image.jpg',
          raw: 'https://example.com/image-raw.jpg'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const url = await unsplashService.getImageUrl('test-id');

      expect(url).toBe('https://example.com/image.jpg');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.unsplash.com/photos/test-id',
        expect.objectContaining({
          headers: {
            'Authorization': 'Client-ID test-access-key-12345678901234567890',
            'Accept-Version': 'v1'
          }
        })
      );
    });

    it('should return sized URL when size is specified', async () => {
      const mockResponse = {
        urls: {
          regular: 'https://example.com/image.jpg',
          raw: 'https://example.com/image-raw.jpg'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const url = await unsplashService.getImageUrl('test-id', {
        width: 400,
        height: 300,
        quality: 'high'
      });

      expect(url).toBe('https://example.com/image-raw.jpg&w=400&h=300&q=100&fit=crop');
    });

    it('should throw error for empty image ID', async () => {
      await expect(unsplashService.getImageUrl('')).rejects.toThrow(
        expect.objectContaining({
          type: ImageError.IMAGE_NOT_FOUND,
          retryable: false
        })
      );
    });

    it('should handle 404 error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not found')
      });

      await expect(unsplashService.getImageUrl('invalid-id')).rejects.toThrow(
        expect.objectContaining({
          type: ImageError.IMAGE_NOT_FOUND,
          retryable: false
        })
      );
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider info', () => {
      const info = unsplashService.getProviderInfo();

      expect(info).toEqual({
        name: 'Unsplash',
        version: '1.0.0',
        rateLimit: mockConfig.rateLimit
      });
    });
  });
});
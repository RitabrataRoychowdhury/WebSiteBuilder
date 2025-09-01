import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageProcessorService } from '../services/imageProcessorService';
import { ImageProvider, ImageResult } from '../types/image';
import { WebsiteRequest, GeneratedWebsite } from '../types';

// Mock ImageProvider
class MockImageProvider implements ImageProvider {
  async searchImages(query: string): Promise<ImageResult[]> {
    return [
      {
        id: `mock-${query}`,
        url: `https://example.com/images/${query}.jpg`,
        thumbnailUrl: `https://example.com/thumbs/${query}.jpg`,
        width: 800,
        height: 600,
        altText: `Mock image for ${query}`,
        photographer: 'Mock Photographer',
        photographerUrl: 'https://example.com/photographer'
      }
    ];
  }

  async getImageUrl(imageId: string): Promise<string> {
    return `https://example.com/images/${imageId}.jpg`;
  }

  getProviderInfo() {
    return {
      name: 'Mock Provider',
      baseUrl: 'https://example.com',
      rateLimit: { requestsPerHour: 100, requestsPerMinute: 10 }
    };
  }
}

describe('ImageProcessorService', () => {
  let imageProcessor: ImageProcessorService;
  let mockProvider: MockImageProvider;

  beforeEach(() => {
    mockProvider = new MockImageProvider();
    imageProcessor = new ImageProcessorService(mockProvider, {
      enableCache: true,
      enableLazyLoading: true,
      fallbackStrategy: 'placeholder',
      maxConcurrentRequests: 3,
      timeout: 5000
    });
  });

  describe('processWebsite', () => {
    it('should process website with images successfully', async () => {
      const website: GeneratedWebsite = {
        html: `
          <html>
            <body>
              <div class="hero">
                <h1>Welcome</h1>
                <img src="placeholder.jpg" alt="hero image" width="800" height="400" />
              </div>
              <div class="about">
                <h2>About Us</h2>
                <img src="placeholder.jpg" alt="about image" width="400" height="300" />
              </div>
            </body>
          </html>
        `,
        css: 'body { margin: 0; }',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Business Website',
        description: 'Professional services',
        type: 'business'
      };

      const result = await imageProcessor.processWebsite(website, request);

      expect(result.imageMetadata.totalImages).toBe(2);
      expect(result.imageMetadata.processedImages).toBeGreaterThan(0);
      expect(result.html).toContain('https://example.com/images/');
      expect(result.html).toContain('loading="lazy"'); // Lazy loading enabled
    });

    it('should handle websites with no images', async () => {
      const website: GeneratedWebsite = {
        html: '<html><body><h1>No Images Here</h1></body></html>',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Simple Website'
      };

      const result = await imageProcessor.processWebsite(website, request);

      expect(result.imageMetadata.totalImages).toBe(0);
      expect(result.imageMetadata.processedImages).toBe(0);
      expect(result.html).toBe(website.html);
    });

    it('should use fallback images when provider fails', async () => {
      // Mock provider to fail
      vi.spyOn(mockProvider, 'searchImages').mockRejectedValue(new Error('API Error'));

      const website: GeneratedWebsite = {
        html: '<img src="placeholder.jpg" alt="test" width="400" height="300" />',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      const result = await imageProcessor.processWebsite(website, request);

      expect(result.imageMetadata.totalImages).toBe(1);
      expect(result.imageMetadata.failedImages).toBe(1);
      expect(result.html).toContain('data:image/svg+xml;base64,'); // Fallback SVG
    });

    it('should respect concurrency limits', async () => {
      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      vi.spyOn(mockProvider, 'searchImages').mockImplementation(async (query) => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        
        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        concurrentCalls--;
        return [
          {
            id: `mock-${query}`,
            url: `https://example.com/images/${query}.jpg`,
            thumbnailUrl: `https://example.com/thumbs/${query}.jpg`,
            width: 800,
            height: 600,
            altText: `Mock image for ${query}`,
            photographer: 'Mock Photographer'
          }
        ];
      });

      const website: GeneratedWebsite = {
        html: Array.from({ length: 10 }, (_, i) => 
          `<img src="placeholder${i}.jpg" alt="image ${i}" />`
        ).join(''),
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      await imageProcessor.processWebsite(website, request);

      expect(maxConcurrentCalls).toBeLessThanOrEqual(3); // Respects maxConcurrentRequests
    });
  });

  describe('extractImageQueries', () => {
    it('should extract queries from both HTML and request', () => {
      const html = `
        <h1>Business Solutions</h1>
        <img alt="team meeting" />
        <div class="services">Services</div>
      `;

      const request: WebsiteRequest = {
        title: 'Corporate Website',
        description: 'Professional consulting',
        features: ['portfolio', 'contact form']
      };

      const queries = imageProcessor.extractImageQueries(html, request);

      expect(queries).toContain('Corporate Website');
      expect(queries).toContain('Professional consulting');
      expect(queries).toContain('Business Solutions');
      expect(queries).toContain('team meeting');
      expect(queries).toContain('services');
    });
  });

  describe('replaceImagePlaceholders', () => {
    it('should replace images based on query mapping', () => {
      const html = `
        <img src="placeholder.jpg" alt="hero image" class="hero-img" />
        <img src="placeholder.jpg" alt="about image" class="about-img" />
      `;

      const imageMap = new Map([
        ['hero', 'https://example.com/hero.jpg'],
        ['about', 'https://example.com/about.jpg']
      ]);

      const result = imageProcessor.replaceImagePlaceholders(html, imageMap);

      expect(result).toContain('https://example.com/hero.jpg');
      expect(result).toContain('https://example.com/about.jpg');
    });

    it('should handle images without matching queries', () => {
      const html = '<img src="placeholder.jpg" alt="random image" />';
      const imageMap = new Map([['hero', 'https://example.com/hero.jpg']]);

      const result = imageProcessor.replaceImagePlaceholders(html, imageMap);

      expect(result).toBe(html); // Should remain unchanged
    });
  });

  describe('Error Handling', () => {
    it('should handle provider timeout gracefully', async () => {
      // Mock provider with long delay
      vi.spyOn(mockProvider, 'searchImages').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
        return [];
      });

      const processor = new ImageProcessorService(mockProvider, {
        timeout: 100 // 100ms timeout
      });

      const website: GeneratedWebsite = {
        html: '<img src="placeholder.jpg" alt="test" />',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      const result = await processor.processWebsite(website, request);

      expect(result.imageMetadata.failedImages).toBe(1);
      expect(result.html).toContain('data:image/svg+xml;base64,'); // Should use fallback
    });

    it('should handle malformed HTML gracefully', async () => {
      const website: GeneratedWebsite = {
        html: '<img src="test.jpg" alt="unclosed tag',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      const result = await imageProcessor.processWebsite(website, request);

      expect(result.imageMetadata).toBeDefined();
      expect(result.html).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should use cached results when available', async () => {
      const searchSpy = vi.spyOn(mockProvider, 'searchImages');

      const website: GeneratedWebsite = {
        html: '<img src="placeholder.jpg" alt="business" />',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Business Website'
      };

      // First call
      const result1 = await imageProcessor.processWebsite(website, request);
      expect(searchSpy).toHaveBeenCalled();

      // Reset spy
      searchSpy.mockClear();

      // Second call with same content
      const result2 = await imageProcessor.processWebsite(website, request);
      
      expect(result2.imageMetadata.cacheHits).toBeGreaterThan(0);
    });

    it('should work with caching disabled', async () => {
      const processor = new ImageProcessorService(mockProvider, {
        enableCache: false
      });

      const website: GeneratedWebsite = {
        html: '<img src="placeholder.jpg" alt="test" />',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      const result = await processor.processWebsite(website, request);

      expect(result.imageMetadata.cacheHits).toBe(0);
    });
  });

  describe('Lazy Loading', () => {
    it('should add lazy loading attributes when enabled', async () => {
      const website: GeneratedWebsite = {
        html: '<html><body><img src="placeholder.jpg" alt="test" /></body></html>',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      const result = await imageProcessor.processWebsite(website, request);

      expect(result.html).toContain('loading="lazy"');
      expect(result.html).toContain('<script>'); // Lazy loading script
      expect(result.html).toContain('IntersectionObserver');
    });

    it('should not add lazy loading when disabled', async () => {
      const processor = new ImageProcessorService(mockProvider, {
        enableLazyLoading: false
      });

      const website: GeneratedWebsite = {
        html: '<html><body><img src="placeholder.jpg" alt="test" /></body></html>',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Test Website'
      };

      const result = await processor.processWebsite(website, request);

      expect(result.html).not.toContain('loading="lazy"');
      expect(result.html).not.toContain('IntersectionObserver');
    });
  });
});
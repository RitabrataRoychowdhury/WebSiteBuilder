import { describe, it, expect, beforeEach } from 'vitest';
import { ImageProcessorService } from '../../services/imageProcessorService';
import { ImageCacheManager } from '../../services/imageCacheManager';
import { QueryExtractor } from '../../services/queryExtractor';
import { FallbackHandler } from '../../services/fallbackHandler';
import { ImageProvider, ImageResult } from '../../types/image';
import { WebsiteRequest, GeneratedWebsite } from '../../types';

// Mock ImageProvider for integration testing
class IntegrationMockProvider implements ImageProvider {
  private shouldFail: boolean = false;
  private delay: number = 0;

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  setDelay(ms: number) {
    this.delay = ms;
  }

  async searchImages(query: string): Promise<ImageResult[]> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('Mock provider failure');
    }

    return [
      {
        id: `integration-${query.replace(/\s+/g, '-')}`,
        url: `https://integration-test.com/images/${encodeURIComponent(query)}.jpg`,
        thumbnailUrl: `https://integration-test.com/thumbs/${encodeURIComponent(query)}.jpg`,
        width: 800,
        height: 600,
        altText: `Integration test image for ${query}`,
        photographer: 'Integration Test Photographer',
        photographerUrl: 'https://integration-test.com/photographer'
      }
    ];
  }

  async getImageUrl(imageId: string): Promise<string> {
    return `https://integration-test.com/images/${imageId}.jpg`;
  }

  getProviderInfo() {
    return {
      name: 'Integration Test Provider',
      version: '1.0.0',
      rateLimit: { requestsPerHour: 1000, requestsPerMinute: 100 }
    };
  }
}

describe('Image Processing Integration', () => {
  let mockProvider: IntegrationMockProvider;
  let imageProcessor: ImageProcessorService;
  let cacheManager: ImageCacheManager;

  let fallbackHandler: FallbackHandler;

  beforeEach(() => {
    mockProvider = new IntegrationMockProvider();
    imageProcessor = new ImageProcessorService(mockProvider, {
      enableCache: true,
      enableLazyLoading: true,
      fallbackStrategy: 'placeholder',
      maxConcurrentRequests: 3,
      timeout: 5000
    });
    
    cacheManager = new ImageCacheManager();

    fallbackHandler = new FallbackHandler();
  });

  describe('End-to-End Image Processing', () => {
    it('should process a complete business website with multiple images', async () => {
      const website: GeneratedWebsite = {
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Business Solutions Inc.</title>
            </head>
            <body>
              <header class="hero">
                <h1>Welcome to Business Solutions</h1>
                <img src="placeholder-hero.jpg" alt="hero image" width="1200" height="600" />
              </header>
              
              <section class="about">
                <h2>About Our Company</h2>
                <p>We provide excellent business consulting services to help your company grow.</p>
                <img src="placeholder-about.jpg" alt="about us" width="400" height="300" />
              </section>
              
              <section class="services">
                <h2>Our Services</h2>
                <div class="service-grid">
                  <div class="service-item">
                    <img src="placeholder-service1.jpg" alt="consulting service" width="300" height="200" />
                    <h3>Business Consulting</h3>
                  </div>
                  <div class="service-item">
                    <img src="placeholder-service2.jpg" alt="strategy service" width="300" height="200" />
                    <h3>Strategic Planning</h3>
                  </div>
                </div>
              </section>
              
              <footer class="contact">
                <h2>Contact Us</h2>
                <img src="placeholder-contact.jpg" alt="contact information" width="500" height="300" />
              </footer>
            </body>
          </html>
        `,
        css: `
          body { font-family: Arial, sans-serif; }
          .hero { background: #f0f0f0; padding: 2rem; }
          .service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        `,
        js: `
          console.log('Business website loaded');
        `
      };

      const request: WebsiteRequest = {
        title: 'Business Solutions Inc.',
        description: 'Professional business consulting and strategic planning services',
        type: 'business',
        colorScheme: 'blue',
        style: 'corporate',
        features: ['consulting', 'strategic planning', 'business growth']
      };

      const result = await imageProcessor.processWebsite(website, request);

      // Verify metadata
      expect(result.imageMetadata.totalImages).toBe(5);
      expect(result.imageMetadata.processedImages).toBe(5);
      expect(result.imageMetadata.failedImages).toBe(0);
      expect(result.imageMetadata.processingTime).toBeGreaterThan(0);

      // Verify images were replaced
      expect(result.html).toContain('https://integration-test.com/images/');
      expect(result.html).not.toContain('placeholder-hero.jpg');
      expect(result.html).not.toContain('placeholder-about.jpg');
      expect(result.html).not.toContain('placeholder-service1.jpg');
      expect(result.html).not.toContain('placeholder-service2.jpg');
      expect(result.html).not.toContain('placeholder-contact.jpg');

      // Verify lazy loading was added
      expect(result.html).toContain('loading="lazy"');
      expect(result.html).toContain('IntersectionObserver');

      // Verify CSS and JS are preserved
      expect(result.css).toBe(website.css);
      expect(result.js).toBe(website.js);
    });

    it('should handle mixed success and failure scenarios gracefully', async () => {
      let callCount = 0;
      const originalSearchImages = mockProvider.searchImages.bind(mockProvider);
      
      mockProvider.searchImages = async (query: string) => {
        callCount++;
        // Fail every other call
        if (callCount % 2 === 0) {
          throw new Error('Simulated API failure');
        }
        return originalSearchImages(query);
      };

      const website: GeneratedWebsite = {
        html: `
          <div class="hero">
            <img src="placeholder1.jpg" alt="hero" width="800" height="400" />
          </div>
          <div class="about">
            <img src="placeholder2.jpg" alt="about" width="400" height="300" />
          </div>
          <div class="services">
            <img src="placeholder3.jpg" alt="services" width="600" height="300" />
          </div>
        `,
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Mixed Results Test',
        description: 'Testing mixed success and failure scenarios',
        type: 'business',
        colorScheme: 'gray',
        style: 'modern',
        features: ['testing']
      };

      const result = await imageProcessor.processWebsite(website, request);

      expect(result.imageMetadata.totalImages).toBe(3);
      expect(result.imageMetadata.processedImages).toBeGreaterThan(0);
      expect(result.imageMetadata.failedImages).toBeGreaterThan(0);
      
      // Should contain both real images and fallback SVGs
      expect(result.html).toMatch(/https:\/\/integration-test\.com\/images\/|data:image\/svg\+xml;base64,/);
    });

    it('should demonstrate caching effectiveness', async () => {
      let apiCallCount = 0;
      const originalSearchImages = mockProvider.searchImages.bind(mockProvider);
      
      mockProvider.searchImages = async (query: string) => {
        apiCallCount++;
        return originalSearchImages(query);
      };

      const website: GeneratedWebsite = {
        html: `
          <img src="placeholder1.jpg" alt="business meeting" />
          <img src="placeholder2.jpg" alt="business meeting" />
          <img src="placeholder3.jpg" alt="office space" />
        `,
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Caching Test',
        description: 'Testing caching effectiveness',
        type: 'business',
        colorScheme: 'blue',
        style: 'modern',
        features: ['caching']
      };

      // First processing
      await imageProcessor.processWebsite(website, request);
      const firstCallCount = apiCallCount;

      // Second processing with same content
      const result2 = await imageProcessor.processWebsite(website, request);
      const secondCallCount = apiCallCount;

      // Should have made fewer API calls on second run due to caching
      expect(secondCallCount).toBeLessThan(firstCallCount * 2);
      expect(result2.imageMetadata.cacheHits).toBeGreaterThan(0);
    });
  });

  describe('Component Integration', () => {
    it('should integrate QueryExtractor with ImageProcessor correctly', () => {
      const html = `
        <div class="hero">
          <h1>Professional Services</h1>
          <img src="placeholder.jpg" alt="team collaboration" />
        </div>
      `;

      const request: WebsiteRequest = {
        title: 'Consulting Firm',
        description: 'Expert business advice',
        type: 'business',
        colorScheme: 'blue',
        style: 'corporate',
        features: ['consulting', 'strategy']
      };

      const queries = imageProcessor.extractImageQueries(html, request);

      expect(queries).toContain('Consulting Firm');
      expect(queries).toContain('Expert business advice');
      expect(queries).toContain('Professional Services');
      expect(queries).toContain('team collaboration');
      expect(queries).toContain('consulting');
      expect(queries).toContain('strategy');
    });

    it('should integrate FallbackHandler with different contexts', () => {
      const heroFallback = fallbackHandler.getFallbackImage('hero', 1200, 600);
      const aboutFallback = fallbackHandler.getFallbackImage('about', 400, 500);
      const serviceFallback = fallbackHandler.getFallbackImage('services', 350, 250);

      expect(heroFallback).toContain('data:image/svg+xml;base64,');
      expect(aboutFallback).toContain('data:image/svg+xml;base64,');
      expect(serviceFallback).toContain('data:image/svg+xml;base64,');

      // Verify different dimensions
      const heroSvg = atob(heroFallback.split(',')[1]);
      const aboutSvg = atob(aboutFallback.split(',')[1]);
      
      expect(heroSvg).toContain('width="1200"');
      expect(heroSvg).toContain('height="600"');
      expect(aboutSvg).toContain('width="400"');
      expect(aboutSvg).toContain('height="500"');
    });

    it('should integrate CacheManager with realistic usage patterns', async () => {
      // Test cache with various TTL values
      await cacheManager.set('short-term', 'https://example.com/short.jpg', 1);
      await cacheManager.set('long-term', 'https://example.com/long.jpg', 3600);

      // Should retrieve both immediately
      expect(await cacheManager.get('short-term')).toBe('https://example.com/short.jpg');
      expect(await cacheManager.get('long-term')).toBe('https://example.com/long.jpg');

      // Wait for short-term to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Short-term should be expired, long-term should still exist
      expect(await cacheManager.get('short-term')).toBeNull();
      expect(await cacheManager.get('long-term')).toBe('https://example.com/long.jpg');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high concurrency without issues', async () => {
      const processor = new ImageProcessorService(mockProvider, {
        maxConcurrentRequests: 2 // Low limit to test concurrency control
      });

      const website: GeneratedWebsite = {
        html: Array.from({ length: 10 }, (_, i) => 
          `<img src="placeholder${i}.jpg" alt="image ${i}" />`
        ).join(''),
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Concurrency Test',
        description: 'Testing high concurrency scenarios',
        type: 'business',
        colorScheme: 'green',
        style: 'modern',
        features: ['performance']
      };

      const startTime = Date.now();
      const result = await processor.processWebsite(website, request);
      const endTime = Date.now();

      expect(result.imageMetadata.totalImages).toBe(10);
      expect(result.imageMetadata.processedImages).toBe(10);
      expect(endTime - startTime).toBeGreaterThan(0); // Should take some time due to concurrency limits
    });

    it('should handle provider timeouts gracefully', async () => {
      mockProvider.setDelay(100); // Set delay longer than timeout
      
      const processor = new ImageProcessorService(mockProvider, {
        timeout: 50 // Very short timeout
      });

      const website: GeneratedWebsite = {
        html: '<img src="placeholder.jpg" alt="test" width="400" height="300" />',
        css: '',
        js: ''
      };

      const request: WebsiteRequest = {
        title: 'Timeout Test',
        description: 'Testing timeout handling',
        type: 'business',
        colorScheme: 'red',
        style: 'modern',
        features: ['timeout']
      };

      const result = await processor.processWebsite(website, request);

      expect(result.imageMetadata.totalImages).toBe(1);
      expect(result.imageMetadata.failedImages).toBe(1);
      expect(result.html).toContain('data:image/svg+xml;base64,'); // Should use fallback
    });

    it('should maintain data integrity across all operations', async () => {
      const originalHtml = `
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>Test Website</h1>
            <img src="placeholder.jpg" alt="test image" width="400" height="300" />
            <p>Some content after the image.</p>
          </body>
        </html>
      `;

      const website: GeneratedWebsite = {
        html: originalHtml,
        css: 'body { margin: 0; }',
        js: 'console.log("test");'
      };

      const request: WebsiteRequest = {
        title: 'Data Integrity Test',
        description: 'Testing data integrity across operations',
        type: 'business',
        colorScheme: 'purple',
        style: 'modern',
        features: ['integrity']
      };

      const result = await imageProcessor.processWebsite(website, request);

      // Verify HTML structure is maintained
      expect(result.html).toContain('<html>');
      expect(result.html).toContain('<title>Test</title>');
      expect(result.html).toContain('<h1>Test Website</h1>');
      expect(result.html).toContain('<p>Some content after the image.</p>');
      expect(result.html).toContain('</html>');

      // Verify CSS and JS are unchanged
      expect(result.css).toBe(website.css);
      expect(result.js).toBe(website.js);

      // Verify image was processed
      expect(result.html).not.toContain('placeholder.jpg');
      expect(result.html).toContain('alt="test image"');
    });
  });
});
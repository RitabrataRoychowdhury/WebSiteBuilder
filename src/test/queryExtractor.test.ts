import { describe, it, expect } from 'vitest';
import { QueryExtractor } from '../services/queryExtractor';
import { WebsiteRequest } from '../types';

describe('QueryExtractor', () => {
  let queryExtractor: QueryExtractor;

  beforeEach(() => {
    queryExtractor = new QueryExtractor();
  });

  describe('extractFromWebsiteRequest', () => {
    it('should extract queries from basic website request', () => {
      const request: WebsiteRequest = {
        title: 'My Business Website',
        description: 'Professional consulting services',
        type: 'business',
        style: 'modern',
        features: ['contact form', 'portfolio gallery']
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);

      expect(queries).toContain('My Business Website');
      expect(queries).toContain('Professional consulting services');
      expect(queries).toContain('contact form');
      expect(queries).toContain('portfolio gallery');
      expect(queries).toContain('business website');
      expect(queries).toContain('modern design');
    });

    it('should add contextual terms based on website type', () => {
      const request: WebsiteRequest = {
        title: 'Restaurant Site',
        type: 'restaurant'
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);

      expect(queries).toContain('food');
      expect(queries).toContain('dining');
      expect(queries).toContain('kitchen');
    });

    it('should handle missing or undefined fields gracefully', () => {
      const request: WebsiteRequest = {
        title: 'Test Site'
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);

      expect(queries).toContain('Test Site');
      expect(queries.length).toBeGreaterThan(0);
    });

    it('should sanitize inappropriate content', () => {
      const request: WebsiteRequest = {
        title: 'Inappropriate content here',
        description: 'Some inappropriate terms'
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);

      // Should fallback to safe content
      expect(queries).toContain('business professional');
    });
  });

  describe('extractFromHTML', () => {
    it('should extract queries from HTML headings', () => {
      const html = `
        <html>
          <body>
            <h1>Welcome to Our Company</h1>
            <h2>Our Services</h2>
            <h3>Contact Information</h3>
          </body>
        </html>
      `;

      const queries = queryExtractor.extractFromHTML(html);

      expect(queries).toContain('Welcome to Our Company');
      expect(queries).toContain('Our Services');
      expect(queries).toContain('Contact Information');
    });

    it('should extract queries from alt attributes', () => {
      const html = `
        <img src="placeholder.jpg" alt="Team meeting in office" />
        <img src="placeholder.jpg" alt="Modern workspace design" />
      `;

      const queries = queryExtractor.extractFromHTML(html);

      expect(queries).toContain('Team meeting in office');
      expect(queries).toContain('Modern workspace design');
    });

    it('should identify semantic sections', () => {
      const html = `
        <div class="hero-section">Hero content</div>
        <section id="about">About content</section>
        <div class="features-grid">Features</div>
      `;

      const queries = queryExtractor.extractFromHTML(html);

      expect(queries).toContain('hero');
      expect(queries).toContain('about');
      expect(queries).toContain('features');
    });

    it('should extract meaningful text from paragraphs', () => {
      const html = `
        <p>We provide excellent customer service and support for all your business needs.</p>
        <p>Short text</p>
      `;

      const queries = queryExtractor.extractFromHTML(html);

      expect(queries).toContain('We provide excellent');
      expect(queries).not.toContain('Short text'); // Too short
    });

    it('should handle malformed HTML gracefully', () => {
      const html = `
        <h1>Unclosed heading
        <img alt="Missing closing tag"
        <div class="test">Content</div>
      `;

      const queries = queryExtractor.extractFromHTML(html);

      expect(queries.length).toBeGreaterThan(0);
    });
  });

  describe('generateContextualQueries', () => {
    it('should generate contextual variations', () => {
      const queries = queryExtractor.generateContextualQueries('office', 'business');

      expect(queries).toContain('office');
      expect(queries).toContain('office business');
      expect(queries).toContain('business office');
    });

    it('should add professional terms for business context', () => {
      const queries = queryExtractor.generateContextualQueries('business meeting');

      expect(queries).toContain('business meeting professional');
      expect(queries).toContain('business meeting business');
    });

    it('should add creative terms for creative context', () => {
      const queries = queryExtractor.generateContextualQueries('design portfolio');

      expect(queries).toContain('design portfolio design');
      expect(queries).toContain('design portfolio creative');
    });
  });

  describe('extractImageContext', () => {
    it('should extract context from surrounding HTML', () => {
      const html = `
        <section class="hero">
          <h1>Welcome to Our Company</h1>
          <img src="placeholder.jpg" alt="Hero image" />
        </section>
      `;

      const context = queryExtractor.extractImageContext(html, 0);

      expect(context).toBe('Welcome to Our Company');
    });

    it('should identify section context from class names', () => {
      const html = `
        <div class="about-section">
          <img src="placeholder.jpg" />
        </div>
      `;

      const context = queryExtractor.extractImageContext(html, 0);

      expect(context).toBe('about');
    });

    it('should return general context when no specific context found', () => {
      const html = `
        <div>
          <img src="placeholder.jpg" />
        </div>
      `;

      const context = queryExtractor.extractImageContext(html, 0);

      expect(context).toBe('general');
    });

    it('should handle out-of-bounds image index', () => {
      const html = `<img src="test.jpg" />`;

      const context = queryExtractor.extractImageContext(html, 5);

      expect(context).toBe('general');
    });
  });

  describe('Query Processing', () => {
    it('should clean and prioritize queries correctly', () => {
      const request: WebsiteRequest = {
        title: 'A',
        description: 'Much longer description with more words',
        features: ['short', 'medium length feature']
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);

      // Longer, more specific queries should come first
      expect(queries[0]).toBe('Much longer description with more words');
    });

    it('should limit queries to reasonable number', () => {
      const request: WebsiteRequest = {
        title: 'Test',
        features: Array.from({ length: 20 }, (_, i) => `Feature ${i}`)
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);

      expect(queries.length).toBeLessThanOrEqual(10);
    });

    it('should remove duplicates', () => {
      const request: WebsiteRequest = {
        title: 'Business Website',
        description: 'Business Website Services',
        type: 'business'
      };

      const queries = queryExtractor.extractFromWebsiteRequest(request);
      const uniqueQueries = [...new Set(queries)];

      expect(queries.length).toBe(uniqueQueries.length);
    });
  });
});
// Unit tests for LazyImageLoader

import { describe, it, expect } from 'vitest';
import { LazyImageLoader } from '../services/lazyImageLoader';

describe('LazyImageLoader', () => {
  describe('injectLazyLoading', () => {
    it('should convert img tags to lazy loading format', () => {
      const html = '<img src="test.jpg" alt="Test image">';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('data-src="test.jpg"');
      expect(result).toContain('class="lazy-image"');
      expect(result).toContain('loading="lazy"');
      expect(result).toContain('<style>');
      expect(result).toContain('<script>');
    });

    it('should preserve existing classes', () => {
      const html = '<img src="test.jpg" class="existing-class" alt="Test">';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('class="existing-class lazy-image"');
    });

    it('should skip images that already have lazy loading', () => {
      const html = '<img src="test.jpg" loading="lazy" data-src="original.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      // Should not modify already lazy images
      expect(result).toContain('src="test.jpg"');
      expect(result).toContain('data-src="original.jpg"');
    });

    it('should handle multiple images', () => {
      const html = `
        <img src="image1.jpg" alt="Image 1">
        <img src="image2.jpg" alt="Image 2">
      `;
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('data-src="image1.jpg"');
      expect(result).toContain('data-src="image2.jpg"');
      expect((result.match(/class="lazy-image"/g) || []).length).toBe(2);
    });

    it('should add CSS styles for lazy loading', () => {
      const html = '<img src="test.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('.lazy-image {');
      expect(result).toContain('transition: opacity');
      expect(result).toContain('.lazy-image.loaded {');
      expect(result).toContain('opacity: 1');
    });

    it('should add blur effect CSS when using blur placeholder', () => {
      const html = '<img src="test.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html, {
        placeholderStrategy: 'blur'
      });
      
      expect(result).toContain('filter: blur(5px)');
      expect(result).toContain('transform: scale(1.05)');
    });

    it('should add skeleton animation CSS when using skeleton placeholder', () => {
      const html = '<img src="test.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html, {
        placeholderStrategy: 'skeleton'
      });
      
      expect(result).toContain('background: linear-gradient');
      expect(result).toContain('@keyframes skeleton-loading');
    });

    it('should inject intersection observer script', () => {
      const html = '<img src="test.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('IntersectionObserver');
      expect(result).toContain('imageObserver.observe');
      expect(result).toContain('entry.isIntersecting');
    });

    it('should handle custom options', () => {
      const html = '<img src="test.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html, {
        rootMargin: '100px',
        threshold: 0.5,
        fadeInDuration: 500
      });
      
      expect(result).toContain('rootMargin: \'100px\'');
      expect(result).toContain('threshold: 0.5');
      expect(result).toContain('transition: opacity 500ms');
    });
  });

  describe('generateResponsiveSrcSet', () => {
    it('should generate srcset for different sizes', () => {
      const baseUrl = 'https://example.com/image.jpg';
      const sizes = [320, 640, 1024];
      const result = LazyImageLoader.generateResponsiveSrcSet(baseUrl, sizes);
      
      expect(result).toBe(
        'https://example.com/image.jpg&w=320 320w, ' +
        'https://example.com/image.jpg&w=640 640w, ' +
        'https://example.com/image.jpg&w=1024 1024w'
      );
    });
  });

  describe('addResponsiveImages', () => {
    it('should add srcset to lazy images', () => {
      const html = '<img data-src="https://example.com/image.jpg" alt="Test">';
      const result = LazyImageLoader.addResponsiveImages(html);
      
      expect(result).toContain('data-srcset=');
      expect(result).toContain('320w');
      expect(result).toContain('640w');
      expect(result).toContain('sizes=');
    });

    it('should use custom breakpoints', () => {
      const html = '<img data-src="https://example.com/image.jpg" alt="Test">';
      const result = LazyImageLoader.addResponsiveImages(html, [400, 800]);
      
      expect(result).toContain('400w');
      expect(result).toContain('800w');
      expect(result).not.toContain('320w');
    });

    it('should not add sizes if already present', () => {
      const html = '<img data-src="https://example.com/image.jpg" sizes="100vw" alt="Test">';
      const result = LazyImageLoader.addResponsiveImages(html);
      
      expect(result).toContain('sizes="100vw"');
      expect((result.match(/sizes=/g) || []).length).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle HTML without head tag', () => {
      const html = '<body><img src="test.jpg"></body>';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('<style>');
      expect(result.indexOf('<style>')).toBeLessThan(result.indexOf('<body>'));
    });

    it('should handle HTML without body tag', () => {
      const html = '<img src="test.jpg">';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('<script>');
      expect(result).toContain('</script>');
    });

    it('should handle empty HTML', () => {
      const html = '';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      expect(result).toContain('<style>');
      expect(result).toContain('<script>');
    });

    it('should handle malformed img tags gracefully', () => {
      const html = '<img src="test.jpg" alt="test>';
      const result = LazyImageLoader.injectLazyLoading(html);
      
      // Should still process the image
      expect(result).toContain('data-src="test.jpg"');
    });
  });
});
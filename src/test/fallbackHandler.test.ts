import { describe, it, expect } from 'vitest';
import { FallbackHandler } from '../services/fallbackHandler';

describe('FallbackHandler', () => {
  let fallbackHandler: FallbackHandler;

  beforeEach(() => {
    fallbackHandler = new FallbackHandler();
  });

  describe('getFallbackImage', () => {
    it('should return specific fallback for known contexts', () => {
      const heroFallback = fallbackHandler.getFallbackImage('hero');
      const aboutFallback = fallbackHandler.getFallbackImage('about');
      const featureFallback = fallbackHandler.getFallbackImage('feature');

      expect(heroFallback).toContain('data:image/svg+xml;base64,');
      expect(aboutFallback).toContain('data:image/svg+xml;base64,');
      expect(featureFallback).toContain('data:image/svg+xml;base64,');
      
      // Should be different for different contexts
      expect(heroFallback).not.toBe(aboutFallback);
    });

    it('should handle partial context matches', () => {
      const fallback = fallbackHandler.getFallbackImage('hero-section');
      
      expect(fallback).toContain('data:image/svg+xml;base64,');
    });

    it('should return default fallback for unknown contexts', () => {
      const fallback = fallbackHandler.getFallbackImage('unknown-context');
      
      expect(fallback).toContain('data:image/svg+xml;base64,');
    });

    it('should generate custom dimensions when specified', () => {
      const fallback = fallbackHandler.getFallbackImage('hero', 1200, 600);
      
      expect(fallback).toContain('data:image/svg+xml;base64,');
      
      // Decode and check if dimensions are correct
      const base64Data = fallback.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('width="1200"');
      expect(svgContent).toContain('height="600"');
    });
  });

  describe('generatePlaceholderSVG', () => {
    it('should generate valid SVG with specified dimensions', () => {
      const svg = fallbackHandler.generatePlaceholderSVG(400, 300, 'Test Image');
      
      expect(svg).toContain('data:image/svg+xml;base64,');
      
      const base64Data = svg.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('width="400"');
      expect(svgContent).toContain('height="300"');
      expect(svgContent).toContain('Test Image');
    });

    it('should handle missing text parameter', () => {
      const svg = fallbackHandler.generatePlaceholderSVG(200, 200);
      
      const base64Data = svg.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('Image'); // Default text
    });

    it('should scale font size based on dimensions', () => {
      const smallSvg = fallbackHandler.generatePlaceholderSVG(100, 100, 'Test');
      const largeSvg = fallbackHandler.generatePlaceholderSVG(800, 800, 'Test');
      
      const smallContent = atob(smallSvg.split(',')[1]);
      const largeContent = atob(largeSvg.split(',')[1]);
      
      // Font size should be different (smaller for small image, larger for large image)
      const smallFontMatch = smallContent.match(/font-size="(\d+(?:\.\d+)?)"/);
      const largeFontMatch = largeContent.match(/font-size="(\d+(?:\.\d+)?)"/);
      
      if (smallFontMatch && largeFontMatch) {
        const smallFont = parseFloat(smallFontMatch[1]);
        const largeFont = parseFloat(largeFontMatch[1]);
        expect(largeFont).toBeGreaterThan(smallFont);
      }
    });
  });

  describe('generateLoadingPlaceholder', () => {
    it('should generate animated loading placeholder', () => {
      const svg = fallbackHandler.generateLoadingPlaceholder(300, 200);
      
      expect(svg).toContain('data:image/svg+xml;base64,');
      
      const base64Data = svg.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('width="300"');
      expect(svgContent).toContain('height="200"');
      expect(svgContent).toContain('animateTransform'); // Should have animation
    });
  });

  describe('generateErrorPlaceholder', () => {
    it('should generate error placeholder with message', () => {
      const svg = fallbackHandler.generateErrorPlaceholder(400, 300, 'Load failed');
      
      expect(svg).toContain('data:image/svg+xml;base64,');
      
      const base64Data = svg.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('width="400"');
      expect(svgContent).toContain('height="300"');
      expect(svgContent).toContain('Load failed');
    });

    it('should use default error message when none provided', () => {
      const svg = fallbackHandler.generateErrorPlaceholder(200, 200);
      
      const base64Data = svg.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('Failed to load');
    });
  });

  describe('extractDimensionsFromImgTag', () => {
    it('should extract width and height from img tag', () => {
      const imgTag = '<img src="test.jpg" width="500" height="300" alt="test" />';
      const dimensions = fallbackHandler.extractDimensionsFromImgTag(imgTag);
      
      expect(dimensions.width).toBe(500);
      expect(dimensions.height).toBe(300);
    });

    it('should handle quoted attributes', () => {
      const imgTag = '<img src="test.jpg" width="400" height="200" />';
      const dimensions = fallbackHandler.extractDimensionsFromImgTag(imgTag);
      
      expect(dimensions.width).toBe(400);
      expect(dimensions.height).toBe(200);
    });

    it('should use defaults when dimensions not found', () => {
      const imgTag = '<img src="test.jpg" alt="test" />';
      const dimensions = fallbackHandler.extractDimensionsFromImgTag(imgTag);
      
      expect(dimensions.width).toBe(400);
      expect(dimensions.height).toBe(300);
    });

    it('should handle partial dimensions', () => {
      const imgTag = '<img src="test.jpg" width="600" />';
      const dimensions = fallbackHandler.extractDimensionsFromImgTag(imgTag);
      
      expect(dimensions.width).toBe(600);
      expect(dimensions.height).toBe(300); // Default
    });
  });

  describe('createResponsiveFallback', () => {
    it('should create landscape fallback for aspect ratio > 1', () => {
      const fallback = fallbackHandler.createResponsiveFallback('hero', 16/9);
      
      expect(fallback).toContain('data:image/svg+xml;base64,');
      
      const base64Data = fallback.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('width="500"');
      // Height should be 500 / (16/9) = ~281
      expect(svgContent).toMatch(/height="28[0-9]"/);
    });

    it('should create portrait fallback for aspect ratio < 1', () => {
      const fallback = fallbackHandler.createResponsiveFallback('about', 3/4);
      
      const base64Data = fallback.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('height="500"');
      // Width should be 500 * (3/4) = 375
      expect(svgContent).toContain('width="375"');
    });

    it('should handle square aspect ratio', () => {
      const fallback = fallbackHandler.createResponsiveFallback('feature', 1);
      
      const base64Data = fallback.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('width="500"');
      expect(svgContent).toContain('height="500"');
    });
  });

  describe('handleImageFailure', () => {
    it('should return placeholder for placeholder strategy', () => {
      const result = fallbackHandler.handleImageFailure('hero', 'placeholder');
      
      expect(result).toContain('data:image/svg+xml;base64,');
    });

    it('should return generic placeholder for generic strategy', () => {
      const result = fallbackHandler.handleImageFailure('hero', 'generic');
      
      expect(result).toContain('data:image/svg+xml;base64,');
      
      const base64Data = result!.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('Image'); // Generic text
    });

    it('should return null for none strategy', () => {
      const result = fallbackHandler.handleImageFailure('hero', 'none');
      
      expect(result).toBeNull();
    });

    it('should use custom dimensions when provided', () => {
      const result = fallbackHandler.handleImageFailure(
        'hero', 
        'placeholder', 
        { width: 800, height: 400 }
      );
      
      const base64Data = result!.split(',')[1];
      const svgContent = atob(base64Data);
      
      expect(svgContent).toContain('width="800"');
      expect(svgContent).toContain('height="400"');
    });
  });
});
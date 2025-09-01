// Lazy loading and progressive image loading implementation

export interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  enableProgressiveLoading?: boolean;
  placeholderStrategy?: 'blur' | 'skeleton' | 'none';
  fadeInDuration?: number;
}

export class LazyImageLoader {
  private static readonly DEFAULT_OPTIONS: Required<LazyLoadingOptions> = {
    rootMargin: '50px',
    threshold: 0.1,
    enableProgressiveLoading: true,
    placeholderStrategy: 'blur',
    fadeInDuration: 300
  };

  static injectLazyLoading(html: string, options: LazyLoadingOptions = {}): string {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Add lazy loading attributes to img tags
    let processedHtml = this.addLazyLoadingAttributes(html, config);
    
    // Add progressive loading CSS
    processedHtml = this.injectProgressiveLoadingCSS(processedHtml, config);
    
    // Add lazy loading script
    processedHtml = this.injectLazyLoadingScript(processedHtml, config);
    
    return processedHtml;
  }

  private static addLazyLoadingAttributes(html: string, config: Required<LazyLoadingOptions>): string {
    return html.replace(/<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, beforeSrc, srcValue, afterSrc) => {
      // Skip if already has lazy loading
      if (match.includes('loading="lazy"') || match.includes('data-src=')) {
        return match;
      }

      // Create placeholder based on strategy
      const placeholder = this.createPlaceholder(config.placeholderStrategy);
      
      // Build new img tag with lazy loading
      let newTag = `<img${beforeSrc}`;
      
      // Add placeholder src
      newTag += ` src="${placeholder}"`;
      
      // Add original src as data-src
      newTag += ` data-src="${srcValue}"`;
      
      // Add lazy loading class
      newTag += ` class="lazy-image${afterSrc.includes('class=') ? '' : '"'}`;
      if (afterSrc.includes('class=')) {
        newTag += afterSrc.replace(/class\s*=\s*["']([^"']*)["']/i, 'class="$1 lazy-image"');
      } else {
        newTag += `"${afterSrc}`;
      }
      
      // Add loading attribute
      if (!newTag.includes('loading=')) {
        newTag += ` loading="lazy"`;
      }
      
      newTag += '>';
      
      return newTag;
    });
  }

  private static createPlaceholder(strategy: 'blur' | 'skeleton' | 'none'): string {
    switch (strategy) {
      case 'blur':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNmNmY3ZjgiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNlZWVmZjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';
      case 'skeleton':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PGFuaW1hdGU+PC9hbmltYXRlPjwvc3ZnPg==';
      case 'none':
      default:
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }

  private static injectProgressiveLoadingCSS(html: string, config: Required<LazyLoadingOptions>): string {
    const css = `
      <style>
        .lazy-image {
          transition: opacity ${config.fadeInDuration}ms ease-in-out;
          opacity: 0;
        }
        
        .lazy-image.loaded {
          opacity: 1;
        }
        
        .lazy-image.loading {
          opacity: 0.5;
        }
        
        ${config.placeholderStrategy === 'blur' ? `
        .lazy-image:not(.loaded) {
          filter: blur(5px);
          transform: scale(1.05);
        }
        ` : ''}
        
        ${config.placeholderStrategy === 'skeleton' ? `
        .lazy-image:not(.loaded) {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
        
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        ` : ''}
        
        /* Responsive image optimization */
        .lazy-image {
          max-width: 100%;
          height: auto;
        }
        
        /* Performance optimizations */
        .lazy-image {
          will-change: opacity;
          backface-visibility: hidden;
        }
      </style>
    `;

    // Insert CSS in head or before closing head tag
    if (html.includes('</head>')) {
      return html.replace('</head>', `${css}</head>`);
    } else {
      // If no head tag, add at the beginning
      return css + html;
    }
  }

  private static injectLazyLoadingScript(html: string, config: Required<LazyLoadingOptions>): string {
    const script = `
      <script>
        (function() {
          'use strict';
          
          // Check for Intersection Observer support
          if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            document.querySelectorAll('.lazy-image[data-src]').forEach(function(img) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
            });
            return;
          }
          
          // Configuration
          const config = {
            rootMargin: '${config.rootMargin}',
            threshold: ${config.threshold}
          };
          
          // Create intersection observer
          const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
              }
            });
          }, config);
          
          // Image loading function with progressive enhancement
          function loadImage(img) {
            img.classList.add('loading');
            
            const tempImg = new Image();
            
            tempImg.onload = function() {
              img.src = tempImg.src;
              img.classList.remove('loading');
              img.classList.add('loaded');
              img.removeAttribute('data-src');
              
              // Dispatch custom event for analytics/tracking
              img.dispatchEvent(new CustomEvent('lazyImageLoaded', {
                detail: { src: img.src }
              }));
            };
            
            tempImg.onerror = function() {
              img.classList.remove('loading');
              img.classList.add('error');
              
              // Dispatch error event
              img.dispatchEvent(new CustomEvent('lazyImageError', {
                detail: { src: img.dataset.src }
              }));
            };
            
            tempImg.src = img.dataset.src;
          }
          
          // Initialize lazy loading when DOM is ready
          function initLazyLoading() {
            const lazyImages = document.querySelectorAll('.lazy-image[data-src]');
            lazyImages.forEach(function(img) {
              imageObserver.observe(img);
            });
          }
          
          // Start when DOM is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLazyLoading);
          } else {
            initLazyLoading();
          }
          
          // Handle dynamically added images
          const mutationObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                  const lazyImages = node.querySelectorAll ? 
                    node.querySelectorAll('.lazy-image[data-src]') : [];
                  
                  lazyImages.forEach(function(img) {
                    imageObserver.observe(img);
                  });
                  
                  // Check if the node itself is a lazy image
                  if (node.classList && node.classList.contains('lazy-image') && node.dataset.src) {
                    imageObserver.observe(node);
                  }
                }
              });
            });
          });
          
          mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
          });
          
        })();
      </script>
    `;

    // Insert script before closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${script}</body>`);
    } else {
      // If no body tag, add at the end
      return html + script;
    }
  }

  // Utility method to generate responsive image srcset
  static generateResponsiveSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}&w=${size} ${size}w`)
      .join(', ');
  }

  // Method to add responsive images support
  static addResponsiveImages(html: string, breakpoints: number[] = [320, 640, 768, 1024, 1280]): string {
    return html.replace(/<img([^>]*?)data-src\s*=\s*["']([^"']+)["']([^>]*?)>/gi, (match, beforeSrc, srcValue, afterSrc) => {
      // Generate srcset for responsive images
      const srcSet = this.generateResponsiveSrcSet(srcValue, breakpoints);
      
      // Add srcset and sizes attributes
      let newTag = match.replace(
        /data-src\s*=\s*["']([^"']+)["']/i,
        `data-src="$1" data-srcset="${srcSet}"`
      );
      
      // Add sizes attribute if not present
      if (!newTag.includes('sizes=')) {
        newTag = newTag.replace('<img', '<img sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"');
      }
      
      return newTag;
    });
  }
}
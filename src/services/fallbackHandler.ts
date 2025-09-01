export class FallbackHandler {
  private readonly fallbackImages: Map<string, string> = new Map();

  constructor() {
    this.initializeFallbackImages();
  }

  private initializeFallbackImages(): void {
    // Hero section fallback - landscape format
    this.fallbackImages.set('hero', this.generatePlaceholderSVG(800, 400, 'Hero Image'));
    
    // Feature section fallback - square format
    this.fallbackImages.set('feature', this.generatePlaceholderSVG(300, 300, 'Feature'));
    this.fallbackImages.set('features', this.generatePlaceholderSVG(300, 300, 'Feature'));
    
    // About section fallback - portrait format
    this.fallbackImages.set('about', this.generatePlaceholderSVG(400, 500, 'About'));
    
    // Services fallback - landscape format
    this.fallbackImages.set('services', this.generatePlaceholderSVG(350, 250, 'Service'));
    this.fallbackImages.set('service', this.generatePlaceholderSVG(350, 250, 'Service'));
    
    // Portfolio/Gallery fallback - square format
    this.fallbackImages.set('portfolio', this.generatePlaceholderSVG(400, 400, 'Portfolio'));
    this.fallbackImages.set('gallery', this.generatePlaceholderSVG(400, 400, 'Gallery'));
    
    // Contact fallback - landscape format
    this.fallbackImages.set('contact', this.generatePlaceholderSVG(500, 300, 'Contact'));
    
    // Generic fallback
    this.fallbackImages.set('general', this.generatePlaceholderSVG(400, 300, 'Image'));
    this.fallbackImages.set('default', this.generatePlaceholderSVG(400, 300, 'Image'));
  }

  getFallbackImage(context: string, width?: number, height?: number): string {
    const normalizedContext = context.toLowerCase().trim();
    
    // Try to find specific fallback
    if (this.fallbackImages.has(normalizedContext)) {
      const fallback = this.fallbackImages.get(normalizedContext)!;
      
      // If specific dimensions are requested, generate custom SVG
      if (width && height) {
        return this.generatePlaceholderSVG(width, height, this.getContextLabel(normalizedContext));
      }
      
      return fallback;
    }
    
    // Try partial matches
    for (const [key, value] of this.fallbackImages.entries()) {
      if (normalizedContext.includes(key) || key.includes(normalizedContext)) {
        if (width && height) {
          return this.generatePlaceholderSVG(width, height, this.getContextLabel(key));
        }
        return value;
      }
    }
    
    // Generate custom fallback with dimensions if provided
    if (width && height) {
      return this.generatePlaceholderSVG(width, height, 'Image');
    }
    
    // Return default fallback
    return this.fallbackImages.get('default')!;
  }

  generatePlaceholderSVG(width: number, height: number, text?: string): string {
    const displayText = text || 'Image';
    const fontSize = Math.min(width, height) / 8;
    const textColor = '#6B7280'; // Gray-500
    const backgroundColor = '#F3F4F6'; // Gray-100
    const borderColor = '#E5E7EB'; // Gray-200
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="2"/>
        <g transform="translate(${width/2}, ${height/2})">
          <!-- Camera icon -->
          <g transform="translate(0, -${fontSize/2})">
            <rect x="-${fontSize*0.8}" y="-${fontSize*0.4}" width="${fontSize*1.6}" height="${fontSize*0.8}" 
                  fill="none" stroke="${textColor}" stroke-width="2" rx="4"/>
            <circle cx="0" cy="0" r="${fontSize*0.25}" fill="none" stroke="${textColor}" stroke-width="2"/>
            <rect x="-${fontSize*0.15}" y="-${fontSize*0.6}" width="${fontSize*0.3}" height="${fontSize*0.2}" 
                  fill="${textColor}" rx="2"/>
          </g>
          <!-- Text -->
          <text x="0" y="${fontSize}" text-anchor="middle" font-family="Arial, sans-serif" 
                font-size="${fontSize*0.6}" fill="${textColor}" font-weight="500">
            ${displayText}
          </text>
        </g>
      </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  generateLoadingPlaceholder(width: number, height: number): string {
    const backgroundColor = '#F9FAFB'; // Gray-50
    const shimmerColor = '#E5E7EB'; // Gray-200
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${shimmerColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <animateTransform attributeName="gradientTransform" type="translate" 
                            values="-100 0;100 0;-100 0" dur="2s" repeatCount="indefinite"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#shimmer)"/>
      </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  generateErrorPlaceholder(width: number, height: number, errorMessage?: string): string {
    const fontSize = Math.min(width, height) / 10;
    const textColor = '#EF4444'; // Red-500
    const backgroundColor = '#FEF2F2'; // Red-50
    const borderColor = '#FECACA'; // Red-200
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="2"/>
        <g transform="translate(${width/2}, ${height/2})">
          <!-- Error icon (X) -->
          <g transform="translate(0, -${fontSize/2})">
            <circle cx="0" cy="0" r="${fontSize*0.6}" fill="none" stroke="${textColor}" stroke-width="3"/>
            <line x1="-${fontSize*0.3}" y1="-${fontSize*0.3}" x2="${fontSize*0.3}" y2="${fontSize*0.3}" 
                  stroke="${textColor}" stroke-width="3" stroke-linecap="round"/>
            <line x1="${fontSize*0.3}" y1="-${fontSize*0.3}" x2="-${fontSize*0.3}" y2="${fontSize*0.3}" 
                  stroke="${textColor}" stroke-width="3" stroke-linecap="round"/>
          </g>
          <!-- Error text -->
          <text x="0" y="${fontSize}" text-anchor="middle" font-family="Arial, sans-serif" 
                font-size="${fontSize*0.5}" fill="${textColor}" font-weight="500">
            ${errorMessage || 'Failed to load'}
          </text>
        </g>
      </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  private getContextLabel(context: string): string {
    const labels: Record<string, string> = {
      'hero': 'Hero Image',
      'feature': 'Feature',
      'features': 'Feature',
      'about': 'About',
      'services': 'Service',
      'service': 'Service',
      'portfolio': 'Portfolio',
      'gallery': 'Gallery',
      'contact': 'Contact',
      'general': 'Image',
      'default': 'Image'
    };
    
    return labels[context] || 'Image';
  }

  // Method to extract dimensions from img tag
  extractDimensionsFromImgTag(imgTag: string): { width: number; height: number } {
    const widthMatch = imgTag.match(/width\s*=\s*["']?(\d+)["']?/i);
    const heightMatch = imgTag.match(/height\s*=\s*["']?(\d+)["']?/i);
    
    const width = widthMatch ? parseInt(widthMatch[1], 10) : 400;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 300;
    
    return { width, height };
  }

  // Method to create a fallback with proper aspect ratio
  createResponsiveFallback(context: string, aspectRatio?: number): string {
    let width = 400;
    let height = 300;
    
    if (aspectRatio) {
      if (aspectRatio > 1) {
        // Landscape
        width = 500;
        height = Math.round(500 / aspectRatio);
      } else {
        // Portrait or square
        height = 500;
        width = Math.round(500 * aspectRatio);
      }
    }
    
    return this.getFallbackImage(context, width, height);
  }

  // Method to handle different fallback strategies
  handleImageFailure(
    context: string, 
    strategy: 'placeholder' | 'generic' | 'none' = 'placeholder',
    dimensions?: { width: number; height: number }
  ): string | null {
    switch (strategy) {
      case 'placeholder':
        return this.getFallbackImage(
          context, 
          dimensions?.width, 
          dimensions?.height
        );
      
      case 'generic':
        return this.generatePlaceholderSVG(
          dimensions?.width || 400, 
          dimensions?.height || 300, 
          'Image'
        );
      
      case 'none':
        return null;
      
      default:
        return this.getFallbackImage(context, dimensions?.width, dimensions?.height);
    }
  }
}
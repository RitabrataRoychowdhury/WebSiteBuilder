// Unsplash API service implementation

import { 
  ImageProvider, 
  ImageResult, 
  ImageSearchOptions, 
  ImageSize, 
  ProviderInfo,
  UnsplashConfig,
  ImageError,
  ImageProcessingError
} from '../types/image';
import { RateLimiter } from '../utils/rateLimiter';
import { retryWithBackoff } from '../utils/retryHandler';

export class UnsplashService implements ImageProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.unsplash.com';
  private rateLimiter: RateLimiter;
  private config: UnsplashConfig;

  constructor(config: UnsplashConfig) {
    this.config = config;
    this.apiKey = config.accessKey;
    this.rateLimiter = new RateLimiter(
      config.rateLimit.requestsPerMinute,
      1 // 1 minute window
    );
  }

  async searchImages(query: string, options: ImageSearchOptions = {}): Promise<ImageResult[]> {
    if (!query || query.trim().length === 0) {
      throw new ImageProcessingError(
        ImageError.INVALID_RESPONSE,
        'Search query cannot be empty',
        query,
        false
      );
    }

    const searchOptions = {
      count: options.count || 10,
      orientation: options.orientation || 'landscape',
      ...options
    };

    return retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForAvailability();
        
        const url = new URL(`${this.baseUrl}/search/photos`);
        url.searchParams.append('query', query.trim());
        url.searchParams.append('per_page', searchOptions.count.toString());
        url.searchParams.append('orientation', searchOptions.orientation);
        
        if (searchOptions.category) {
          url.searchParams.append('category', searchOptions.category);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Client-ID ${this.apiKey}`,
            'Accept-Version': 'v1'
          }
        });

        this.rateLimiter.recordRequest();

        if (!response.ok) {
          await this.handleApiError(response, query);
        }

        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results)) {
          throw new ImageProcessingError(
            ImageError.INVALID_RESPONSE,
            'Invalid response format from Unsplash API',
            query,
            true
          );
        }

        return this.mapUnsplashResults(data.results);
      },
      3, // max retries
      1000 // initial delay
    );
  }

  async getImageUrl(imageId: string, size?: ImageSize): Promise<string> {
    if (!imageId) {
      throw new ImageProcessingError(
        ImageError.IMAGE_NOT_FOUND,
        'Image ID cannot be empty',
        undefined,
        false
      );
    }

    return retryWithBackoff(
      async () => {
        await this.rateLimiter.waitForAvailability();
        
        const url = `${this.baseUrl}/photos/${imageId}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Client-ID ${this.apiKey}`,
            'Accept-Version': 'v1'
          }
        });

        this.rateLimiter.recordRequest();

        if (!response.ok) {
          await this.handleApiError(response, imageId);
        }

        const data = await response.json();
        
        if (!data.urls) {
          throw new ImageProcessingError(
            ImageError.INVALID_RESPONSE,
            'Invalid image data from Unsplash API',
            imageId,
            true
          );
        }

        // Return appropriate size URL
        if (size) {
          const { width, height, quality = 'medium' } = size;
          const qualityParam = quality === 'high' ? 100 : quality === 'low' ? 50 : 75;
          return `${data.urls.raw}&w=${width}&h=${height}&q=${qualityParam}&fit=crop`;
        }

        return data.urls.regular;
      },
      3, // max retries
      1000 // initial delay
    );
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'Unsplash',
      version: '1.0.0',
      rateLimit: this.config.rateLimit
    };
  }

  private mapUnsplashResults(results: any[]): ImageResult[] {
    return results.map(photo => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.thumb,
      width: photo.width,
      height: photo.height,
      altText: photo.alt_description || photo.description || 'Image from Unsplash',
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html
    }));
  }

  private async handleApiError(response: Response, context?: string): Promise<never> {
    const errorText = await response.text().catch(() => 'Unknown error');
    
    switch (response.status) {
      case 401:
        throw new ImageProcessingError(
          ImageError.INVALID_API_KEY,
          'Invalid Unsplash API key',
          context,
          false
        );
      case 403:
        throw new ImageProcessingError(
          ImageError.QUOTA_EXCEEDED,
          'Unsplash API quota exceeded',
          context,
          false
        );
      case 429:
        throw new ImageProcessingError(
          ImageError.API_RATE_LIMIT,
          'Unsplash API rate limit exceeded',
          context,
          true
        );
      case 404:
        throw new ImageProcessingError(
          ImageError.IMAGE_NOT_FOUND,
          'Image not found on Unsplash',
          context,
          false
        );
      default:
        throw new ImageProcessingError(
          ImageError.NETWORK_ERROR,
          `Unsplash API error: ${response.status} - ${errorText}`,
          context,
          true
        );
    }
  }
}
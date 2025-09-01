// Image provider types and interfaces

export interface ImageSearchOptions {
  count?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  category?: string;
  minWidth?: number;
  minHeight?: number;
}

export interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  altText: string;
  photographer: string;
  photographerUrl?: string;
}

export interface ImageSize {
  width: number;
  height: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface ProviderInfo {
  name: string;
  version: string;
  rateLimit: {
    requestsPerHour: number;
    requestsPerMinute: number;
  };
}

// Base Image Provider Interface
export interface ImageProvider {
  searchImages(query: string, options?: ImageSearchOptions): Promise<ImageResult[]>;
  getImageUrl(imageId: string, size?: ImageSize): Promise<string>;
  getProviderInfo(): ProviderInfo;
}

// Error types for image processing
export enum ImageError {
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  IMAGE_NOT_FOUND = 'IMAGE_NOT_FOUND',
  INVALID_API_KEY = 'INVALID_API_KEY'
}

export class ImageProcessingError extends Error {
  constructor(
    public type: ImageError,
    message: string,
    public query?: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Configuration interfaces
export interface UnsplashConfig {
  accessKey: string;
  secretKey: string;
  applicationId: string;
  rateLimit: {
    requestsPerHour: number;
    requestsPerMinute: number;
  };
  defaultImageSize: ImageSize;
  cacheTTL: number;
}
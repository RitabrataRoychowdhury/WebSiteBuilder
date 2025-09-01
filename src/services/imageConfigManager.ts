// Configuration manager for image processing settings

import { UnsplashConfig, ImageSize } from '../types/image';

export interface ImageProcessingConfig {
  provider: 'unsplash' | 'pexels' | 'pixabay';
  enableCache: boolean;
  enableLazyLoading: boolean;
  fallbackStrategy: 'placeholder' | 'generic' | 'none';
  maxConcurrentRequests: number;
  timeout: number;
  cacheTTL: number;
}

export class ImageConfigManager {
  private static instance: ImageConfigManager;
  private config: ImageProcessingConfig;
  private unsplashConfig: UnsplashConfig;

  private constructor() {
    this.config = this.loadImageProcessingConfig();
    this.unsplashConfig = this.loadUnsplashConfig();
  }

  static getInstance(): ImageConfigManager {
    if (!ImageConfigManager.instance) {
      ImageConfigManager.instance = new ImageConfigManager();
    }
    return ImageConfigManager.instance;
  }

  getImageProcessingConfig(): ImageProcessingConfig {
    return { ...this.config };
  }

  getUnsplashConfig(): UnsplashConfig {
    return { ...this.unsplashConfig };
  }

  isImageProcessingEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_IMAGE_PROCESSING === 'true' && 
           this.hasValidUnsplashCredentials();
  }

  hasValidUnsplashCredentials(): boolean {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_UNSPLASH_SECRET_KEY;
    const applicationId = import.meta.env.VITE_UNSPLASH_APPLICATION_ID;

    return !!(accessKey && secretKey && applicationId);
  }

  private loadImageProcessingConfig(): ImageProcessingConfig {
    return {
      provider: (import.meta.env.VITE_IMAGE_PROVIDER as any) || 'unsplash',
      enableCache: import.meta.env.VITE_ENABLE_IMAGE_CACHE !== 'false',
      enableLazyLoading: import.meta.env.VITE_ENABLE_LAZY_LOADING !== 'false',
      fallbackStrategy: (import.meta.env.VITE_IMAGE_FALLBACK_STRATEGY as any) || 'placeholder',
      maxConcurrentRequests: parseInt(import.meta.env.VITE_MAX_CONCURRENT_IMAGE_REQUESTS || '5'),
      timeout: parseInt(import.meta.env.VITE_IMAGE_REQUEST_TIMEOUT || '10000'),
      cacheTTL: parseInt(import.meta.env.VITE_IMAGE_CACHE_TTL || '3600')
    };
  }

  private loadUnsplashConfig(): UnsplashConfig {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_UNSPLASH_SECRET_KEY;
    const applicationId = import.meta.env.VITE_UNSPLASH_APPLICATION_ID;

    if (!accessKey || !secretKey || !applicationId) {
      throw new Error('Missing Unsplash API credentials. Please check your environment variables.');
    }

    return {
      accessKey,
      secretKey,
      applicationId,
      rateLimit: {
        requestsPerHour: parseInt(import.meta.env.VITE_UNSPLASH_REQUESTS_PER_HOUR || '50'),
        requestsPerMinute: parseInt(import.meta.env.VITE_UNSPLASH_REQUESTS_PER_MINUTE || '50')
      },
      defaultImageSize: {
        width: parseInt(import.meta.env.VITE_DEFAULT_IMAGE_WIDTH || '800'),
        height: parseInt(import.meta.env.VITE_DEFAULT_IMAGE_HEIGHT || '600'),
        quality: (import.meta.env.VITE_DEFAULT_IMAGE_QUALITY as any) || 'medium'
      },
      cacheTTL: parseInt(import.meta.env.VITE_IMAGE_CACHE_TTL || '3600')
    };
  }

  updateConfig(newConfig: Partial<ImageProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if image processing is enabled
    if (!this.isImageProcessingEnabled()) {
      errors.push('Image processing is disabled or missing credentials');
    }

    // Validate Unsplash credentials
    if (!this.hasValidUnsplashCredentials()) {
      errors.push('Invalid or missing Unsplash API credentials');
    }

    // Validate numeric values
    if (this.config.maxConcurrentRequests < 1 || this.config.maxConcurrentRequests > 20) {
      errors.push('Max concurrent requests must be between 1 and 20');
    }

    if (this.config.timeout < 1000 || this.config.timeout > 60000) {
      errors.push('Timeout must be between 1000ms and 60000ms');
    }

    if (this.config.cacheTTL < 60 || this.config.cacheTTL > 86400) {
      errors.push('Cache TTL must be between 60 seconds and 24 hours');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
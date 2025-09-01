// Factory for creating image provider instances

import { ImageProvider, UnsplashConfig, ImageError, ImageProcessingError } from '../types/image';
import { UnsplashService } from './unsplashService';

export type ProviderType = 'unsplash' | 'pexels' | 'pixabay';

export interface ProviderConfig {
  unsplash?: UnsplashConfig;
  // Future provider configs can be added here
  // pexels?: PexelsConfig;
  // pixabay?: PixabayConfig;
}

export class ImageProviderFactory {
  private static instance: ImageProviderFactory;
  private providers: Map<ProviderType, ImageProvider> = new Map();
  private config: ProviderConfig;

  private constructor(config: ProviderConfig) {
    this.config = config;
  }

  static getInstance(config?: ProviderConfig): ImageProviderFactory {
    if (!ImageProviderFactory.instance) {
      if (!config) {
        throw new ImageProcessingError(
          ImageError.INVALID_RESPONSE,
          'Configuration required for first factory initialization',
          undefined,
          false
        );
      }
      ImageProviderFactory.instance = new ImageProviderFactory(config);
    }
    return ImageProviderFactory.instance;
  }

  static createProvider(type: ProviderType, config?: ProviderConfig): ImageProvider {
    const factory = ImageProviderFactory.getInstance(config);
    return factory.getProvider(type);
  }

  getProvider(type: ProviderType): ImageProvider {
    // Return cached provider if available
    if (this.providers.has(type)) {
      return this.providers.get(type)!;
    }

    // Create new provider instance
    const provider = this.createProviderInstance(type);
    this.providers.set(type, provider);
    return provider;
  }

  private createProviderInstance(type: ProviderType): ImageProvider {
    switch (type) {
      case 'unsplash':
        if (!this.config.unsplash) {
          throw new ImageProcessingError(
            ImageError.INVALID_RESPONSE,
            'Unsplash configuration not provided',
            undefined,
            false
          );
        }
        return new UnsplashService(this.config.unsplash);
      
      case 'pexels':
        throw new ImageProcessingError(
          ImageError.INVALID_RESPONSE,
          'Pexels provider not yet implemented',
          undefined,
          false
        );
      
      case 'pixabay':
        throw new ImageProcessingError(
          ImageError.INVALID_RESPONSE,
          'Pixabay provider not yet implemented',
          undefined,
          false
        );
      
      default:
        throw new ImageProcessingError(
          ImageError.INVALID_RESPONSE,
          `Unknown provider type: ${type}`,
          undefined,
          false
        );
    }
  }

  getSupportedProviders(): ProviderType[] {
    return ['unsplash']; // Add 'pexels', 'pixabay' when implemented
  }

  clearCache(): void {
    this.providers.clear();
  }

  updateConfig(config: ProviderConfig): void {
    this.config = { ...this.config, ...config };
    // Clear cache to force recreation with new config
    this.clearCache();
  }
}
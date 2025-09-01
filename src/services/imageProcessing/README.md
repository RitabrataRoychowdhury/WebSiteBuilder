# Image Processing System

This directory contains the image processing and caching system for the AI website builder. The system automatically replaces placeholder images with contextually relevant, high-quality images from external providers like Unsplash.

## Overview

The image processing system consists of four main components that work together to provide a seamless image integration experience:

1. **ImageProcessorService** - Main orchestrator that coordinates all image processing operations
2. **ImageCacheManager** - Handles memory and localStorage caching to improve performance
3. **QueryExtractor** - Intelligently extracts search terms from website content and requests
4. **FallbackHandler** - Generates SVG placeholders when image fetching fails

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Website         │    │ ImageProcessor   │    │ Image Provider  │
│ Generator       │───▶│ Service          │───▶│ (Unsplash)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Cache Manager    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Query Extractor  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Fallback Handler │
                    └──────────────────┘
```

## Components

### ImageProcessorService

The main service that orchestrates the entire image processing workflow.

**Key Features:**
- Processes websites to replace placeholder images with real images
- Manages concurrency to respect API rate limits
- Integrates caching, query extraction, and fallback handling
- Supports lazy loading and performance optimizations
- Provides detailed processing metadata

**Usage:**
```typescript
import { ImageProcessorService } from './imageProcessorService';
import { UnsplashService } from './unsplashService';

const provider = new UnsplashService(config);
const processor = new ImageProcessorService(provider, {
  enableCache: true,
  enableLazyLoading: true,
  fallbackStrategy: 'placeholder',
  maxConcurrentRequests: 5,
  timeout: 10000
});

const processedWebsite = await processor.processWebsite(website, request);
```

### ImageCacheManager

Implements a two-tier caching system using both memory and localStorage.

**Key Features:**
- Memory cache for fast access to recently used images
- localStorage persistence across browser sessions
- Automatic TTL (Time To Live) management
- Graceful handling of storage quota exceeded errors
- Cache size limits and automatic cleanup

**Usage:**
```typescript
import { ImageCacheManager } from './imageCacheManager';

const cache = new ImageCacheManager(3600); // 1 hour TTL

await cache.set('query-key', 'https://example.com/image.jpg');
const imageUrl = await cache.get('query-key');
```

### QueryExtractor

Intelligently extracts search terms from website content and user requests.

**Key Features:**
- Extracts queries from HTML headings, alt text, and semantic sections
- Processes WebsiteRequest data (title, description, features)
- Adds contextual terms based on website type (business, restaurant, etc.)
- Prioritizes queries by relevance and specificity
- Sanitizes inappropriate content

**Usage:**
```typescript
import { QueryExtractor } from './queryExtractor';

const extractor = new QueryExtractor();

// Extract from website request
const requestQueries = extractor.extractFromWebsiteRequest(request);

// Extract from HTML content
const htmlQueries = extractor.extractFromHTML(html);

// Generate contextual variations
const contextualQueries = extractor.generateContextualQueries('office', 'business');
```

### FallbackHandler

Generates SVG placeholders when image fetching fails or times out.

**Key Features:**
- Context-aware placeholder generation (hero, about, services, etc.)
- Custom dimensions and responsive design support
- Different placeholder types (loading, error, generic)
- Professional-looking SVG graphics with icons and text
- Configurable fallback strategies

**Usage:**
```typescript
import { FallbackHandler } from './fallbackHandler';

const fallback = new FallbackHandler();

// Get context-specific fallback
const heroImage = fallback.getFallbackImage('hero', 1200, 600);

// Generate custom placeholder
const customPlaceholder = fallback.generatePlaceholderSVG(400, 300, 'Custom Text');

// Handle different error scenarios
const errorImage = fallback.generateErrorPlaceholder(400, 300, 'Failed to load');
```

## Configuration

The system can be configured through environment variables and constructor options:

### Environment Variables

```bash
# Unsplash API Configuration
VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
VITE_UNSPLASH_SECRET_KEY=your_secret_key_here
VITE_UNSPLASH_APPLICATION_ID=your_app_id_here

# Processing Configuration
VITE_ENABLE_IMAGE_PROCESSING=true
VITE_IMAGE_CACHE_TTL=3600
VITE_MAX_CONCURRENT_IMAGE_REQUESTS=5
```

### ImageProcessorService Options

```typescript
interface ImageProcessingOptions {
  enableCache?: boolean;           // Default: true
  enableLazyLoading?: boolean;     // Default: true
  fallbackStrategy?: 'placeholder' | 'generic' | 'none'; // Default: 'placeholder'
  maxConcurrentRequests?: number;  // Default: 5
  timeout?: number;               // Default: 10000ms
}
```

## Performance Considerations

### Caching Strategy

The system implements a multi-level caching strategy:

1. **Memory Cache**: Fast access for recently used images (up to 100 entries)
2. **localStorage Cache**: Persistent storage across browser sessions
3. **Query-based Keys**: Cache keys based on search queries and context

### Concurrency Control

- Limits concurrent API requests to respect rate limits
- Uses semaphore pattern to manage request queuing
- Configurable concurrency limits per provider

### Lazy Loading

- Adds `loading="lazy"` attributes to images
- Includes intersection observer script for progressive loading
- Maintains layout integrity during loading

## Error Handling

The system provides robust error handling at multiple levels:

### API Failures
- Automatic retry logic with exponential backoff
- Graceful degradation to fallback images
- Detailed error logging and metrics

### Network Issues
- Configurable timeouts for API requests
- Fallback to cached results when available
- SVG placeholders maintain layout integrity

### Storage Errors
- Graceful handling of localStorage quota exceeded
- Fallback to memory-only caching
- No impact on core functionality

## Testing

The system includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Concurrency and caching validation
- **Error Handling Tests**: Failure scenario coverage

Run tests with:
```bash
npm test -- --run src/test/imageCacheManager.test.ts
npm test -- --run src/test/queryExtractor.test.ts
npm test -- --run src/test/fallbackHandler.test.ts
npm test -- --run src/test/imageProcessorService.test.ts
npm test -- --run src/test/integration/imageProcessingIntegration.test.ts
```

## Examples

See `src/examples/imageProcessingExample.ts` for comprehensive usage examples including:

- Basic website processing
- Individual component usage
- Error handling scenarios
- Performance optimization techniques

## Future Enhancements

The system is designed for extensibility:

1. **Additional Providers**: Easy integration of Pexels, Pixabay, etc.
2. **Advanced Caching**: Redis or IndexedDB support
3. **Image Optimization**: Automatic resizing and format conversion
4. **AI-Powered Selection**: Machine learning for better image matching
5. **Analytics**: Detailed usage and performance metrics

## Troubleshooting

### Common Issues

1. **API Rate Limits**: Reduce `maxConcurrentRequests` or implement request queuing
2. **Storage Quota**: Clear localStorage cache or reduce cache TTL
3. **Slow Performance**: Enable caching and adjust concurrency settings
4. **Missing Images**: Check API credentials and network connectivity

### Debug Mode

Enable detailed logging by setting:
```typescript
const processor = new ImageProcessorService(provider, {
  // ... other options
  debug: true // Add this for detailed logging
});
```

## Contributing

When contributing to the image processing system:

1. Maintain backward compatibility
2. Add comprehensive tests for new features
3. Update documentation and examples
4. Follow the existing error handling patterns
5. Consider performance implications of changes
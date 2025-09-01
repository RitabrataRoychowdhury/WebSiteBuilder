import { WebsiteRequest, GeneratedWebsite } from '../types';
import { ImageProvider } from '../types/image';
import { ImageCacheManager } from './imageCacheManager';
import { QueryExtractor } from './queryExtractor';
import { FallbackHandler } from './fallbackHandler';
import { LazyImageLoader, LazyLoadingOptions } from './lazyImageLoader';

interface ProcessedWebsite extends GeneratedWebsite {
  imageMetadata: {
    totalImages: number;
    processedImages: number;
    failedImages: number;
    cacheHits: number;
    processingTime: number;
  };
}

interface ImageProcessingOptions {
  enableCache?: boolean;
  enableLazyLoading?: boolean;
  fallbackStrategy?: 'placeholder' | 'generic' | 'none';
  maxConcurrentRequests?: number;
  timeout?: number;
}

interface ImageReplacement {
  originalTag: string;
  newTag: string;
  query: string;
  success: boolean;
  cached: boolean;
}

export class ImageProcessorService {
  private cache: ImageCacheManager;
  private queryExtractor: QueryExtractor;
  private fallbackHandler: FallbackHandler;
  private provider: ImageProvider;
  private options: Required<ImageProcessingOptions>;

  constructor(
    provider: ImageProvider, 
    options: ImageProcessingOptions = {}
  ) {
    this.provider = provider;
    this.cache = new ImageCacheManager();
    this.queryExtractor = new QueryExtractor();
    this.fallbackHandler = new FallbackHandler();
    
    this.options = {
      enableCache: options.enableCache ?? true,
      enableLazyLoading: options.enableLazyLoading ?? true,
      fallbackStrategy: options.fallbackStrategy ?? 'placeholder',
      maxConcurrentRequests: options.maxConcurrentRequests ?? 5,
      timeout: options.timeout ?? 10000
    };
  }

  async processWebsite(website: GeneratedWebsite, request: WebsiteRequest): Promise<ProcessedWebsite> {
    const startTime = Date.now();
    const metadata = {
      totalImages: 0,
      processedImages: 0,
      failedImages: 0,
      cacheHits: 0,
      processingTime: 0
    };

    try {
      // Extract image queries from both HTML and request
      const htmlQueries = this.queryExtractor.extractFromHTML(website.html);
      const requestQueries = this.queryExtractor.extractFromWebsiteRequest(request);
      
      // Combine and prioritize queries
      const allQueries = [...requestQueries, ...htmlQueries];
      
      // Find all img tags in the HTML
      const imgTags = this.findImageTags(website.html);
      metadata.totalImages = imgTags.length;
      
      if (imgTags.length === 0) {
        metadata.processingTime = Date.now() - startTime;
        return { ...website, imageMetadata: metadata };
      }

      // Process images with concurrency control
      const replacements = await this.processImagesWithConcurrency(
        imgTags, 
        allQueries, 
        website.html
      );
      
      // Update metadata
      metadata.processedImages = replacements.filter(r => r.success).length;
      metadata.failedImages = replacements.filter(r => !r.success).length;
      metadata.cacheHits = replacements.filter(r => r.cached).length;

      // Apply replacements to HTML
      let processedHtml = website.html;
      for (const replacement of replacements) {
        processedHtml = processedHtml.replace(replacement.originalTag, replacement.newTag);
      }

      // Add lazy loading if enabled
      if (this.options.enableLazyLoading) {
        const lazyLoadingOptions: LazyLoadingOptions = {
          rootMargin: '50px',
          threshold: 0.1,
          enableProgressiveLoading: true,
          placeholderStrategy: 'blur',
          fadeInDuration: 300
        };
        processedHtml = LazyImageLoader.injectLazyLoading(processedHtml, lazyLoadingOptions);
      }

      metadata.processingTime = Date.now() - startTime;

      return {
        ...website,
        html: processedHtml,
        imageMetadata: metadata
      };

    } catch (error) {
      console.error('Error processing images:', error);
      metadata.processingTime = Date.now() - startTime;
      
      return {
        ...website,
        imageMetadata: metadata
      };
    }
  }

  extractImageQueries(html: string, request: WebsiteRequest): string[] {
    const htmlQueries = this.queryExtractor.extractFromHTML(html);
    const requestQueries = this.queryExtractor.extractFromWebsiteRequest(request);
    
    return [...requestQueries, ...htmlQueries];
  }

  replaceImagePlaceholders(html: string, imageMap: Map<string, string>): string {
    let processedHtml = html;
    
    for (const [query, imageUrl] of imageMap.entries()) {
      // Find img tags that might match this query
      const imgRegex = /<img[^>]*>/gi;
      const matches = html.match(imgRegex) || [];
      
      for (const imgTag of matches) {
        // Check if this img tag is relevant to the query
        if (this.isRelevantImageTag(imgTag, query)) {
          const newTag = this.updateImageTag(imgTag, imageUrl);
          processedHtml = processedHtml.replace(imgTag, newTag);
        }
      }
    }
    
    return processedHtml;
  }

  private findImageTags(html: string): string[] {
    const imgRegex = /<img[^>]*>/gi;
    return html.match(imgRegex) || [];
  }

  private async processImagesWithConcurrency(
    imgTags: string[], 
    queries: string[], 
    html: string
  ): Promise<ImageReplacement[]> {
    const replacements: ImageReplacement[] = [];
    const semaphore = new Semaphore(this.options.maxConcurrentRequests);
    
    const promises = imgTags.map(async (imgTag, index) => {
      await semaphore.acquire();
      
      try {
        const context = this.queryExtractor.extractImageContext(html, index);
        const relevantQuery = this.selectBestQuery(queries, context, imgTag);
        
        const replacement = await this.processSingleImage(imgTag, relevantQuery, context);
        replacements.push(replacement);
      } finally {
        semaphore.release();
      }
    });
    
    await Promise.all(promises);
    return replacements;
  }

  private async processSingleImage(
    imgTag: string, 
    query: string, 
    context: string
  ): Promise<ImageReplacement> {
    const cacheKey = `${query}_${context}`;
    
    try {
      // Check cache first
      if (this.options.enableCache) {
        const cachedUrl = await this.cache.get(cacheKey);
        if (cachedUrl) {
          return {
            originalTag: imgTag,
            newTag: this.updateImageTag(imgTag, cachedUrl),
            query,
            success: true,
            cached: true
          };
        }
      }

      // Fetch from provider with timeout
      const imageUrl = await Promise.race([
        this.fetchImageFromProvider(query),
        this.createTimeoutPromise(this.options.timeout)
      ]);

      if (imageUrl) {
        // Cache the result
        if (this.options.enableCache) {
          await this.cache.set(cacheKey, imageUrl);
        }

        return {
          originalTag: imgTag,
          newTag: this.updateImageTag(imgTag, imageUrl),
          query,
          success: true,
          cached: false
        };
      } else {
        throw new Error('No image URL returned');
      }

    } catch (error) {
      console.warn(`Failed to fetch image for query "${query}":`, error);
      
      // Use fallback
      const dimensions = this.fallbackHandler.extractDimensionsFromImgTag(imgTag);
      const fallbackUrl = this.fallbackHandler.handleImageFailure(
        context, 
        this.options.fallbackStrategy, 
        dimensions
      );

      return {
        originalTag: imgTag,
        newTag: fallbackUrl ? this.updateImageTag(imgTag, fallbackUrl) : imgTag,
        query,
        success: false,
        cached: false
      };
    }
  }

  private async fetchImageFromProvider(query: string): Promise<string | null> {
    try {
      const results = await this.provider.searchImages(query, { count: 1 });
      return results.length > 0 ? results[0].url : null;
    } catch (error) {
      console.warn('Provider search failed:', error);
      return null;
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeout);
    });
  }

  private selectBestQuery(queries: string[], context: string, imgTag: string): string {
    // Try to find context-specific query first
    const contextQuery = queries.find(q => 
      q.toLowerCase().includes(context.toLowerCase()) ||
      context.toLowerCase().includes(q.toLowerCase())
    );
    
    if (contextQuery) {
      return contextQuery;
    }

    // Check img tag for hints
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']+)["']/i);
    if (altMatch) {
      const altText = altMatch[1].toLowerCase();
      const altQuery = queries.find(q => 
        altText.includes(q.toLowerCase()) || 
        q.toLowerCase().includes(altText)
      );
      if (altQuery) {
        return altQuery;
      }
    }

    // Return first available query or fallback
    return queries[0] || 'business professional';
  }

  private updateImageTag(originalTag: string, newUrl: string): string {
    // Update src attribute
    let updatedTag = originalTag.replace(
      /src\s*=\s*["'][^"']*["']/i,
      `src="${newUrl}"`
    );

    // Add src if it doesn't exist
    if (!updatedTag.includes('src=')) {
      updatedTag = updatedTag.replace('<img', `<img src="${newUrl}"`);
    }

    // Add loading="lazy" if lazy loading is enabled
    if (this.options.enableLazyLoading && !updatedTag.includes('loading=')) {
      updatedTag = updatedTag.replace('<img', '<img loading="lazy"');
    }

    return updatedTag;
  }

  private isRelevantImageTag(imgTag: string, query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const lowerTag = imgTag.toLowerCase();
    
    // Check alt text
    const altMatch = imgTag.match(/alt\s*=\s*["']([^"']+)["']/i);
    if (altMatch && altMatch[1].toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check class names
    const classMatch = imgTag.match(/class\s*=\s*["']([^"']+)["']/i);
    if (classMatch && classMatch[1].toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Check data attributes
    if (lowerTag.includes(`data-context="${lowerQuery}"`)) {
      return true;
    }

    return false;
  }


}

// Simple semaphore implementation for concurrency control
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}
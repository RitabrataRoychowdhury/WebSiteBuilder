/**
 * Example demonstrating how to use the image processing system
 * This shows the integration of all components: ImageProcessorService, 
 * ImageCacheManager, QueryExtractor, and FallbackHandler
 */

import { ImageProcessorService } from '../services/imageProcessorService';
import { UnsplashService } from '../services/unsplashService';
import { WebsiteRequest, GeneratedWebsite } from '../types';

// Example usage of the image processing system
export async function processWebsiteImages() {
  try {
    // 1. Initialize the Unsplash service (assuming environment variables are set)
    const unsplashService = new UnsplashService({
      accessKey: process.env.VITE_UNSPLASH_ACCESS_KEY || '',
      secretKey: process.env.VITE_UNSPLASH_SECRET_KEY || '',
      applicationId: process.env.VITE_UNSPLASH_APPLICATION_ID || ''
    });

    // 2. Create the image processor with configuration
    const imageProcessor = new ImageProcessorService(unsplashService, {
      enableCache: true,           // Enable caching for better performance
      enableLazyLoading: true,     // Add lazy loading for better UX
      fallbackStrategy: 'placeholder', // Use SVG placeholders on failure
      maxConcurrentRequests: 5,    // Limit concurrent API calls
      timeout: 10000              // 10 second timeout per request
    });

    // 3. Example website data (as would come from the website generator)
    const generatedWebsite: GeneratedWebsite = {
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Professional Consulting Services</title>
          </head>
          <body>
            <header class="hero">
              <h1>Welcome to ProConsult</h1>
              <p>Expert business consulting for modern enterprises</p>
              <img src="placeholder-hero.jpg" alt="professional team meeting" width="1200" height="600" />
            </header>
            
            <section class="about">
              <h2>About Our Services</h2>
              <p>We provide comprehensive business solutions to help your company thrive in today's competitive market.</p>
              <img src="placeholder-about.jpg" alt="business strategy session" width="500" height="400" />
            </section>
            
            <section class="services">
              <h2>Our Expertise</h2>
              <div class="service-grid">
                <div class="service-item">
                  <img src="placeholder-service1.jpg" alt="financial consulting" width="300" height="200" />
                  <h3>Financial Planning</h3>
                  <p>Strategic financial guidance for sustainable growth.</p>
                </div>
                <div class="service-item">
                  <img src="placeholder-service2.jpg" alt="digital transformation" width="300" height="200" />
                  <h3>Digital Transformation</h3>
                  <p>Modernize your business processes with cutting-edge technology.</p>
                </div>
                <div class="service-item">
                  <img src="placeholder-service3.jpg" alt="market analysis" width="300" height="200" />
                  <h3>Market Analysis</h3>
                  <p>Data-driven insights to identify new opportunities.</p>
                </div>
              </div>
            </section>
            
            <footer class="contact">
              <h2>Get In Touch</h2>
              <img src="placeholder-contact.jpg" alt="contact us" width="400" height="300" />
              <p>Ready to transform your business? Contact us today.</p>
            </footer>
          </body>
        </html>
      `,
      css: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4rem 2rem; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero img { margin-top: 2rem; border-radius: 10px; }
        .about, .services, .contact { padding: 3rem 2rem; max-width: 1200px; margin: 0 auto; }
        .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .service-item { text-align: center; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .service-item img { border-radius: 8px; margin-bottom: 1rem; }
        img { max-width: 100%; height: auto; }
      `,
      js: `
        // Add smooth scrolling and image loading animations
        document.addEventListener('DOMContentLoaded', function() {
          // Smooth scrolling for anchor links
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
              e.preventDefault();
              document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
              });
            });
          });
          
          // Fade in images as they load
          document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', function() {
              this.style.opacity = '0';
              this.style.transition = 'opacity 0.3s ease-in-out';
              setTimeout(() => { this.style.opacity = '1'; }, 100);
            });
          });
          
          console.log('Professional consulting website loaded successfully');
        });
      `
    };

    // 4. Website request context (helps with image selection)
    const websiteRequest: WebsiteRequest = {
      title: 'Professional Consulting Services',
      description: 'Expert business consulting firm specializing in financial planning, digital transformation, and market analysis',
      type: 'business',
      style: 'professional',
      features: [
        'business consulting',
        'financial planning', 
        'digital transformation',
        'market analysis',
        'strategic planning'
      ]
    };

    // 5. Process the website to replace placeholder images
    console.log('Starting image processing...');
    const startTime = Date.now();
    
    const processedWebsite = await imageProcessor.processWebsite(generatedWebsite, websiteRequest);
    
    const endTime = Date.now();
    console.log(`Image processing completed in ${endTime - startTime}ms`);

    // 6. Display processing results
    console.log('Processing Results:');
    console.log(`- Total images found: ${processedWebsite.imageMetadata.totalImages}`);
    console.log(`- Successfully processed: ${processedWebsite.imageMetadata.processedImages}`);
    console.log(`- Failed to process: ${processedWebsite.imageMetadata.failedImages}`);
    console.log(`- Cache hits: ${processedWebsite.imageMetadata.cacheHits}`);
    console.log(`- Processing time: ${processedWebsite.imageMetadata.processingTime}ms`);

    // 7. Show before/after comparison
    console.log('\n--- BEFORE (Original HTML snippet) ---');
    console.log(generatedWebsite.html.substring(0, 500) + '...');
    
    console.log('\n--- AFTER (Processed HTML snippet) ---');
    console.log(processedWebsite.html.substring(0, 500) + '...');

    return processedWebsite;

  } catch (error) {
    console.error('Error processing website images:', error);
    throw error;
  }
}

// Example of using individual components
export function demonstrateIndividualComponents() {
  console.log('\n=== Individual Component Examples ===');

  // 1. QueryExtractor example
  console.log('\n1. QueryExtractor - Extracting search queries:');
  const { QueryExtractor } = require('../services/queryExtractor');
  const queryExtractor = new QueryExtractor();
  
  const sampleRequest: WebsiteRequest = {
    title: 'Modern Restaurant',
    description: 'Farm-to-table dining experience',
    type: 'restaurant',
    features: ['fine dining', 'organic ingredients', 'wine selection']
  };
  
  const queries = queryExtractor.extractFromWebsiteRequest(sampleRequest);
  console.log('Extracted queries:', queries);

  // 2. FallbackHandler example
  console.log('\n2. FallbackHandler - Generating fallback images:');
  const { FallbackHandler } = require('../services/fallbackHandler');
  const fallbackHandler = new FallbackHandler();
  
  const heroFallback = fallbackHandler.getFallbackImage('hero', 1200, 600);
  const aboutFallback = fallbackHandler.getFallbackImage('about', 400, 300);
  
  console.log('Hero fallback (first 100 chars):', heroFallback.substring(0, 100) + '...');
  console.log('About fallback (first 100 chars):', aboutFallback.substring(0, 100) + '...');

  // 3. ImageCacheManager example
  console.log('\n3. ImageCacheManager - Caching demonstration:');
  const { ImageCacheManager } = require('../services/imageCacheManager');
  
  async function demonstrateCache() {
    const cache = new ImageCacheManager(300); // 5 minute TTL
    
    // Store some sample image URLs
    await cache.set('hero-business', 'https://example.com/business-hero.jpg');
    await cache.set('about-team', 'https://example.com/team-photo.jpg');
    
    // Retrieve them
    const heroUrl = await cache.get('hero-business');
    const teamUrl = await cache.get('about-team');
    
    console.log('Cached hero URL:', heroUrl);
    console.log('Cached team URL:', teamUrl);
    console.log('Cache statistics - Memory:', cache.getMemoryCacheSize(), 'LocalStorage:', cache.getLocalStorageCacheSize());
  }
  
  demonstrateCache().catch(console.error);
}

// Example of error handling and fallback strategies
export async function demonstrateErrorHandling() {
  console.log('\n=== Error Handling Examples ===');

  // Mock a failing image provider
  class FailingMockProvider {
    async searchImages() {
      throw new Error('API rate limit exceeded');
    }
    
    async getImageUrl() {
      throw new Error('Image not found');
    }
    
    getProviderInfo() {
      return { name: 'Failing Mock', baseUrl: 'https://mock.com', rateLimit: { requestsPerHour: 0, requestsPerMinute: 0 } };
    }
  }

  const failingProvider = new FailingMockProvider();
  const imageProcessor = new ImageProcessorService(failingProvider as any, {
    enableCache: false,
    fallbackStrategy: 'placeholder',
    timeout: 1000
  });

  const testWebsite: GeneratedWebsite = {
    html: '<img src="placeholder.jpg" alt="test image" width="400" height="300" />',
    css: '',
    js: ''
  };

  const testRequest: WebsiteRequest = {
    title: 'Error Handling Test'
  };

  try {
    const result = await imageProcessor.processWebsite(testWebsite, testRequest);
    console.log('Error handling result:');
    console.log(`- Failed images: ${result.imageMetadata.failedImages}`);
    console.log('- Fallback used:', result.html.includes('data:image/svg+xml'));
    console.log('- HTML contains fallback SVG:', result.html.substring(0, 200) + '...');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🖼️  Image Processing System Examples\n');
  
  // Run the main example
  processWebsiteImages()
    .then(() => {
      console.log('\n✅ Main example completed successfully');
      
      // Run individual component examples
      demonstrateIndividualComponents();
      
      // Run error handling example
      return demonstrateErrorHandling();
    })
    .then(() => {
      console.log('\n✅ All examples completed successfully');
    })
    .catch(error => {
      console.error('\n❌ Example failed:', error);
    });
}
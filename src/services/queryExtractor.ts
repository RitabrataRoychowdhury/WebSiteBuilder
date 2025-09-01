import { WebsiteRequest } from '../types';

export class QueryExtractor {
  private readonly blockedTerms: Set<string> = new Set([
    'inappropriate', 'adult', 'explicit', 'violence', 'weapon'
  ]);

  private readonly contextualTerms: Map<string, string[]> = new Map([
    ['business', ['office', 'professional', 'corporate', 'meeting', 'handshake']],
    ['restaurant', ['food', 'dining', 'kitchen', 'chef', 'meal']],
    ['portfolio', ['creative', 'design', 'art', 'workspace', 'professional']],
    ['blog', ['writing', 'reading', 'coffee', 'laptop', 'workspace']],
    ['ecommerce', ['shopping', 'products', 'store', 'retail', 'commerce']],
    ['landing', ['hero', 'banner', 'marketing', 'call to action']],
    ['personal', ['portrait', 'lifestyle', 'personal', 'individual']],
    ['corporate', ['business', 'office', 'professional', 'team', 'corporate']]
  ]);

  extractFromWebsiteRequest(request: WebsiteRequest): string[] {
    const queries: string[] = [];
    
    // Primary queries from request
    if (request.title) {
      queries.push(this.sanitizeQuery(request.title));
    }
    
    if (request.description) {
      queries.push(this.sanitizeQuery(request.description));
    }
    
    if (request.features && Array.isArray(request.features)) {
      request.features.forEach(feature => {
        if (typeof feature === 'string') {
          queries.push(this.sanitizeQuery(feature));
        }
      });
    }
    
    // Context-based queries from website type
    if (request.type) {
      const contextualQueries = this.contextualTerms.get(request.type.toLowerCase());
      if (contextualQueries) {
        queries.push(...contextualQueries);
      }
      queries.push(`${request.type} website`);
    }
    
    // Style-based queries
    if (request.style) {
      queries.push(`${request.style} design`);
      queries.push(`${request.style} style`);
    }
    
    return this.cleanAndPrioritizeQueries(queries);
  }

  extractFromHTML(html: string): string[] {
    const queries: string[] = [];
    
    // Extract from headings (h1-h6)
    const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      const text = this.stripHtmlTags(match[1]).trim();
      if (text.length > 3) {
        queries.push(this.sanitizeQuery(text));
      }
    }
    
    // Extract from alt attributes
    const altRegex = /alt\s*=\s*["']([^"']+)["']/gi;
    while ((match = altRegex.exec(html)) !== null) {
      const altText = match[1].trim();
      if (altText.length > 3 && !altText.toLowerCase().includes('placeholder')) {
        queries.push(this.sanitizeQuery(altText));
      }
    }
    
    // Extract from semantic sections
    const sections = ['hero', 'about', 'features', 'services', 'contact', 'portfolio', 'gallery'];
    sections.forEach(section => {
      if (html.includes(`class="${section}`) || 
          html.includes(`id="${section}`) || 
          html.includes(`class=".*${section}`) ||
          html.includes(`id=".*${section}`)) {
        queries.push(section);
      }
    });
    
    // Extract from data attributes that might contain context
    const dataContextRegex = /data-context\s*=\s*["']([^"']+)["']/gi;
    while ((match = dataContextRegex.exec(html)) !== null) {
      queries.push(this.sanitizeQuery(match[1]));
    }
    
    // Extract meaningful text from paragraphs (first few words)
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
    while ((match = paragraphRegex.exec(html)) !== null) {
      const text = this.stripHtmlTags(match[1]).trim();
      if (text.length > 10) {
        // Take first few meaningful words
        const words = text.split(/\s+/).slice(0, 3).join(' ');
        if (words.length > 5) {
          queries.push(this.sanitizeQuery(words));
        }
      }
    }
    
    return this.cleanAndPrioritizeQueries(queries);
  }

  generateContextualQueries(primaryQuery: string, context?: string): string[] {
    const queries = [primaryQuery];
    
    if (context) {
      queries.push(`${primaryQuery} ${context}`);
      queries.push(`${context} ${primaryQuery}`);
    }
    
    // Add generic professional terms for business contexts
    if (this.isBusinessContext(primaryQuery)) {
      queries.push(`${primaryQuery} professional`);
      queries.push(`${primaryQuery} business`);
    }
    
    // Add design-related terms for creative contexts
    if (this.isCreativeContext(primaryQuery)) {
      queries.push(`${primaryQuery} design`);
      queries.push(`${primaryQuery} creative`);
    }
    
    return queries;
  }

  private sanitizeQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return 'business professional'; // Safe fallback
    }
    
    const cleaned = query.toLowerCase().trim();
    
    // Check for blocked terms
    for (const term of this.blockedTerms) {
      if (cleaned.includes(term)) {
        return 'business professional'; // Safe fallback
      }
    }
    
    // Remove special characters and normalize
    return query
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private cleanAndPrioritizeQueries(queries: string[]): string[] {
    // Remove duplicates and empty queries, preserve original case
    const cleanedQueries = queries
      .map(q => q.trim())
      .filter(q => q.length > 2 && q !== 'undefined' && q !== 'null');
    
    // Remove duplicates (case-insensitive comparison but preserve original case)
    const uniqueQueries: string[] = [];
    const seenLowercase = new Set<string>();
    
    for (const query of cleanedQueries) {
      const lowerQuery = query.toLowerCase();
      if (!seenLowercase.has(lowerQuery)) {
        seenLowercase.add(lowerQuery);
        uniqueQueries.push(query);
      }
    }
    
    // Prioritize queries by relevance (longer, more specific queries first)
    const prioritized = uniqueQueries.sort((a, b) => {
      // Prioritize queries with multiple words
      const aWords = a.split(/\s+/).length;
      const bWords = b.split(/\s+/).length;
      
      if (aWords !== bWords) {
        return bWords - aWords; // More words = higher priority
      }
      
      // Then by length
      return b.length - a.length;
    });
    
    // Limit to top 10 queries to avoid API overuse
    return prioritized.slice(0, 10);
  }

  private isBusinessContext(query: string): boolean {
    const businessTerms = ['business', 'corporate', 'office', 'professional', 'company', 'enterprise'];
    return businessTerms.some(term => query.toLowerCase().includes(term));
  }

  private isCreativeContext(query: string): boolean {
    const creativeTerms = ['design', 'art', 'creative', 'portfolio', 'gallery', 'studio'];
    return creativeTerms.some(term => query.toLowerCase().includes(term));
  }

  // Utility method to extract image context from surrounding HTML
  extractImageContext(html: string, imageIndex: number): string {
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    if (imageIndex >= imgTags.length) {
      return 'general';
    }
    
    const imgTag = imgTags[imageIndex];
    const imgPosition = html.indexOf(imgTag);
    
    // Look for context in surrounding 500 characters
    const contextStart = Math.max(0, imgPosition - 250);
    const contextEnd = Math.min(html.length, imgPosition + 250);
    const context = html.substring(contextStart, contextEnd);
    
    // Extract meaningful context
    const headingMatch = context.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    if (headingMatch) {
      return this.stripHtmlTags(headingMatch[1]).trim();
    }
    
    // Look for section classes
    const sectionMatch = context.match(/class\s*=\s*["'][^"']*?(hero|about|features|services|contact|portfolio)[^"']*?["']/i);
    if (sectionMatch) {
      return sectionMatch[1];
    }
    
    return 'general';
  }
}
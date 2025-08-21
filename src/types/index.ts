// Data validation types (similar to Pydantic models)
export interface WebsiteRequest {
  title: string;
  description: string;
  type: 'landing' | 'portfolio' | 'blog' | 'business' | 'ecommerce';
  colorScheme: string;
  features: string[];
  style: 'modern' | 'minimal' | 'creative' | 'corporate';
}

export interface GeneratedWebsite {
  html: string;
  css: string;
  js: string;
  preview?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Gemini API types
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}
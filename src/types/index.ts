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

// Documentation types
export interface DocumentationConfig {
  includeAPI: boolean;
  includeComponents: boolean;
  includeUserGuide: boolean;
  format: 'html' | 'markdown' | 'pdf' | 'all';
  includeCodeComments: boolean;
}

export interface GeneratedDocumentation {
  html?: string;
  markdown?: string;
  pdf?: Blob;
  apiDocs: string;
  componentDocs: string;
  userGuide: string;
}

// Testing types
export interface TestConfig {
  unitTests: boolean;
  integrationTests: boolean;
  e2eTests: boolean;
  performanceTests: boolean;
  accessibilityTests: boolean;
  crossBrowserTests: boolean;
}

export interface TestResult {
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'accessibility' | 'cross-browser';
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

// Enhanced website generation
export interface EnhancedWebsiteRequest extends WebsiteRequest {
  generateDocs: boolean;
  generateTests: boolean;
  docConfig?: DocumentationConfig;
  testConfig?: TestConfig;
}

export interface EnhancedGeneratedWebsite extends GeneratedWebsite {
  documentation?: GeneratedDocumentation;
  testSuite?: TestSuite;
  projectStructure?: {
    files: Array<{
      path: string;
      content: string;
      type: 'html' | 'css' | 'js' | 'test' | 'doc';
    }>;
  };
}

// Re-export LLM types for convenience
export * from './llm';

// Re-export workflow types for convenience
export * from './workflow';
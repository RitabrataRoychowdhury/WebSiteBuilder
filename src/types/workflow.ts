// Workflow Types and Interfaces

export interface CodingRequest {
  task: string;
  requirements: string[];
  language: string;
  framework?: string;
  style: CodeStyle;
  constraints: string[];
}

export interface CodeStyle {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  maxLineLength: number;
  naming: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
  semicolons: boolean;
  quotes: 'single' | 'double';
}

export interface CodeResult {
  code: string;
  language: string;
  explanation: string;
  files?: Array<{
    path: string;
    content: string;
  }>;
  metadata: CodeMetadata;
}

export interface CodeMetadata {
  linesOfCode: number;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  estimatedTime: number; // in minutes
  testCoverage?: number;
}

export interface ReviewNote {
  type: 'error' | 'warning' | 'suggestion' | 'improvement';
  line?: number;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'security' | 'maintainability' | 'correctness' | 'style';
}

export interface Suggestion {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  codeChange?: string;
}

export interface QualityScore {
  overall: number; // 0-100
  performance: number;
  maintainability: number;
  correctness: number;
  security: number;
  style: number;
}

export interface ReviewResult {
  originalCode: CodeResult;
  reviewNotes: ReviewNote[];
  improvedCode?: CodeResult;
  suggestions: Suggestion[];
  score: QualityScore;
}

export interface WorkflowResult {
  originalCode: CodeResult;
  review: ReviewResult;
  finalCode: CodeResult;
  executionTime: number;
  providerUsed: string;
  workflowId: string;
}

export interface WorkflowMetrics {
  executionTime: number;
  providerUsed: string;
  tokensUsed: number;
  cacheHitRate: number;
  errorRate: number;
  workflowId: string;
}

// Agent Interfaces
export interface CodingAgent {
  generateCode(request: CodingRequest): Promise<CodeResult>;
}

export interface ReviewingAgent {
  reviewCode(code: CodeResult, originalRequest: CodingRequest): Promise<ReviewResult>;
}

// Workflow Orchestrator Interface
export interface WorkflowOrchestrator {
  executeWorkflow(request: CodingRequest): Promise<WorkflowResult>;
  getCodingAgent(): CodingAgent;
  getReviewingAgent(): ReviewingAgent;
}

// Prompt Template Types
export interface PromptTemplate {
  id: string;
  role: 'coding' | 'reviewing';
  template: string;
  variables: string[];
  metadata: PromptMetadata;
}

export interface PromptMetadata {
  version: string;
  description: string;
  author: string;
  tags: string[];
  lastUpdated: Date;
}

export interface PromptManager {
  getPrompt(id: string, variables: Record<string, any>): string;
  registerPrompt(template: PromptTemplate): void;
  validatePrompt(template: PromptTemplate): boolean;
}
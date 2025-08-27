import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReviewingAgentService } from '../services/reviewingAgent';
import { LLMServiceFactory } from '../services/llmServiceFactory';
import { PromptManager } from '../services/promptManager';
import { CodingRequest, CodeResult } from '../types/workflow';
import { LLMService, LLMResponse, LLMError, ErrorType } from '../types/llm';

// Mock dependencies
vi.mock('../services/llmServiceFactory');
vi.mock('../services/promptManager');

describe('ReviewingAgentService', () => {
  let reviewingAgent: ReviewingAgentService;
  let mockLLMService: vi.Mocked<LLMService>;

  const mockCodingRequest: CodingRequest = {
    task: 'Create a simple calculator function',
    requirements: ['Should handle basic arithmetic', 'Should validate inputs'],
    language: 'typescript',
    framework: 'React',
    style: {
      indentation: 'spaces',
      indentSize: 2,
      maxLineLength: 100,
      naming: 'camelCase',
      semicolons: true,
      quotes: 'single'
    },
    constraints: ['No external dependencies']
  };

  const mockCodeResult: CodeResult = {
    code: 'function add(a: number, b: number): number { return a + b; }',
    language: 'typescript',
    explanation: 'Simple addition function',
    files: [{
      path: 'calculator.ts',
      content: 'function add(a: number, b: number): number { return a + b; }'
    }],
    metadata: {
      linesOfCode: 1,
      complexity: 'low',
      dependencies: ['lodash'],
      estimatedTime: 5
    }
  };

  const mockReviewResponse: LLMResponse = {
    content: JSON.stringify({
      reviewNotes: [
        {
          type: 'error',
          line: 1,
          message: 'Missing input validation',
          severity: 'high',
          category: 'correctness'
        },
        {
          type: 'suggestion',
          message: 'Consider adding JSDoc comments',
          severity: 'low',
          category: 'maintainability'
        }
      ],
      improvedCode: {
        code: 'function add(a: number, b: number): number {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new Error("Invalid input");\n  }\n  return a + b;\n}',
        explanation: 'Improved addition function with input validation'
      },
      suggestions: [
        {
          title: 'Add input validation',
          description: 'Validate that both parameters are numbers',
          impact: 'high',
          effort: 'low',
          codeChange: 'if (typeof a !== "number" || typeof b !== "number") throw new Error("Invalid input");'
        }
      ],
      score: {
        overall: 75,
        performance: 90,
        maintainability: 70,
        correctness: 60,
        security: 80,
        style: 85
      }
    }),
    model: 'test-model',
    tokensUsed: 200
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock LLM Service
    mockLLMService = {
      generateCompletion: vi.fn(),
      validateResponse: vi.fn().mockReturnValue(true),
      isHealthy: vi.fn().mockResolvedValue(true),
      getProviderInfo: vi.fn().mockReturnValue({
        name: 'TestProvider',
        models: ['test-model'],
        defaultModel: 'test-model',
        maxTokens: 4000,
        supportsStreaming: false
      })
    };

    // Mock LLMServiceFactory
    vi.mocked(LLMServiceFactory.getServiceWithFallback).mockResolvedValue(mockLLMService);

    // Mock PromptManager
    vi.mocked(PromptManager.getPrompt).mockReturnValue('Test review prompt');

    reviewingAgent = new ReviewingAgentService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reviewCode', () => {
    it('should review code successfully with JSON response', async () => {
      // Arrange
      mockLLMService.generateCompletion.mockResolvedValue(mockReviewResponse);

      // Act
      const result = await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.originalCode).toEqual(mockCodeResult);
      expect(result.reviewNotes).toHaveLength(2);
      expect(result.reviewNotes[0]).toMatchObject({
        type: 'error',
        line: 1,
        message: 'Missing input validation',
        severity: 'high',
        category: 'correctness'
      });
      expect(result.improvedCode).toBeDefined();
      expect(result.improvedCode!.code).toContain('typeof a !== "number"');
      expect(result.suggestions).toHaveLength(1);
      expect(result.score.overall).toBe(75);

      expect(LLMServiceFactory.getServiceWithFallback).toHaveBeenCalled();
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('reviewing-agent-default', expect.any(Object));
      expect(mockLLMService.generateCompletion).toHaveBeenCalledWith(
        'Test review prompt',
        expect.objectContaining({
          temperature: 0.2,
          maxTokens: 3000,
          retryAttempts: 3
        })
      );
    });

    it('should handle text-based review response', async () => {
      // Arrange
      const textResponse: LLMResponse = {
        ...mockReviewResponse,
        content: `Code Review:
        
Error: Missing input validation for parameters
Warning: Function lacks proper documentation
Suggestion: Consider adding type guards for better safety`
      };
      mockLLMService.generateCompletion.mockResolvedValue(textResponse);

      // Act
      const result = await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(result.reviewNotes.length).toBeGreaterThan(0);
      expect(result.score).toMatchObject({
        overall: 75,
        performance: 75,
        maintainability: 75,
        correctness: 80,
        security: 70,
        style: 75
      });
    });

    it('should handle LLM service errors', async () => {
      // Arrange
      const llmError = new LLMError(ErrorType.API_ERROR, 'API failed', 'test-provider', true);
      mockLLMService.generateCompletion.mockRejectedValue(llmError);

      // Act & Assert
      await expect(reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle generic errors', async () => {
      // Arrange
      mockLLMService.generateCompletion.mockRejectedValue(new Error('Generic error'));

      // Act & Assert
      await expect(reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should validate review notes correctly', async () => {
      // Arrange
      const responseWithInvalidNotes: LLMResponse = {
        ...mockReviewResponse,
        content: JSON.stringify({
          reviewNotes: [
            {
              type: 'error',
              message: 'Valid note',
              severity: 'high',
              category: 'correctness'
            },
            {
              type: 'invalid-type', // Invalid type
              message: 'Invalid note',
              severity: 'high',
              category: 'correctness'
            },
            {
              // Missing required fields
              type: 'warning'
            }
          ]
        })
      };
      mockLLMService.generateCompletion.mockResolvedValue(responseWithInvalidNotes);

      // Act
      const result = await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(result.reviewNotes).toHaveLength(1); // Only valid note should remain
      expect(result.reviewNotes[0].type).toBe('error');
    });

    it('should validate suggestions correctly', async () => {
      // Arrange
      const responseWithInvalidSuggestions: LLMResponse = {
        ...mockReviewResponse,
        content: JSON.stringify({
          suggestions: [
            {
              title: 'Valid suggestion',
              description: 'This is valid',
              impact: 'high',
              effort: 'low'
            },
            {
              title: 'Invalid suggestion', // Missing description
              impact: 'high',
              effort: 'low'
            },
            {
              // Missing required fields
              title: 'Incomplete'
            }
          ]
        })
      };
      mockLLMService.generateCompletion.mockResolvedValue(responseWithInvalidSuggestions);

      // Act
      const result = await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(result.suggestions).toHaveLength(1); // Only valid suggestion should remain
      expect(result.suggestions[0].title).toBe('Valid suggestion');
    });

    it('should validate quality scores correctly', async () => {
      // Arrange
      const responseWithInvalidScores: LLMResponse = {
        ...mockReviewResponse,
        content: JSON.stringify({
          score: {
            overall: 150, // Invalid - over 100
            performance: -10, // Invalid - negative
            maintainability: 'invalid', // Invalid - not a number
            correctness: 85, // Valid
            security: null, // Invalid - null
            style: 90.5 // Valid - will be rounded
          }
        })
      };
      mockLLMService.generateCompletion.mockResolvedValue(responseWithInvalidScores);

      // Act
      const result = await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(result.score.overall).toBe(75); // Default value
      expect(result.score.performance).toBe(75); // Default value
      expect(result.score.maintainability).toBe(75); // Default value
      expect(result.score.correctness).toBe(85); // Valid value preserved
      expect(result.score.security).toBe(70); // Default value
      expect(result.score.style).toBe(91); // Rounded value
    });

    it('should prepare prompt variables correctly', async () => {
      // Arrange
      mockLLMService.generateCompletion.mockResolvedValue(mockReviewResponse);

      // Act
      await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('reviewing-agent-default', {
        originalTask: 'Create a simple calculator function',
        requirements: '- Should handle basic arithmetic\n- Should validate inputs',
        constraints: '- No external dependencies',
        language: 'typescript',
        code: 'function add(a: number, b: number): number { return a + b; }',
        explanation: 'Simple addition function',
        linesOfCode: 1,
        complexity: 'low',
        dependencies: 'lodash',
        framework: 'React'
      });
    });

    it('should handle request without framework or constraints', async () => {
      // Arrange
      const minimalRequest = {
        ...mockCodingRequest,
        framework: undefined,
        constraints: []
      };
      mockLLMService.generateCompletion.mockResolvedValue(mockReviewResponse);

      // Act
      await reviewingAgent.reviewCode(mockCodeResult, minimalRequest);

      // Assert
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('reviewing-agent-default',
        expect.objectContaining({
          framework: 'None specified',
          constraints: 'None specified'
        })
      );
    });

    it('should handle improved code validation', async () => {
      // Arrange
      const responseWithInvalidImprovedCode: LLMResponse = {
        ...mockReviewResponse,
        content: JSON.stringify({
          improvedCode: {
            // Missing code field
            explanation: 'Some explanation'
          }
        })
      };
      mockLLMService.generateCompletion.mockResolvedValue(responseWithInvalidImprovedCode);

      // Act
      const result = await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(result.improvedCode).toBeUndefined();
    });
  });

  describe('prompt template management', () => {
    it('should get current prompt template ID', () => {
      expect(reviewingAgent.getPromptTemplateId()).toBe('reviewing-agent-default');
    });

    it('should set new prompt template ID', () => {
      reviewingAgent.setPromptTemplateId('custom-review-template');
      expect(reviewingAgent.getPromptTemplateId()).toBe('custom-review-template');
    });

    it('should use custom template ID when reviewing code', async () => {
      // Arrange
      reviewingAgent.setPromptTemplateId('custom-review-template');
      mockLLMService.generateCompletion.mockResolvedValue(mockReviewResponse);

      // Act
      await reviewingAgent.reviewCode(mockCodeResult, mockCodingRequest);

      // Assert
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('custom-review-template', expect.any(Object));
    });
  });
});
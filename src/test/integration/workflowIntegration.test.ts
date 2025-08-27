import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowOrchestratorService } from '../../services/workflowOrchestrator';
import { LLMServiceFactory } from '../../services/llmServiceFactory';
import { PromptManager } from '../../services/promptManager';
import { CodingRequest } from '../../types/workflow';
import { LLMService, LLMResponse, LLMError, ErrorType } from '../../types/llm';

// Mock the LLM services for integration testing
const createMockLLMService = (name: string, shouldFail = false): LLMService => ({
  generateCompletion: vi.fn().mockImplementation(async (prompt: string) => {
    if (shouldFail) {
      throw new LLMError(ErrorType.API_ERROR, `${name} service failed`, name, true);
    }
    
    // Simulate realistic responses based on prompt content
    if (prompt.includes('coding') || prompt.includes('generate')) {
      return {
        content: JSON.stringify({
          code: 'function calculate(a, b) { return a + b; }',
          explanation: 'A simple calculator function',
          files: [{
            path: 'calculator.js',
            content: 'function calculate(a, b) { return a + b; }'
          }],
          metadata: {
            linesOfCode: 1,
            complexity: 'low',
            dependencies: [],
            estimatedTime: 5
          }
        }),
        model: `${name}-model`,
        tokensUsed: 100
      } as LLMResponse;
    } else if (prompt.includes('review') || prompt.includes('critique')) {
      return {
        content: JSON.stringify({
          reviewNotes: [{
            type: 'suggestion',
            message: 'Consider adding input validation',
            severity: 'medium',
            category: 'maintainability'
          }],
          improvedCode: {
            code: 'function calculate(a, b) { if (typeof a !== "number" || typeof b !== "number") throw new Error("Invalid input"); return a + b; }',
            explanation: 'Improved calculator with validation'
          },
          suggestions: [{
            title: 'Add input validation',
            description: 'Validate input parameters',
            impact: 'high',
            effort: 'low'
          }],
          score: {
            overall: 85,
            performance: 90,
            maintainability: 80,
            correctness: 85,
            security: 85,
            style: 90
          }
        }),
        model: `${name}-model`,
        tokensUsed: 150
      } as LLMResponse;
    }
    
    return {
      content: 'Generic response',
      model: `${name}-model`,
      tokensUsed: 50
    } as LLMResponse;
  }),
  validateResponse: vi.fn().mockReturnValue(true),
  isHealthy: vi.fn().mockResolvedValue(!shouldFail),
  getProviderInfo: vi.fn().mockReturnValue({
    name,
    models: [`${name}-model`],
    defaultModel: `${name}-model`,
    maxTokens: 4000,
    supportsStreaming: false
  })
});

describe('Workflow Integration Tests', () => {
  let orchestrator: WorkflowOrchestratorService;
  let mockOpenRouterService: LLMService;
  let mockGeminiService: LLMService;

  const testCodingRequest: CodingRequest = {
    task: 'Create a calculator function that adds two numbers',
    requirements: [
      'Should accept two numeric parameters',
      'Should return the sum of the parameters',
      'Should handle edge cases gracefully'
    ],
    language: 'javascript',
    framework: 'vanilla',
    style: {
      indentation: 'spaces',
      indentSize: 2,
      maxLineLength: 100,
      naming: 'camelCase',
      semicolons: true,
      quotes: 'single'
    },
    constraints: ['No external dependencies', 'Must be a pure function']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock services
    mockOpenRouterService = createMockLLMService('OpenRouter');
    mockGeminiService = createMockLLMService('Gemini');

    // Mock the service factory to return our mock services
    vi.spyOn(LLMServiceFactory, 'getServiceWithFallback').mockResolvedValue(mockOpenRouterService);
    
    // Mock prompt manager
    vi.spyOn(PromptManager, 'getPrompt').mockImplementation((templateId, variables) => {
      if (templateId.includes('coding')) {
        return `Generate code for: ${variables.task}. Language: ${variables.language}`;
      } else if (templateId.includes('reviewing')) {
        return `Review this code: ${variables.code}. Task: ${variables.originalTask}`;
      }
      return 'Generic prompt';
    });

    orchestrator = new WorkflowOrchestratorService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Workflow Execution', () => {
    it('should execute end-to-end workflow successfully', async () => {
      // Act
      const result = await orchestrator.executeWorkflow(testCodingRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.originalCode).toBeDefined();
      expect(result.originalCode.code).toContain('function calculate');
      expect(result.originalCode.language).toBe('javascript');
      
      expect(result.review).toBeDefined();
      expect(result.review.reviewNotes).toHaveLength(1);
      expect(result.review.improvedCode).toBeDefined();
      expect(result.review.score.overall).toBe(85);
      
      expect(result.finalCode).toBeDefined();
      expect(result.finalCode.code).toContain('validation');
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.workflowId).toMatch(/^workflow_\d+_[a-z0-9]+$/);

      // Verify service interactions
      expect(LLMServiceFactory.getServiceWithFallback).toHaveBeenCalledTimes(2); // Once for coding, once for reviewing
      expect(mockOpenRouterService.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it('should handle provider fallback during workflow execution', async () => {
      // Arrange - Primary service fails, fallback succeeds
      const failingService = createMockLLMService('OpenRouter', true);
      const fallbackService = createMockLLMService('Gemini');
      
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback')
        .mockResolvedValueOnce(failingService) // First call fails
        .mockResolvedValueOnce(fallbackService); // Second call succeeds

      // Act & Assert
      await expect(orchestrator.executeWorkflow(testCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle partial workflow failure gracefully', async () => {
      // Arrange - Coding succeeds, reviewing fails
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback')
        .mockResolvedValueOnce(mockOpenRouterService) // Coding agent succeeds
        .mockResolvedValueOnce(createMockLLMService('OpenRouter', true)); // Reviewing agent fails

      // Act & Assert
      await expect(orchestrator.executeWorkflow(testCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should collect metrics throughout workflow execution', async () => {
      // Act
      await orchestrator.executeWorkflow(testCodingRequest);
      const metrics = orchestrator.getMetrics();

      // Assert
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        providerUsed: 'multiple',
        tokensUsed: 0, // Mock doesn't track tokens
        cacheHitRate: 0,
        errorRate: 0
      });
      expect(metrics[0].executionTime).toBeGreaterThan(0);
      expect(metrics[0].workflowId).toBeDefined();
    });

    it('should handle different programming languages', async () => {
      // Arrange
      const pythonRequest: CodingRequest = {
        ...testCodingRequest,
        language: 'python'
      };

      // Act
      const result = await orchestrator.executeWorkflow(pythonRequest);

      // Assert
      expect(result.originalCode.language).toBe('python');
      expect(result.finalCode.language).toBe('python');
    });

    it('should handle complex coding requests with multiple requirements', async () => {
      // Arrange
      const complexRequest: CodingRequest = {
        task: 'Create a user authentication system',
        requirements: [
          'Should hash passwords securely',
          'Should validate email formats',
          'Should handle login attempts',
          'Should support password reset',
          'Should implement rate limiting'
        ],
        language: 'typescript',
        framework: 'express',
        style: {
          indentation: 'spaces',
          indentSize: 2,
          maxLineLength: 120,
          naming: 'camelCase',
          semicolons: true,
          quotes: 'single'
        },
        constraints: [
          'Must use bcrypt for password hashing',
          'Must validate all inputs',
          'Must implement proper error handling'
        ]
      };

      // Act
      const result = await orchestrator.executeWorkflow(complexRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.originalCode.metadata.complexity).toBeDefined();
      expect(result.review.reviewNotes).toBeDefined();
      expect(result.finalCode).toBeDefined();
    });
  });

  describe('Provider Fallback Scenarios', () => {
    it('should successfully fallback when primary provider is unhealthy', async () => {
      // Arrange
      const unhealthyService = createMockLLMService('OpenRouter', true);
      const healthyFallback = createMockLLMService('Gemini');
      
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback')
        .mockResolvedValue(healthyFallback);

      // Act
      const result = await orchestrator.executeWorkflow(testCodingRequest);

      // Assert
      expect(result).toBeDefined();
      expect(healthyFallback.generateCompletion).toHaveBeenCalled();
    });

    it('should handle cascading provider failures', async () => {
      // Arrange
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback')
        .mockRejectedValue(new LLMError(
          ErrorType.PROVIDER_UNAVAILABLE,
          'All providers unavailable',
          'factory',
          false
        ));

      // Act & Assert
      await expect(orchestrator.executeWorkflow(testCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should track provider usage in metrics', async () => {
      // Arrange
      const geminiService = createMockLLMService('Gemini');
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback').mockResolvedValue(geminiService);

      // Act
      await orchestrator.executeWorkflow(testCodingRequest);
      const metrics = orchestrator.getMetrics();

      // Assert
      expect(metrics[0].providerUsed).toBe('multiple');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle malformed LLM responses gracefully', async () => {
      // Arrange
      const malformedService = {
        ...mockOpenRouterService,
        generateCompletion: vi.fn().mockResolvedValue({
          content: 'Invalid JSON response that cannot be parsed',
          model: 'test-model',
          tokensUsed: 50
        })
      };
      
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback').mockResolvedValue(malformedService);

      // Act & Assert
      await expect(orchestrator.executeWorkflow(testCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle network timeouts during workflow', async () => {
      // Arrange
      const timeoutService = {
        ...mockOpenRouterService,
        generateCompletion: vi.fn().mockRejectedValue(
          new LLMError(ErrorType.TIMEOUT_ERROR, 'Request timeout', 'test-provider', true)
        )
      };
      
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback').mockResolvedValue(timeoutService);

      // Act & Assert
      await expect(orchestrator.executeWorkflow(testCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle rate limiting scenarios', async () => {
      // Arrange
      const rateLimitedService = {
        ...mockOpenRouterService,
        generateCompletion: vi.fn().mockRejectedValue(
          new LLMError(ErrorType.API_RATE_LIMIT, 'Rate limit exceeded', 'test-provider', true)
        )
      };
      
      vi.spyOn(LLMServiceFactory, 'getServiceWithFallback').mockResolvedValue(rateLimitedService);

      // Act & Assert
      await expect(orchestrator.executeWorkflow(testCodingRequest)).rejects.toThrow(LLMError);
    });
  });

  describe('Performance and Metrics', () => {
    it('should complete workflow within reasonable time limits', async () => {
      // Act
      const startTime = Date.now();
      await orchestrator.executeWorkflow(testCodingRequest);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert - Should complete within 5 seconds for mock services
      expect(executionTime).toBeLessThan(5000);
    });

    it('should track multiple workflow executions', async () => {
      // Act
      await orchestrator.executeWorkflow(testCodingRequest);
      await orchestrator.executeWorkflow(testCodingRequest);
      await orchestrator.executeWorkflow(testCodingRequest);
      
      const metrics = orchestrator.getMetrics();

      // Assert
      expect(metrics).toHaveLength(3);
      expect(metrics.every(m => m.workflowId)).toBe(true);
      expect(new Set(metrics.map(m => m.workflowId)).size).toBe(3); // All unique IDs
    });

    it('should limit metrics storage to prevent memory issues', async () => {
      // Act - Execute more than the limit (100)
      const promises = Array.from({ length: 105 }, () => 
        orchestrator.executeWorkflow(testCodingRequest)
      );
      await Promise.all(promises);
      
      const metrics = orchestrator.getMetrics();

      // Assert
      expect(metrics).toHaveLength(100); // Should be capped at 100
    });
  });
});
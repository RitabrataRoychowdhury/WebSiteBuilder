import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowOrchestratorService } from '../services/workflowOrchestrator';
import { CodingAgentService } from '../services/codingAgent';
import { ReviewingAgentService } from '../services/reviewingAgent';
import { CodingRequest, CodeResult, ReviewResult } from '../types/workflow';
import { LLMError, ErrorType } from '../types/llm';

// Mock the agent services
vi.mock('../services/codingAgent');
vi.mock('../services/reviewingAgent');

describe('WorkflowOrchestratorService', () => {
  let orchestrator: WorkflowOrchestratorService;
  let mockCodingAgent: vi.Mocked<CodingAgentService>;
  let mockReviewingAgent: vi.Mocked<ReviewingAgentService>;

  const mockCodingRequest: CodingRequest = {
    task: 'Create a simple calculator function',
    requirements: ['Should handle basic arithmetic', 'Should validate inputs'],
    language: 'typescript',
    framework: 'none',
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
      dependencies: [],
      estimatedTime: 5
    }
  };

  const mockReviewResult: ReviewResult = {
    originalCode: mockCodeResult,
    reviewNotes: [{
      type: 'suggestion',
      message: 'Consider adding input validation',
      severity: 'low',
      category: 'maintainability'
    }],
    suggestions: [{
      title: 'Add input validation',
      description: 'Validate that inputs are numbers',
      impact: 'medium',
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mocked instances
    mockCodingAgent = {
      generateCode: vi.fn(),
      getPromptTemplateId: vi.fn().mockReturnValue('coding-agent-default'),
      setPromptTemplateId: vi.fn()
    } as any;

    mockReviewingAgent = {
      reviewCode: vi.fn(),
      getPromptTemplateId: vi.fn().mockReturnValue('reviewing-agent-default'),
      setPromptTemplateId: vi.fn()
    } as any;

    // Mock the constructors
    vi.mocked(CodingAgentService).mockImplementation(() => mockCodingAgent);
    vi.mocked(ReviewingAgentService).mockImplementation(() => mockReviewingAgent);

    orchestrator = new WorkflowOrchestratorService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeWorkflow', () => {
    it('should execute complete workflow successfully', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockCodeResult), 10))
      );
      mockReviewingAgent.reviewCode.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockReviewResult), 10))
      );

      // Act
      const result = await orchestrator.executeWorkflow(mockCodingRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.originalCode).toEqual(mockCodeResult);
      expect(result.review).toEqual(mockReviewResult);
      expect(result.finalCode).toEqual(mockCodeResult); // No improved code in mock
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.providerUsed).toBe('multiple');
      expect(result.workflowId).toMatch(/^workflow_\d+_[a-z0-9]+$/);

      expect(mockCodingAgent.generateCode).toHaveBeenCalledWith(mockCodingRequest);
      expect(mockReviewingAgent.reviewCode).toHaveBeenCalledWith(mockCodeResult, mockCodingRequest);
    });

    it('should use improved code when available', async () => {
      // Arrange
      const improvedCode: CodeResult = {
        ...mockCodeResult,
        code: 'function add(a: number, b: number): number { if (typeof a !== "number" || typeof b !== "number") throw new Error("Invalid input"); return a + b; }'
      };
      
      const reviewWithImprovedCode: ReviewResult = {
        ...mockReviewResult,
        improvedCode
      };

      mockCodingAgent.generateCode.mockResolvedValue(mockCodeResult);
      mockReviewingAgent.reviewCode.mockResolvedValue(reviewWithImprovedCode);

      // Act
      const result = await orchestrator.executeWorkflow(mockCodingRequest);

      // Assert
      expect(result.finalCode).toEqual(improvedCode);
    });

    it('should handle coding agent failure', async () => {
      // Arrange
      const error = new LLMError(ErrorType.API_ERROR, 'API failed', 'test-provider', true);
      mockCodingAgent.generateCode.mockRejectedValue(error);

      // Act & Assert
      await expect(orchestrator.executeWorkflow(mockCodingRequest)).rejects.toThrow(LLMError);
      expect(mockReviewingAgent.reviewCode).not.toHaveBeenCalled();
    });

    it('should handle reviewing agent failure', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockResolvedValue(mockCodeResult);
      const error = new LLMError(ErrorType.VALIDATION_ERROR, 'Review failed', 'test-provider', true);
      mockReviewingAgent.reviewCode.mockRejectedValue(error);

      // Act & Assert
      await expect(orchestrator.executeWorkflow(mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle generic errors', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockRejectedValue(new Error('Generic error'));

      // Act & Assert
      await expect(orchestrator.executeWorkflow(mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should record metrics for successful execution', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockCodeResult), 10))
      );
      mockReviewingAgent.reviewCode.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockReviewResult), 10))
      );

      // Act
      await orchestrator.executeWorkflow(mockCodingRequest);
      const metrics = orchestrator.getMetrics();

      // Assert
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        providerUsed: 'multiple',
        tokensUsed: 0,
        cacheHitRate: 0,
        errorRate: 0
      });
      expect(metrics[0].executionTime).toBeGreaterThan(0);
      expect(metrics[0].workflowId).toMatch(/^workflow_\d+_[a-z0-9]+$/);
    });

    it('should record metrics for failed execution', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockRejectedValue(new Error('Test error'));

      // Act
      try {
        await orchestrator.executeWorkflow(mockCodingRequest);
      } catch {
        // Expected to fail
      }

      const metrics = orchestrator.getMetrics();

      // Assert
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        providerUsed: 'unknown',
        tokensUsed: 0,
        cacheHitRate: 0,
        errorRate: 1
      });
    });
  });

  describe('getCodingAgent', () => {
    it('should return coding agent instance', () => {
      const agent = orchestrator.getCodingAgent();
      expect(agent).toBe(mockCodingAgent);
    });
  });

  describe('getReviewingAgent', () => {
    it('should return reviewing agent instance', () => {
      const agent = orchestrator.getReviewingAgent();
      expect(agent).toBe(mockReviewingAgent);
    });
  });

  describe('metrics management', () => {
    it('should clear metrics', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockResolvedValue(mockCodeResult);
      mockReviewingAgent.reviewCode.mockResolvedValue(mockReviewResult);

      // Act
      await orchestrator.executeWorkflow(mockCodingRequest);
      expect(orchestrator.getMetrics()).toHaveLength(1);
      
      orchestrator.clearMetrics();
      
      // Assert
      expect(orchestrator.getMetrics()).toHaveLength(0);
    });

    it('should limit metrics to 100 entries', async () => {
      // Arrange
      mockCodingAgent.generateCode.mockResolvedValue(mockCodeResult);
      mockReviewingAgent.reviewCode.mockResolvedValue(mockReviewResult);

      // Act - Execute 105 workflows
      for (let i = 0; i < 105; i++) {
        await orchestrator.executeWorkflow(mockCodingRequest);
      }

      // Assert
      expect(orchestrator.getMetrics()).toHaveLength(100);
    });
  });
});
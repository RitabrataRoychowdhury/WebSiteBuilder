import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodingAgentService } from '../services/codingAgent';
import { LLMServiceFactory } from '../services/llmServiceFactory';
import { PromptManager } from '../services/promptManager';
import { CodingRequest } from '../types/workflow';
import { LLMService, LLMResponse, LLMError, ErrorType } from '../types/llm';

// Mock dependencies
vi.mock('../services/llmServiceFactory');
vi.mock('../services/promptManager');

describe('CodingAgentService', () => {
  let codingAgent: CodingAgentService;
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
    constraints: ['No external dependencies', 'Must be pure functions']
  };

  const mockLLMResponse: LLMResponse = {
    content: JSON.stringify({
      code: 'function add(a: number, b: number): number {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new Error("Invalid input");\n  }\n  return a + b;\n}',
      explanation: 'A simple addition function with input validation',
      files: [{
        path: 'calculator.ts',
        content: 'function add(a: number, b: number): number {\n  if (typeof a !== "number" || typeof b !== "number") {\n    throw new Error("Invalid input");\n  }\n  return a + b;\n}'
      }],
      metadata: {
        linesOfCode: 5,
        complexity: 'low',
        dependencies: [],
        estimatedTime: 10
      }
    }),
    model: 'test-model',
    tokensUsed: 150
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
    vi.mocked(PromptManager.getPrompt).mockReturnValue('Test prompt with variables');

    codingAgent = new CodingAgentService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCode', () => {
    it('should generate code successfully with JSON response', async () => {
      // Arrange
      mockLLMService.generateCompletion.mockResolvedValue(mockLLMResponse);

      // Act
      const result = await codingAgent.generateCode(mockCodingRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.code).toContain('function add');
      expect(result.language).toBe('typescript');
      expect(result.explanation).toBe('A simple addition function with input validation');
      expect(result.files).toHaveLength(1);
      expect(result.metadata.linesOfCode).toBe(5);
      expect(result.metadata.complexity).toBe('low');

      expect(LLMServiceFactory.getServiceWithFallback).toHaveBeenCalled();
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('coding-agent-default', expect.any(Object));
      expect(mockLLMService.generateCompletion).toHaveBeenCalledWith(
        'Test prompt with variables',
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 4000,
          retryAttempts: 3
        })
      );
    });

    it('should handle markdown code block response', async () => {
      // Arrange
      const markdownResponse: LLMResponse = {
        ...mockLLMResponse,
        content: `Here's the code you requested:

\`\`\`typescript
function multiply(a: number, b: number): number {
  return a * b;
}
\`\`\`

This function multiplies two numbers.`
      };
      mockLLMService.generateCompletion.mockResolvedValue(markdownResponse);

      // Act
      const result = await codingAgent.generateCode(mockCodingRequest);

      // Assert
      expect(result.code).toContain('function multiply');
      expect(result.explanation).toContain('This function multiplies two numbers');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('generated_code.ts');
    });

    it('should handle LLM service errors', async () => {
      // Arrange
      const llmError = new LLMError(ErrorType.API_ERROR, 'API failed', 'test-provider', true);
      mockLLMService.generateCompletion.mockRejectedValue(llmError);

      // Act & Assert
      await expect(codingAgent.generateCode(mockCodingRequest)).rejects.toThrow(LLMError);
      expect(mockLLMService.generateCompletion).toHaveBeenCalled();
    });

    it('should handle generic errors', async () => {
      // Arrange
      mockLLMService.generateCompletion.mockRejectedValue(new Error('Generic error'));

      // Act & Assert
      await expect(codingAgent.generateCode(mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle invalid JSON response', async () => {
      // Arrange
      const invalidResponse: LLMResponse = {
        ...mockLLMResponse,
        content: 'Invalid JSON content'
      };
      mockLLMService.generateCompletion.mockResolvedValue(invalidResponse);

      // Act & Assert
      await expect(codingAgent.generateCode(mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should handle response with no code blocks', async () => {
      // Arrange
      const noCodeResponse: LLMResponse = {
        ...mockLLMResponse,
        content: 'This response has no code blocks at all.'
      };
      mockLLMService.generateCompletion.mockResolvedValue(noCodeResponse);

      // Act & Assert
      await expect(codingAgent.generateCode(mockCodingRequest)).rejects.toThrow(LLMError);
    });

    it('should prepare prompt variables correctly', async () => {
      // Arrange
      mockLLMService.generateCompletion.mockResolvedValue(mockLLMResponse);

      // Act
      await codingAgent.generateCode(mockCodingRequest);

      // Assert
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('coding-agent-default', {
        task: 'Create a simple calculator function',
        requirements: '- Should handle basic arithmetic\n- Should validate inputs',
        language: 'typescript',
        framework: '**Framework:** React',
        indentation: 'spaces',
        indentSize: 2,
        indentationType: 'spaces',
        maxLineLength: 100,
        naming: 'camelCase',
        semicolons: 'required',
        quotes: 'single',
        constraints: '- No external dependencies\n- Must be pure functions'
      });
    });

    it('should handle request without framework', async () => {
      // Arrange
      const requestWithoutFramework = { ...mockCodingRequest, framework: undefined };
      mockLLMService.generateCompletion.mockResolvedValue(mockLLMResponse);

      // Act
      await codingAgent.generateCode(requestWithoutFramework);

      // Assert
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('coding-agent-default', 
        expect.objectContaining({
          framework: ''
        })
      );
    });

    it('should generate correct file extensions for different languages', async () => {
      // Arrange
      const pythonRequest = { ...mockCodingRequest, language: 'python' };
      const pythonResponse = {
        ...mockLLMResponse,
        content: '```python\ndef add(a, b):\n    return a + b\n```'
      };
      mockLLMService.generateCompletion.mockResolvedValue(pythonResponse);

      // Act
      const result = await codingAgent.generateCode(pythonRequest);

      // Assert
      expect(result.files[0].path).toBe('generated_code.py');
    });

    it('should calculate metadata correctly', async () => {
      // Arrange
      const complexCodeResponse = {
        ...mockLLMResponse,
        content: `\`\`\`typescript
class Calculator {
  async add(a: number, b: number): Promise<number> {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Invalid input');
    }
    return a + b;
  }
  
  async multiply(a: number, b: number): Promise<number> {
    return a * b;
  }
}
\`\`\``
      };
      mockLLMService.generateCompletion.mockResolvedValue(complexCodeResponse);

      // Act
      const result = await codingAgent.generateCode(mockCodingRequest);

      // Assert
      expect(result.metadata.linesOfCode).toBeGreaterThan(5);
      expect(result.metadata.complexity).toBe('medium'); // Should detect class/async keywords
      expect(result.metadata.estimatedTime).toBeGreaterThanOrEqual(5);
    });
  });

  describe('prompt template management', () => {
    it('should get current prompt template ID', () => {
      expect(codingAgent.getPromptTemplateId()).toBe('coding-agent-default');
    });

    it('should set new prompt template ID', () => {
      codingAgent.setPromptTemplateId('custom-template');
      expect(codingAgent.getPromptTemplateId()).toBe('custom-template');
    });

    it('should use custom template ID when generating code', async () => {
      // Arrange
      codingAgent.setPromptTemplateId('custom-template');
      mockLLMService.generateCompletion.mockResolvedValue(mockLLMResponse);

      // Act
      await codingAgent.generateCode(mockCodingRequest);

      // Assert
      expect(PromptManager.getPrompt).toHaveBeenCalledWith('custom-template', expect.any(Object));
    });
  });
});
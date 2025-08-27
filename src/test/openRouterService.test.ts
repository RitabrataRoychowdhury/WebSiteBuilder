import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService } from '../services/openRouterService';
import { LLMError, ErrorType } from '../types/llm';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
});

describe('OpenRouterService', () => {
  let service: OpenRouterService;
  const mockApiKey = 'sk-or-v1-test-key';

  const mockSuccessResponse = {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: 1234567890,
    model: 'anthropic/claude-3.5-sonnet',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'Test response content'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenRouterService(mockApiKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create service with default configuration', () => {
      const providerInfo = service.getProviderInfo();
      expect(providerInfo.name).toBe('OpenRouter');
      expect(providerInfo.defaultModel).toBe('anthropic/claude-3.5-sonnet');
      expect(providerInfo.models).toContain('anthropic/claude-3.5-sonnet');
    });

    it('should create service with custom base URL', () => {
      const customUrl = 'https://custom.openrouter.ai/api/v1/chat/completions';
      const customService = new OpenRouterService(mockApiKey, customUrl);
      expect(customService).toBeDefined();
    });
  });

  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      // Act
      const result = await service.generateCompletion('Test prompt');

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe('Test response content');
      expect(result.model).toBe('anthropic/claude-3.5-sonnet');
      expect(result.tokensUsed).toBe(30);
      expect(result.finishReason).toBe('stop');
      expect(result.metadata).toMatchObject({
        promptTokens: 10,
        completionTokens: 20,
        id: 'chatcmpl-test'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'LLM Workflow System'
          }),
          body: expect.stringContaining('Test prompt')
        })
      );
    });

    it('should handle custom configuration', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const config = {
        model: 'openai/gpt-4o',
        temperature: 0.5,
        maxTokens: 2000
      };

      // Act
      await service.generateCompletion('Test prompt', config);

      // Assert
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        model: 'openai/gpt-4o',
        temperature: 0.5,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: 'Test prompt'
        }]
      });
    });

    it('should handle API error responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should handle network errors', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should handle response with no choices', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockSuccessResponse,
          choices: []
        })
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should handle timeout', async () => {
      // Arrange
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => {
          // Never resolve to simulate timeout
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockSuccessResponse)
          }), 1000); // Much longer than timeout
        })
      );

      // Act & Assert
      await expect(
        service.generateCompletion('Test prompt', { timeout: 100 })
      ).rejects.toThrow();
    }, 10000);

    it('should validate response content', async () => {
      // Arrange
      const invalidResponse = {
        ...mockSuccessResponse,
        choices: [{
          ...mockSuccessResponse.choices[0],
          message: {
            role: 'assistant',
            content: '' // Empty content should fail validation
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      });

      // Mock validateResponse to return false for empty content
      vi.spyOn(service, 'validateResponse').mockReturnValue(false);

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should handle rate limiting', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider information', () => {
      const info = service.getProviderInfo();
      
      expect(info).toMatchObject({
        name: 'OpenRouter',
        defaultModel: 'anthropic/claude-3.5-sonnet',
        maxTokens: 200000,
        supportsStreaming: true
      });
      expect(info.models).toContain('anthropic/claude-3.5-sonnet');
      expect(info.models).toContain('openai/gpt-4o');
    });
  });

  describe('static create method', () => {
    it('should create service with provided API key', () => {
      const service = OpenRouterService.create('test-key');
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it('should create service with environment variable', () => {
      // Mock environment variable
      vi.stubEnv('VITE_OPENROUTER_API_KEY', 'env-test-key');
      
      const service = OpenRouterService.create();
      expect(service).toBeInstanceOf(OpenRouterService);
      
      vi.unstubAllEnvs();
    });

    it('should throw error when no API key is available', () => {
      // Ensure no environment variable is set
      vi.stubEnv('VITE_OPENROUTER_API_KEY', '');
      
      expect(() => OpenRouterService.create()).toThrow(LLMError);
      expect(() => OpenRouterService.create()).toThrow('OpenRouter API key is required');
      
      vi.unstubAllEnvs();
    });
  });

  describe('error handling', () => {
    it('should handle JSON parsing errors', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should handle fetch abort signal', async () => {
      // Arrange
      mockFetch.mockImplementationOnce((url, options) => {
        // Simulate abort
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            throw new Error('Request aborted');
          });
          setTimeout(() => options.signal.dispatchEvent(new Event('abort')), 10);
        }
        return new Promise(() => {}); // Never resolves
      });

      // Act & Assert
      await expect(
        service.generateCompletion('Test prompt', { timeout: 50 })
      ).rejects.toThrow();
    });
  });
});
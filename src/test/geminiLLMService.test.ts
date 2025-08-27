import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiLLMService } from '../services/geminiLLMService';
import { LLMError, ErrorType } from '../types/llm';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GeminiLLMService', () => {
  let service: GeminiLLMService;
  const mockApiKey = 'AIzaSy-test-key';

  const mockSuccessResponse = {
    candidates: [{
      content: {
        parts: [{
          text: 'Test response from Gemini'
        }]
      },
      finishReason: 'STOP'
    }],
    usageMetadata: {
      promptTokenCount: 15,
      candidatesTokenCount: 25,
      totalTokenCount: 40
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GeminiLLMService(mockApiKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create service with default model', () => {
      const providerInfo = service.getProviderInfo();
      expect(providerInfo.name).toBe('Gemini');
      expect(providerInfo.defaultModel).toBe('gemini-2.0-flash');
      expect(providerInfo.models).toContain('gemini-2.0-flash');
    });

    it('should create service with custom model', () => {
      const customService = new GeminiLLMService(mockApiKey, 'gemini-1.5-pro');
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
      expect(result.content).toBe('Test response from Gemini');
      expect(result.model).toBe('gemini-2.0-flash');
      expect(result.tokensUsed).toBe(40);
      expect(result.finishReason).toBe('STOP');
      expect(result.metadata).toMatchObject({
        promptTokens: 15,
        completionTokens: 25
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test prompt')
        })
      );
    });

    it('should include API key in URL', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      // Act
      await service.generateCompletion('Test prompt');

      // Assert
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain(`key=${mockApiKey}`);
    });

    it('should handle custom configuration', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse)
      });

      const config = {
        model: 'gemini-1.5-pro',
        temperature: 0.3,
        maxTokens: 1000
      };

      // Act
      await service.generateCompletion('Test prompt', config);

      // Assert
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        contents: [{
          parts: [{
            text: 'Test prompt'
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000
        }
      });
    });

    it('should handle API error responses', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
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

    it('should handle response with no candidates', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: []
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
        candidates: [{
          content: {
            parts: [{
              text: '' // Empty content should fail validation
            }]
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

    it('should handle response without usage metadata', async () => {
      // Arrange
      const responseWithoutUsage = {
        candidates: [{
          content: {
            parts: [{
              text: 'Test response'
            }]
          },
          finishReason: 'STOP'
        }]
        // No usageMetadata
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithoutUsage)
      });

      // Act
      const result = await service.generateCompletion('Test prompt');

      // Assert
      expect(result.tokensUsed).toBeUndefined();
      expect(result.metadata.promptTokens).toBeUndefined();
      expect(result.metadata.completionTokens).toBeUndefined();
    });

    it('should handle rate limiting (429 error)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should handle authentication errors (401)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });
  });

  describe('getProviderInfo', () => {
    it('should return correct provider information', () => {
      const info = service.getProviderInfo();
      
      expect(info).toMatchObject({
        name: 'Gemini',
        defaultModel: 'gemini-2.0-flash',
        maxTokens: 8192,
        supportsStreaming: false
      });
      expect(info.models).toContain('gemini-2.0-flash');
      expect(info.models).toContain('gemini-1.5-pro');
      expect(info.models).toContain('gemini-1.5-flash');
    });
  });

  describe('static create method', () => {
    it('should create service with provided API key', () => {
      const service = GeminiLLMService.create('test-key');
      expect(service).toBeInstanceOf(GeminiLLMService);
    });

    it('should create service with custom model', () => {
      const service = GeminiLLMService.create('test-key', 'gemini-1.5-pro');
      expect(service).toBeInstanceOf(GeminiLLMService);
    });

    it('should create service with environment variable', () => {
      // Mock environment variable
      vi.stubEnv('VITE_GEMINI_API_KEY', 'env-test-key');
      
      const service = GeminiLLMService.create();
      expect(service).toBeInstanceOf(GeminiLLMService);
      
      vi.unstubAllEnvs();
    });

    it('should throw error when no API key is available', () => {
      // Ensure no environment variable is set
      vi.stubEnv('VITE_GEMINI_API_KEY', '');
      
      expect(() => GeminiLLMService.create()).toThrow(LLMError);
      expect(() => GeminiLLMService.create()).toThrow('Gemini API key is required');
      
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

    it('should handle malformed response structure', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              // Missing parts array
            }
          }]
        })
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow();
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
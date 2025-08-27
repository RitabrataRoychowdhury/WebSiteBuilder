import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMServiceFactory } from '../services/llmServiceFactory';
import { OpenRouterService } from '../services/openRouterService';
import { GeminiLLMService } from '../services/geminiLLMService';
import { LLMError, ErrorType } from '../types/llm';

// Mock the service classes
vi.mock('../services/openRouterService');
vi.mock('../services/geminiLLMService');

describe('LLMServiceFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset environment variables
    vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', '');
    vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', '');
    vi.stubEnv('VITE_OPENROUTER_API_KEY', '');
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('getService', () => {
    it('should create OpenRouter service', async () => {
      // Arrange
      const mockService = { 
        name: 'OpenRouter',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(OpenRouterService.create).mockReturnValue(mockService as any);

      // Act
      const service = await LLMServiceFactory.getService('openrouter');

      // Assert
      expect(service).toBe(mockService);
      expect(OpenRouterService.create).toHaveBeenCalled();
      expect(mockService.isHealthy).toHaveBeenCalled();
    });

    it('should create Gemini service', async () => {
      // Arrange
      const mockService = { 
        name: 'Gemini',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(GeminiLLMService.create).mockReturnValue(mockService as any);

      // Act
      const service = await LLMServiceFactory.getService('gemini');

      // Assert
      expect(service).toBe(mockService);
      expect(GeminiLLMService.create).toHaveBeenCalled();
      expect(mockService.isHealthy).toHaveBeenCalled();
    });

    it('should throw error for unsupported provider', async () => {
      // Act & Assert
      await expect(LLMServiceFactory.getService('unsupported' as any)).rejects.toThrow(LLMError);
    });

    it('should handle service creation errors', async () => {
      // Arrange
      vi.mocked(OpenRouterService.create).mockImplementation(() => {
        throw new Error('API key missing');
      });

      // Act & Assert
      await expect(LLMServiceFactory.getService('openrouter')).rejects.toThrow(LLMError);
    });
  });

  describe('getServiceWithFallback', () => {
    it('should return primary service when available', async () => {
      // Arrange
      vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', 'openrouter');
      vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', 'gemini');
      
      const mockPrimaryService = { 
        name: 'OpenRouter',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(OpenRouterService.create).mockReturnValue(mockPrimaryService as any);

      // Act
      const service = await LLMServiceFactory.getServiceWithFallback();

      // Assert
      expect(service).toBe(mockPrimaryService);
      expect(OpenRouterService.create).toHaveBeenCalled();
      expect(GeminiLLMService.create).not.toHaveBeenCalled();
    });

    it('should fallback to secondary service when primary fails', async () => {
      // Arrange
      vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', 'openrouter');
      vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', 'gemini');
      
      const mockFallbackService = { 
        name: 'Gemini',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(OpenRouterService.create).mockImplementation(() => {
        throw new Error('Primary service failed');
      });
      vi.mocked(GeminiLLMService.create).mockReturnValue(mockFallbackService as any);

      // Act
      const service = await LLMServiceFactory.getServiceWithFallback();

      // Assert
      expect(service).toBe(mockFallbackService);
      expect(OpenRouterService.create).toHaveBeenCalled();
      expect(GeminiLLMService.create).toHaveBeenCalled();
    });

    it('should use default providers when environment variables not set', async () => {
      // Arrange - environment variables are empty by default in beforeEach
      const mockDefaultService = { 
        name: 'OpenRouter',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(OpenRouterService.create).mockReturnValue(mockDefaultService as any);

      // Act
      const service = await LLMServiceFactory.getServiceWithFallback();

      // Assert
      expect(service).toBe(mockDefaultService);
      expect(OpenRouterService.create).toHaveBeenCalled();
    });

    it('should throw error when both primary and fallback fail', async () => {
      // Arrange
      vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', 'openrouter');
      vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', 'gemini');
      
      vi.mocked(OpenRouterService.create).mockImplementation(() => {
        throw new Error('Primary failed');
      });
      vi.mocked(GeminiLLMService.create).mockImplementation(() => {
        throw new Error('Fallback failed');
      });

      // Act & Assert
      await expect(LLMServiceFactory.getServiceWithFallback()).rejects.toThrow(LLMError);
    });

    it('should handle invalid provider names in environment', async () => {
      // Arrange
      vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', 'invalid-provider');
      vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', 'gemini');
      
      const mockFallbackService = { 
        name: 'Gemini',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(GeminiLLMService.create).mockReturnValue(mockFallbackService as any);

      // Act
      const service = await LLMServiceFactory.getServiceWithFallback();

      // Assert
      expect(service).toBe(mockFallbackService);
      expect(GeminiLLMService.create).toHaveBeenCalled();
    });

    it('should handle case where fallback provider is also invalid', async () => {
      // Arrange
      vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', 'invalid-primary');
      vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', 'invalid-fallback');
      
      // Should fall back to default (openrouter)
      const mockDefaultService = { 
        name: 'OpenRouter',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(OpenRouterService.create).mockReturnValue(mockDefaultService as any);

      // Act
      const service = await LLMServiceFactory.getServiceWithFallback();

      // Assert
      expect(service).toBe(mockDefaultService);
      expect(OpenRouterService.create).toHaveBeenCalled();
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = LLMServiceFactory.getSupportedProviders();
      
      expect(providers).toContain('openrouter');
      expect(providers).toContain('gemini');
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe('isProviderSupported', () => {
    it('should return true for supported providers', () => {
      expect(LLMServiceFactory.isProviderSupported('openrouter')).toBe(true);
      expect(LLMServiceFactory.isProviderSupported('gemini')).toBe(true);
    });

    it('should return false for unsupported providers', () => {
      expect(LLMServiceFactory.isProviderSupported('unsupported' as any)).toBe(false);
      expect(LLMServiceFactory.isProviderSupported('claude' as any)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(LLMServiceFactory.isProviderSupported('OpenRouter' as any)).toBe(false);
      expect(LLMServiceFactory.isProviderSupported('GEMINI' as any)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should wrap service creation errors in LLMError', async () => {
      // Arrange
      vi.mocked(OpenRouterService.create).mockImplementation(() => {
        throw new Error('Configuration error');
      });

      // Act & Assert
      await expect(LLMServiceFactory.getService('openrouter')).rejects.toThrow(LLMError);
      
      try {
        await LLMServiceFactory.getService('openrouter');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMError);
        expect((error as LLMError).type).toBe(ErrorType.CONFIGURATION_ERROR);
        expect((error as LLMError).message).toContain('Failed to create LLM service');
      }
    });

    it('should preserve LLMError when service throws LLMError', async () => {
      // Arrange
      const originalError = new LLMError(
        ErrorType.AUTHENTICATION_ERROR,
        'API key invalid',
        'openrouter',
        false
      );
      vi.mocked(OpenRouterService.create).mockImplementation(() => {
        throw originalError;
      });

      // Act & Assert
      await expect(LLMServiceFactory.getService('openrouter')).rejects.toThrow(originalError);
    });
  });

  describe('configuration validation', () => {
    it('should validate provider configuration before creation', async () => {
      // Arrange
      vi.stubEnv('VITE_OPENROUTER_API_KEY', 'valid-key');
      const mockService = { 
        name: 'OpenRouter',
        isHealthy: vi.fn().mockResolvedValue(true)
      };
      vi.mocked(OpenRouterService.create).mockReturnValue(mockService as any);

      // Act
      const service = await LLMServiceFactory.getService('openrouter');

      // Assert
      expect(service).toBe(mockService);
      expect(OpenRouterService.create).toHaveBeenCalled();
    });

    it('should handle missing API keys gracefully', async () => {
      // Arrange - no API keys set
      vi.mocked(OpenRouterService.create).mockImplementation(() => {
        throw new LLMError(
          ErrorType.AUTHENTICATION_ERROR,
          'API key required',
          'openrouter',
          false
        );
      });

      // Act & Assert
      await expect(LLMServiceFactory.getService('openrouter')).rejects.toThrow(LLMError);
    });
  });
});
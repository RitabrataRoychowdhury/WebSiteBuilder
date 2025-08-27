import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigurationManager, configManager } from '../services/configurationManager';

describe('ConfigurationManager', () => {
  let manager: ConfigurationManager;

  beforeEach(() => {
    // Reset environment variables
    vi.stubEnv('VITE_PRIMARY_LLM_PROVIDER', 'openrouter');
    vi.stubEnv('VITE_FALLBACK_LLM_PROVIDER', 'gemini');
    vi.stubEnv('VITE_ENABLE_FALLBACK', 'true');
    vi.stubEnv('VITE_DEFAULT_TEMPERATURE', '0.7');
    vi.stubEnv('VITE_DEFAULT_MAX_TOKENS', '4000');
    vi.stubEnv('VITE_DEFAULT_RETRY_ATTEMPTS', '3');
    vi.stubEnv('VITE_DEFAULT_TIMEOUT', '30000');
    vi.stubEnv('VITE_ENABLE_METRICS_COLLECTION', 'true');
    vi.stubEnv('VITE_MAX_METRICS_ENTRIES', '100');
    vi.stubEnv('VITE_ENABLE_CACHING', 'true');
    vi.stubEnv('VITE_HEALTH_CHECK_INTERVAL', '300000');
    vi.stubEnv('VITE_CACHE_TTL', '3600000');
    vi.stubEnv('VITE_OPENROUTER_API_KEY', 'test-openrouter-key');
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key');

    manager = ConfigurationManager.getInstance();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    manager.resetToDefaults();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should provide access via exported singleton', () => {
      expect(configManager).toBeInstanceOf(ConfigurationManager);
      expect(configManager).toBe(ConfigurationManager.getInstance());
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', () => {
      const config = manager.getConfiguration();

      expect(config.llmProviders.primaryProvider).toBe('openrouter');
      expect(config.llmProviders.fallbackProvider).toBe('gemini');
      expect(config.llmProviders.enableFallback).toBe(true);
      expect(config.llmProviders.defaultLLMConfig.temperature).toBe(0.7);
      expect(config.llmProviders.defaultLLMConfig.maxTokens).toBe(4000);
      expect(config.workflow.enableMetricsCollection).toBe(true);
      expect(config.workflow.maxMetricsEntries).toBe(100);
      expect(config.apiKeys.openrouter).toBe('test-openrouter-key');
      expect(config.apiKeys.gemini).toBe('test-gemini-key');
    });

    it('should use default values when environment variables are not set', () => {
      // Clear all environment variables
      vi.unstubAllEnvs();

      const newManager = ConfigurationManager.getInstance();
      const config = newManager.getConfiguration();

      expect(config.llmProviders.primaryProvider).toBe('openrouter');
      expect(config.llmProviders.fallbackProvider).toBe('gemini');
      expect(config.llmProviders.enableFallback).toBe(true);
      expect(config.llmProviders.defaultLLMConfig.temperature).toBe(0.7);
      expect(config.workflow.enableMetricsCollection).toBe(true);
      expect(config.apiKeys.openrouter).toBe('');
      expect(config.apiKeys.gemini).toBe('');
    });

    it('should handle boolean environment variables correctly', () => {
      vi.stubEnv('VITE_ENABLE_FALLBACK', 'false');
      vi.stubEnv('VITE_ENABLE_METRICS_COLLECTION', 'FALSE');
      vi.stubEnv('VITE_ENABLE_CACHING', 'True');

      manager.resetToDefaults();
      const config = manager.getConfiguration();

      expect(config.llmProviders.enableFallback).toBe(false);
      expect(config.workflow.enableMetricsCollection).toBe(false);
      expect(config.workflow.enableCaching).toBe(true);
    });

    it('should handle numeric environment variables correctly', () => {
      vi.stubEnv('VITE_DEFAULT_TEMPERATURE', '0.5');
      vi.stubEnv('VITE_DEFAULT_MAX_TOKENS', '2000');
      vi.stubEnv('VITE_MAX_METRICS_ENTRIES', '50');

      manager.resetToDefaults();
      const config = manager.getConfiguration();

      expect(config.llmProviders.defaultLLMConfig.temperature).toBe(0.5);
      expect(config.llmProviders.defaultLLMConfig.maxTokens).toBe(2000);
      expect(config.workflow.maxMetricsEntries).toBe(50);
    });

    it('should use defaults for invalid numeric values', () => {
      vi.stubEnv('VITE_DEFAULT_TEMPERATURE', 'invalid');
      vi.stubEnv('VITE_DEFAULT_MAX_TOKENS', 'not-a-number');

      manager.resetToDefaults();
      const config = manager.getConfiguration();

      expect(config.llmProviders.defaultLLMConfig.temperature).toBe(0.7);
      expect(config.llmProviders.defaultLLMConfig.maxTokens).toBe(4000);
    });
  });

  describe('Configuration Access Methods', () => {
    it('should return LLM provider configuration', () => {
      const llmConfig = manager.getLLMProviderConfig();

      expect(llmConfig.primaryProvider).toBe('openrouter');
      expect(llmConfig.fallbackProvider).toBe('gemini');
      expect(llmConfig.enableFallback).toBe(true);
      expect(llmConfig.defaultLLMConfig).toBeDefined();
    });

    it('should return workflow configuration', () => {
      const workflowConfig = manager.getWorkflowConfig();

      expect(workflowConfig.enableMetricsCollection).toBe(true);
      expect(workflowConfig.maxMetricsEntries).toBe(100);
      expect(workflowConfig.enableCaching).toBe(true);
    });

    it('should return performance configuration', () => {
      const perfConfig = manager.getPerformanceConfig();

      expect(perfConfig.healthCheckInterval).toBe(300000);
      expect(perfConfig.cacheTTL).toBe(3600000);
    });

    it('should return API keys', () => {
      expect(manager.getApiKey('openrouter')).toBe('test-openrouter-key');
      expect(manager.getApiKey('gemini')).toBe('test-gemini-key');
      expect(manager.getApiKey('nonexistent')).toBe('');
    });

    it('should check API key existence', () => {
      expect(manager.hasApiKey('openrouter')).toBe(true);
      expect(manager.hasApiKey('gemini')).toBe(true);
      expect(manager.hasApiKey('nonexistent')).toBe(false);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration partially', () => {
      manager.updateConfiguration({
        llmProviders: {
          primaryProvider: 'gemini',
          fallbackProvider: 'openrouter',
          enableFallback: false,
          defaultLLMConfig: {
            model: 'test-model',
            temperature: 0.5,
            maxTokens: 2000,
            retryAttempts: 2,
            timeout: 20000
          }
        }
      });

      const config = manager.getConfiguration();
      expect(config.llmProviders.primaryProvider).toBe('gemini');
      expect(config.llmProviders.fallbackProvider).toBe('openrouter');
      expect(config.llmProviders.enableFallback).toBe(false);
      expect(config.llmProviders.defaultLLMConfig.temperature).toBe(0.5);
      
      // Other configurations should remain unchanged
      expect(config.workflow.enableMetricsCollection).toBe(true);
    });

    it('should update API keys', () => {
      manager.updateConfiguration({
        apiKeys: {
          openrouter: 'new-openrouter-key',
          gemini: 'new-gemini-key'
        }
      });

      expect(manager.getApiKey('openrouter')).toBe('new-openrouter-key');
      expect(manager.getApiKey('gemini')).toBe('new-gemini-key');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const result = manager.validateConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing primary provider API key', () => {
      manager.updateConfiguration({
        apiKeys: { openrouter: '', gemini: 'test-key' }
      });

      const result = manager.validateConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing API key for primary provider: openrouter');
    });

    it('should warn about missing fallback provider API key', () => {
      manager.updateConfiguration({
        apiKeys: { openrouter: 'test-key', gemini: '' }
      });

      const result = manager.validateConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Missing API key for fallback provider: gemini');
    });

    it('should validate LLM configuration parameters', () => {
      manager.updateConfiguration({
        llmProviders: {
          primaryProvider: 'openrouter',
          fallbackProvider: 'gemini',
          enableFallback: true,
          defaultLLMConfig: {
            model: 'test',
            temperature: 3.0, // Invalid
            maxTokens: -100, // Invalid
            retryAttempts: 15, // Invalid
            timeout: 500 // Invalid
          }
        }
      });

      const result = manager.validateConfiguration();

      expect(result.warnings).toContain('Temperature should be between 0 and 2');
      expect(result.warnings).toContain('Max tokens should be between 1 and 200000');
      expect(result.warnings).toContain('Retry attempts should be between 0 and 10');
      expect(result.warnings).toContain('Timeout should be between 1000ms and 300000ms');
    });

    it('should validate workflow configuration', () => {
      manager.updateConfiguration({
        workflow: {
          enableMetricsCollection: true,
          maxMetricsEntries: 50000, // Invalid
          enableCaching: true
        }
      });

      const result = manager.validateConfiguration();

      expect(result.warnings).toContain('Max metrics entries should be between 1 and 10000');
    });

    it('should validate performance configuration', () => {
      manager.updateConfiguration({
        performance: {
          healthCheckInterval: 30000, // Invalid
          cacheTTL: 30000 // Invalid
        }
      });

      const result = manager.validateConfiguration();

      expect(result.warnings).toContain('Health check interval should be at least 60 seconds');
      expect(result.warnings).toContain('Cache TTL should be at least 60 seconds');
    });
  });

  describe('Configuration Export/Import', () => {
    it('should export configuration as JSON', () => {
      const exported = manager.exportConfiguration();
      const parsed = JSON.parse(exported);

      expect(parsed.llmProviders.primaryProvider).toBe('openrouter');
      expect(parsed.apiKeys.openrouter).toBe('[REDACTED]');
      expect(parsed.apiKeys.gemini).toBe('[REDACTED]');
    });

    it('should export empty API keys as empty strings', () => {
      manager.updateConfiguration({
        apiKeys: { openrouter: '', gemini: 'test-key' }
      });

      const exported = manager.exportConfiguration();
      const parsed = JSON.parse(exported);

      expect(parsed.apiKeys.openrouter).toBe('');
      expect(parsed.apiKeys.gemini).toBe('[REDACTED]');
    });

    it('should import configuration from JSON', () => {
      const importConfig = {
        llmProviders: {
          primaryProvider: 'gemini',
          enableFallback: false
        },
        workflow: {
          maxMetricsEntries: 50
        }
      };

      manager.importConfiguration(JSON.stringify(importConfig));
      const config = manager.getConfiguration();

      expect(config.llmProviders.primaryProvider).toBe('gemini');
      expect(config.llmProviders.enableFallback).toBe(false);
      expect(config.workflow.maxMetricsEntries).toBe(50);
    });

    it('should not import API keys for security', () => {
      const importConfig = {
        apiKeys: {
          openrouter: 'malicious-key',
          gemini: 'another-malicious-key'
        }
      };

      const originalKeys = {
        openrouter: manager.getApiKey('openrouter'),
        gemini: manager.getApiKey('gemini')
      };

      manager.importConfiguration(JSON.stringify(importConfig));

      expect(manager.getApiKey('openrouter')).toBe(originalKeys.openrouter);
      expect(manager.getApiKey('gemini')).toBe(originalKeys.gemini);
    });

    it('should handle invalid JSON during import', () => {
      expect(() => {
        manager.importConfiguration('invalid json');
      }).toThrow('Failed to import configuration');
    });
  });

  describe('Environment Information', () => {
    it('should provide environment information', () => {
      const envInfo = manager.getEnvironmentInfo();

      expect(envInfo).toHaveProperty('mode');
      expect(envInfo).toHaveProperty('isDevelopment');
      expect(envInfo).toHaveProperty('isProduction');
      expect(envInfo).toHaveProperty('baseUrl');
      expect(envInfo).toHaveProperty('version');
    });

    it('should detect development mode', () => {
      vi.stubEnv('MODE', 'development');
      expect(manager.isDevelopment()).toBe(true);
      expect(manager.isProduction()).toBe(false);
    });

    it('should detect production mode', () => {
      vi.stubEnv('MODE', 'production');
      expect(manager.isDevelopment()).toBe(false);
      expect(manager.isProduction()).toBe(true);
    });
  });

  describe('Configuration Reset', () => {
    it('should reset configuration to defaults', () => {
      // Modify configuration
      manager.updateConfiguration({
        llmProviders: {
          primaryProvider: 'gemini',
          fallbackProvider: 'openrouter',
          enableFallback: false,
          defaultLLMConfig: {
            model: 'custom',
            temperature: 0.1,
            maxTokens: 1000,
            retryAttempts: 1,
            timeout: 10000
          }
        }
      });

      // Reset to defaults
      manager.resetToDefaults();
      const config = manager.getConfiguration();

      expect(config.llmProviders.primaryProvider).toBe('openrouter');
      expect(config.llmProviders.fallbackProvider).toBe('gemini');
      expect(config.llmProviders.enableFallback).toBe(true);
      expect(config.llmProviders.defaultLLMConfig.temperature).toBe(0.7);
    });
  });
});
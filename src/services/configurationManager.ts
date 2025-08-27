import { ProviderType } from './llmServiceFactory';
import { LLMConfig } from '../types/llm';

export interface WorkflowConfig {
  enableMetricsCollection: boolean;
  maxMetricsEntries: number;
  enableCaching: boolean;
}

export interface PerformanceConfig {
  healthCheckInterval: number;
  cacheTTL: number;
}

export interface LLMProviderConfig {
  primaryProvider: ProviderType;
  fallbackProvider: ProviderType;
  enableFallback: boolean;
  defaultLLMConfig: LLMConfig;
}

export interface AppConfiguration {
  llmProviders: LLMProviderConfig;
  workflow: WorkflowConfig;
  performance: PerformanceConfig;
  apiKeys: Record<string, string>;
}

export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfiguration;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private loadConfiguration(): AppConfiguration {
    return {
      llmProviders: {
        primaryProvider: this.getEnvValue('VITE_PRIMARY_LLM_PROVIDER', 'openrouter') as ProviderType,
        fallbackProvider: this.getEnvValue('VITE_FALLBACK_LLM_PROVIDER', 'gemini') as ProviderType,
        enableFallback: this.getBooleanEnvValue('VITE_ENABLE_FALLBACK', true),
        defaultLLMConfig: {
          model: '', // Will be set by individual services
          temperature: this.getNumberEnvValue('VITE_DEFAULT_TEMPERATURE', 0.7),
          maxTokens: this.getNumberEnvValue('VITE_DEFAULT_MAX_TOKENS', 4000),
          retryAttempts: this.getNumberEnvValue('VITE_DEFAULT_RETRY_ATTEMPTS', 3),
          timeout: this.getNumberEnvValue('VITE_DEFAULT_TIMEOUT', 30000)
        }
      },
      workflow: {
        enableMetricsCollection: this.getBooleanEnvValue('VITE_ENABLE_METRICS_COLLECTION', true),
        maxMetricsEntries: this.getNumberEnvValue('VITE_MAX_METRICS_ENTRIES', 100),
        enableCaching: this.getBooleanEnvValue('VITE_ENABLE_CACHING', true)
      },
      performance: {
        healthCheckInterval: this.getNumberEnvValue('VITE_HEALTH_CHECK_INTERVAL', 300000), // 5 minutes
        cacheTTL: this.getNumberEnvValue('VITE_CACHE_TTL', 3600000) // 1 hour
      },
      apiKeys: {
        openrouter: this.getEnvValue('VITE_OPENROUTER_API_KEY', ''),
        gemini: this.getEnvValue('VITE_GEMINI_API_KEY', '')
      }
    };
  }

  private getEnvValue(key: string, defaultValue: string): string {
    return import.meta.env[key] || defaultValue;
  }

  private getBooleanEnvValue(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getNumberEnvValue(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  getConfiguration(): AppConfiguration {
    return { ...this.config };
  }

  getLLMProviderConfig(): LLMProviderConfig {
    return { ...this.config.llmProviders };
  }

  getWorkflowConfig(): WorkflowConfig {
    return { ...this.config.workflow };
  }

  getPerformanceConfig(): PerformanceConfig {
    return { ...this.config.performance };
  }

  getApiKey(provider: string): string {
    return this.config.apiKeys[provider] || '';
  }

  hasApiKey(provider: string): boolean {
    return Boolean(this.config.apiKeys[provider]);
  }

  updateConfiguration(updates: Partial<AppConfiguration>): void {
    this.config = {
      ...this.config,
      ...updates,
      llmProviders: {
        ...this.config.llmProviders,
        ...updates.llmProviders
      },
      workflow: {
        ...this.config.workflow,
        ...updates.workflow
      },
      performance: {
        ...this.config.performance,
        ...updates.performance
      },
      apiKeys: {
        ...this.config.apiKeys,
        ...updates.apiKeys
      }
    };
  }

  validateConfiguration(): ConfigurationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate API keys
    if (!this.hasApiKey(this.config.llmProviders.primaryProvider)) {
      errors.push(`Missing API key for primary provider: ${this.config.llmProviders.primaryProvider}`);
    }

    if (this.config.llmProviders.enableFallback && !this.hasApiKey(this.config.llmProviders.fallbackProvider)) {
      warnings.push(`Missing API key for fallback provider: ${this.config.llmProviders.fallbackProvider}`);
    }

    // Validate LLM configuration
    const llmConfig = this.config.llmProviders.defaultLLMConfig;
    if (llmConfig.temperature < 0 || llmConfig.temperature > 2) {
      warnings.push('Temperature should be between 0 and 2');
    }

    if (llmConfig.maxTokens < 1 || llmConfig.maxTokens > 200000) {
      warnings.push('Max tokens should be between 1 and 200000');
    }

    if (llmConfig.retryAttempts < 0 || llmConfig.retryAttempts > 10) {
      warnings.push('Retry attempts should be between 0 and 10');
    }

    if (llmConfig.timeout < 1000 || llmConfig.timeout > 300000) {
      warnings.push('Timeout should be between 1000ms and 300000ms');
    }

    // Validate workflow configuration
    if (this.config.workflow.maxMetricsEntries < 1 || this.config.workflow.maxMetricsEntries > 10000) {
      warnings.push('Max metrics entries should be between 1 and 10000');
    }

    // Validate performance configuration
    if (this.config.performance.healthCheckInterval < 60000) {
      warnings.push('Health check interval should be at least 60 seconds');
    }

    if (this.config.performance.cacheTTL < 60000) {
      warnings.push('Cache TTL should be at least 60 seconds');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  exportConfiguration(): string {
    const config = this.getConfiguration();
    // Remove sensitive information
    const exportConfig = {
      ...config,
      apiKeys: Object.keys(config.apiKeys).reduce((acc, key) => {
        acc[key] = config.apiKeys[key] ? '[REDACTED]' : '';
        return acc;
      }, {} as Record<string, string>)
    };
    return JSON.stringify(exportConfig, null, 2);
  }

  importConfiguration(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson) as Partial<AppConfiguration>;
      
      // Don't import API keys for security
      if (importedConfig.apiKeys) {
        delete importedConfig.apiKeys;
      }
      
      this.updateConfiguration(importedConfig);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  resetToDefaults(): void {
    this.config = this.loadConfiguration();
  }

  // Environment-specific helpers
  isDevelopment(): boolean {
    return import.meta.env.MODE === 'development';
  }

  isProduction(): boolean {
    return import.meta.env.MODE === 'production';
  }

  getEnvironmentInfo(): EnvironmentInfo {
    return {
      mode: import.meta.env.MODE,
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      baseUrl: import.meta.env.BASE_URL,
      version: import.meta.env.PACKAGE_VERSION || 'unknown'
    };
  }
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvironmentInfo {
  mode: string;
  isDevelopment: boolean;
  isProduction: boolean;
  baseUrl: string;
  version: string;
}

// Singleton instance export
export const configManager = ConfigurationManager.getInstance();
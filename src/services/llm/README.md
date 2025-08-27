# LLM Service Implementation

This module provides a unified interface for working with multiple Large Language Model (LLM) providers, including OpenRouter and Gemini. It implements robust error handling, retry logic, and provider fallback mechanisms.

## Features

- **Unified Interface**: Single interface for multiple LLM providers
- **Provider Fallback**: Automatic fallback to backup providers when primary fails
- **Retry Logic**: Exponential backoff retry mechanism for transient failures
- **Error Handling**: Comprehensive error types and handling strategies
- **Health Monitoring**: Provider health checks and monitoring
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Supported Providers

### OpenRouter
- Supports multiple models (Claude, GPT-4, Gemini, Llama, etc.)
- API Key required: `VITE_OPENROUTER_API_KEY`
- Default model: `anthropic/claude-3.5-sonnet`

### Gemini
- Google's Gemini models
- API Key required: `VITE_GEMINI_API_KEY`
- Default model: `gemini-2.0-flash`

## Quick Start

### 1. Environment Setup

Add your API keys to `.env`:

```bash
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_PRIMARY_LLM_PROVIDER=openrouter
VITE_FALLBACK_LLM_PROVIDER=gemini
```

### 2. Basic Usage

```typescript
import { createLLMService } from './services/llm';

// Simple completion
const service = await createLLMService();
const response = await service.generateCompletion("Write a hello world function");
console.log(response.content);
```

### 3. Advanced Usage

```typescript
import { LLMServiceFactory } from './services/llm';

// Configure providers
LLMServiceFactory.configure({
  primaryProvider: 'openrouter',
  fallbackProvider: 'gemini',
  enableFallback: true
});

// Use specific provider
const openRouter = await LLMServiceFactory.getService('openrouter');
const response = await openRouter.generateCompletion(
  "Explain async/await",
  {
    temperature: 0.7,
    maxTokens: 1000,
    retryAttempts: 3
  }
);
```

## API Reference

### LLMService Interface

```typescript
interface LLMService {
  generateCompletion(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse>;
  validateResponse(response: string): boolean;
  getProviderInfo(): ProviderInfo;
  isHealthy(): Promise<boolean>;
}
```

### Configuration Options

```typescript
interface LLMConfig {
  model: string;           // Model to use
  temperature: number;     // Creativity (0-1)
  maxTokens: number;       // Maximum response length
  retryAttempts: number;   // Number of retry attempts
  timeout: number;         // Request timeout in ms
}
```

### Response Format

```typescript
interface LLMResponse {
  content: string;         // Generated text
  model: string;           // Model used
  tokensUsed?: number;     // Tokens consumed
  finishReason?: string;   // Why generation stopped
  metadata?: Record<string, any>; // Additional data
}
```

## Error Handling

The system includes comprehensive error handling with specific error types:

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT', 
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}
```

### Retry Strategy

- **Exponential Backoff**: Delays increase exponentially between retries
- **Jitter**: Random delay added to prevent thundering herd
- **Max Attempts**: Configurable maximum retry attempts
- **Smart Retry**: Only retries on retryable errors (network, rate limits, server errors)

## Provider Management

### Health Checks

```typescript
import { checkProviderHealth } from './services/llm';

const healthyProviders = await checkProviderHealth();
console.log('Available providers:', healthyProviders);
```

### Factory Configuration

```typescript
import { LLMServiceFactory } from './services/llm';

// Configure provider preferences
LLMServiceFactory.configure({
  primaryProvider: 'openrouter',
  fallbackProvider: 'gemini',
  enableFallback: true
});

// Get service with automatic fallback
const service = await LLMServiceFactory.getServiceWithFallback();
```

## Testing

The implementation includes comprehensive tests covering:

- Service creation and configuration
- API request/response handling
- Error handling and retry logic
- Provider fallback mechanisms
- Response validation

Run tests:

```bash
npm run test:run -- src/test/llmService.test.ts
```

## Examples

See `src/examples/llmServiceExample.ts` for detailed usage examples including:

- Basic completion generation
- Provider-specific usage
- Error handling strategies
- Batch processing
- Health monitoring

## Architecture

The system follows a layered architecture:

1. **Interface Layer**: `LLMService` interface defines the contract
2. **Base Implementation**: `BaseLLMService` provides common functionality
3. **Provider Implementations**: Specific implementations for each provider
4. **Factory Layer**: `LLMServiceFactory` manages provider instances
5. **Utility Layer**: Retry logic, error handling, and validation

This design ensures:
- **Extensibility**: Easy to add new providers
- **Maintainability**: Clear separation of concerns
- **Reliability**: Robust error handling and retry mechanisms
- **Testability**: Mockable interfaces and dependency injection
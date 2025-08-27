// Example usage of the LLM Service system
import { LLMServiceFactory, createLLMService, checkProviderHealth } from '../services/llm';

// Example 1: Basic usage with automatic provider selection
export async function basicExample() {
  try {
    const llmService = await createLLMService();
    
    const response = await llmService.generateCompletion(
      "Write a simple hello world function in JavaScript",
      {
        temperature: 0.7,
        maxTokens: 500
      }
    );
    
    console.log('Generated code:', response.content);
    console.log('Tokens used:', response.tokensUsed);
    console.log('Provider:', llmService.getProviderInfo().name);
    
  } catch (error) {
    console.error('Failed to generate completion:', error);
  }
}

// Example 2: Using specific provider
export async function specificProviderExample() {
  try {
    const openRouterService = await LLMServiceFactory.getService('openrouter');
    
    const response = await openRouterService.generateCompletion(
      "Explain the concept of async/await in JavaScript"
    );
    
    console.log('OpenRouter response:', response.content);
    
  } catch (error) {
    console.error('OpenRouter failed, trying Gemini...');
    
    try {
      const geminiService = await LLMServiceFactory.getService('gemini');
      const response = await geminiService.generateCompletion(
        "Explain the concept of async/await in JavaScript"
      );
      
      console.log('Gemini response:', response.content);
    } catch (fallbackError) {
      console.error('All providers failed:', fallbackError);
    }
  }
}

// Example 3: Health check and provider management
export async function healthCheckExample() {
  console.log('Checking provider health...');
  
  const healthyProviders = await checkProviderHealth();
  console.log('Healthy providers:', healthyProviders);
  
  // Configure factory with preferred providers
  LLMServiceFactory.configure({
    primaryProvider: 'openrouter',
    fallbackProvider: 'gemini',
    enableFallback: true
  });
  
  const config = LLMServiceFactory.getConfig();
  console.log('Current configuration:', config);
}

// Example 4: Error handling and retry logic
export async function errorHandlingExample() {
  try {
    const service = await createLLMService();
    
    // This will automatically retry on network errors
    const response = await service.generateCompletion(
      "Create a React component for a todo list",
      {
        retryAttempts: 5,
        timeout: 15000
      }
    );
    
    console.log('Generated component:', response.content);
    
  } catch (error) {
    if (error.type === 'AUTHENTICATION_ERROR') {
      console.error('Please check your API keys');
    } else if (error.type === 'RATE_LIMIT') {
      console.error('Rate limit exceeded, please wait');
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}

// Example 5: Batch processing with different providers
export async function batchProcessingExample() {
  const prompts = [
    "Write a Python function to sort a list",
    "Create a CSS animation for a loading spinner", 
    "Explain the difference between let and const in JavaScript"
  ];
  
  const results = await Promise.allSettled(
    prompts.map(async (prompt, index) => {
      const service = await createLLMService();
      return {
        prompt,
        response: await service.generateCompletion(prompt),
        provider: service.getProviderInfo().name
      };
    })
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Prompt ${index + 1} completed by ${result.value.provider}`);
    } else {
      console.error(`Prompt ${index + 1} failed:`, result.reason);
    }
  });
}
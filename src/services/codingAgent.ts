import { CodingAgent, CodingRequest, CodeResult, CodeMetadata } from '../types/workflow';
import { LLMService, LLMError, ErrorType } from '../types/llm';
import { LLMServiceFactory } from './llmServiceFactory';
import { PromptManager } from './promptManager';

export class CodingAgentService implements CodingAgent {
  private llmService: LLMService | null = null;

  constructor(private promptTemplateId: string = 'coding-agent-default') {}

  async generateCode(request: CodingRequest): Promise<CodeResult> {
    try {
      // Get LLM service with fallback
      this.llmService = await LLMServiceFactory.getServiceWithFallback();

      // Prepare prompt variables
      const promptVariables = this.preparePromptVariables(request);

      // Generate prompt
      const prompt = PromptManager.getPrompt(this.promptTemplateId, promptVariables);

      // Generate completion
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.3, // Lower temperature for more consistent code generation
        maxTokens: 4000,
        retryAttempts: 3
      });

      // Parse and validate response
      const codeResult = this.parseCodeResponse(response.content, request);

      return codeResult;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      throw new LLMError(
        ErrorType.VALIDATION_ERROR,
        `Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.llmService?.getProviderInfo().name,
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  private preparePromptVariables(request: CodingRequest): Record<string, any> {
    const frameworkText = request.framework ? `**Framework:** ${request.framework}` : '';
    const requirementsList = request.requirements.map(req => `- ${req}`).join('\n');
    const constraintsList = request.constraints.map(constraint => `- ${constraint}`).join('\n');

    return {
      task: request.task,
      requirements: requirementsList,
      language: request.language,
      framework: frameworkText,
      indentation: request.style.indentation,
      indentSize: request.style.indentSize,
      indentationType: request.style.indentation === 'spaces' ? 'spaces' : 'tabs',
      maxLineLength: request.style.maxLineLength,
      naming: request.style.naming,
      semicolons: request.style.semicolons ? 'required' : 'optional',
      quotes: request.style.quotes,
      constraints: constraintsList || 'None specified'
    };
  }

  private parseCodeResponse(responseContent: string, request: CodingRequest): CodeResult {
    try {
      // Try to parse as JSON first
      const parsed = this.tryParseJSON(responseContent);
      
      if (parsed && this.isValidCodeResult(parsed)) {
        return {
          code: parsed.code,
          language: request.language,
          explanation: parsed.explanation || 'No explanation provided',
          files: parsed.files || [],
          metadata: this.validateMetadata(parsed.metadata, parsed.code)
        };
      }

      // Fallback: extract code from markdown code blocks
      return this.extractCodeFromMarkdown(responseContent, request);
    } catch (error) {
      throw new LLMError(
        ErrorType.INVALID_RESPONSE,
        `Failed to parse code response: ${error instanceof Error ? error.message : 'Invalid format'}`,
        this.llmService?.getProviderInfo().name,
        true
      );
    }
  }

  private tryParseJSON(content: string): any {
    try {
      // Remove any markdown code block markers
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      return JSON.parse(cleanContent);
    } catch {
      return null;
    }
  }

  private isValidCodeResult(parsed: any): boolean {
    return (
      parsed &&
      typeof parsed.code === 'string' &&
      parsed.code.trim().length > 0
    );
  }

  private extractCodeFromMarkdown(content: string, request: CodingRequest): CodeResult {
    // Extract code from markdown code blocks
    const codeBlockRegex = new RegExp(`\`\`\`(?:${request.language})?\n([\\s\\S]*?)\n\`\`\``, 'i');
    const match = content.match(codeBlockRegex);
    
    if (!match || !match[1]) {
      throw new Error('No valid code found in response');
    }

    const code = match[1].trim();
    
    // Extract explanation (text before or after code block)
    const explanation = content
      .replace(codeBlockRegex, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim() || 'Code generated successfully';

    return {
      code,
      language: request.language,
      explanation,
      files: [{
        path: this.generateFileName(request.language),
        content: code
      }],
      metadata: this.generateMetadata(code)
    };
  }

  private validateMetadata(metadata: any, code: string): CodeMetadata {
    const defaultMetadata = this.generateMetadata(code);

    return {
      linesOfCode: metadata?.linesOfCode || defaultMetadata.linesOfCode,
      complexity: this.validateComplexity(metadata?.complexity) || defaultMetadata.complexity,
      dependencies: Array.isArray(metadata?.dependencies) ? metadata.dependencies : defaultMetadata.dependencies,
      estimatedTime: typeof metadata?.estimatedTime === 'number' ? metadata.estimatedTime : defaultMetadata.estimatedTime,
      testCoverage: typeof metadata?.testCoverage === 'number' ? metadata.testCoverage : undefined
    };
  }

  private validateComplexity(complexity: any): 'low' | 'medium' | 'high' | null {
    if (['low', 'medium', 'high'].includes(complexity)) {
      return complexity;
    }
    return null;
  }

  private generateMetadata(code: string): CodeMetadata {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const linesOfCode = lines.length;

    // Simple complexity estimation based on code patterns
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (linesOfCode > 100 || /\b(class|interface|async|await|Promise)\b/g.test(code)) {
      complexity = 'medium';
    }
    if (linesOfCode > 200 || /\b(extends|implements|generic|template)\b/g.test(code)) {
      complexity = 'high';
    }

    // Extract potential dependencies
    const dependencies: string[] = [];
    const importMatches = code.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (depMatch && depMatch[1] && !depMatch[1].startsWith('.')) {
          dependencies.push(depMatch[1]);
        }
      });
    }

    return {
      linesOfCode,
      complexity,
      dependencies: [...new Set(dependencies)], // Remove duplicates
      estimatedTime: Math.max(5, Math.ceil(linesOfCode / 10)) // Rough estimate: 10 lines per minute, minimum 5 minutes
    };
  }

  private generateFileName(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rust: 'rs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt'
    };

    const extension = extensions[language.toLowerCase()] || 'txt';
    return `generated_code.${extension}`;
  }

  getPromptTemplateId(): string {
    return this.promptTemplateId;
  }

  setPromptTemplateId(templateId: string): void {
    this.promptTemplateId = templateId;
  }
}
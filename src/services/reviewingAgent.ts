import { 
  ReviewingAgent, 
  CodingRequest, 
  CodeResult, 
  ReviewResult, 
  ReviewNote, 
  Suggestion, 
  QualityScore 
} from '../types/workflow';
import { LLMService, LLMError, ErrorType } from '../types/llm';
import { LLMServiceFactory } from './llmServiceFactory';
import { PromptManager } from './promptManager';

export class ReviewingAgentService implements ReviewingAgent {
  private llmService: LLMService | null = null;

  constructor(private promptTemplateId: string = 'reviewing-agent-default') {}

  async reviewCode(code: CodeResult, originalRequest: CodingRequest): Promise<ReviewResult> {
    try {
      // Get LLM service with fallback
      this.llmService = await LLMServiceFactory.getServiceWithFallback();

      // Prepare prompt variables
      const promptVariables = this.preparePromptVariables(code, originalRequest);

      // Generate prompt
      const prompt = PromptManager.getPrompt(this.promptTemplateId, promptVariables);

      // Generate completion
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.2, // Lower temperature for more consistent reviews
        maxTokens: 3000,
        retryAttempts: 3
      });

      // Parse and validate response
      const reviewResult = this.parseReviewResponse(response.content, code, originalRequest);

      return reviewResult;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      
      throw new LLMError(
        ErrorType.VALIDATION_ERROR,
        `Code review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.llmService?.getProviderInfo().name,
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  private preparePromptVariables(code: CodeResult, originalRequest: CodingRequest): Record<string, any> {
    const requirementsList = originalRequest.requirements.map(req => `- ${req}`).join('\n');
    const constraintsList = originalRequest.constraints.map(constraint => `- ${constraint}`).join('\n');

    return {
      originalTask: originalRequest.task,
      requirements: requirementsList,
      constraints: constraintsList || 'None specified',
      language: code.language,
      code: code.code,
      explanation: code.explanation,
      linesOfCode: code.metadata.linesOfCode,
      complexity: code.metadata.complexity,
      dependencies: code.metadata.dependencies.join(', ') || 'None',
      framework: originalRequest.framework || 'None specified'
    };
  }

  private parseReviewResponse(responseContent: string, originalCode: CodeResult, originalRequest: CodingRequest): ReviewResult {
    try {
      // Try to parse as JSON first
      const parsed = this.tryParseJSON(responseContent);
      
      if (parsed && this.isValidReviewResult(parsed)) {
        return {
          originalCode,
          reviewNotes: this.validateReviewNotes(parsed.reviewNotes || []),
          improvedCode: parsed.improvedCode ? this.validateImprovedCode(parsed.improvedCode, originalRequest) : undefined,
          suggestions: this.validateSuggestions(parsed.suggestions || []),
          score: this.validateQualityScore(parsed.score)
        };
      }

      // Fallback: extract review from structured text
      return this.extractReviewFromText(responseContent, originalCode);
    } catch (error) {
      throw new LLMError(
        ErrorType.INVALID_RESPONSE,
        `Failed to parse review response: ${error instanceof Error ? error.message : 'Invalid format'}`,
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

  private isValidReviewResult(parsed: any): boolean {
    return (
      parsed &&
      (Array.isArray(parsed.reviewNotes) || parsed.reviewNotes === undefined) &&
      (Array.isArray(parsed.suggestions) || parsed.suggestions === undefined) &&
      (typeof parsed.score === 'object' || parsed.score === undefined)
    );
  }

  private validateReviewNotes(notes: any[]): ReviewNote[] {
    return notes.filter(note => 
      note && 
      typeof note.message === 'string' &&
      ['error', 'warning', 'suggestion', 'improvement'].includes(note.type) &&
      ['low', 'medium', 'high', 'critical'].includes(note.severity) &&
      ['performance', 'security', 'maintainability', 'correctness', 'style'].includes(note.category)
    ).map(note => ({
      type: note.type,
      line: typeof note.line === 'number' ? note.line : undefined,
      message: note.message,
      severity: note.severity,
      category: note.category
    }));
  }

  private validateImprovedCode(improvedCode: any, originalRequest: CodingRequest): CodeResult | undefined {
    if (!improvedCode || typeof improvedCode.code !== 'string') {
      return undefined;
    }

    return {
      code: improvedCode.code,
      language: originalRequest.language,
      explanation: improvedCode.explanation || 'Improved version of the original code',
      files: improvedCode.files || [{
        path: this.generateFileName(originalRequest.language),
        content: improvedCode.code
      }],
      metadata: improvedCode.metadata || this.generateMetadata(improvedCode.code)
    };
  }

  private validateSuggestions(suggestions: any[]): Suggestion[] {
    return suggestions.filter(suggestion =>
      suggestion &&
      typeof suggestion.title === 'string' &&
      typeof suggestion.description === 'string' &&
      ['low', 'medium', 'high'].includes(suggestion.impact) &&
      ['low', 'medium', 'high'].includes(suggestion.effort)
    ).map(suggestion => ({
      title: suggestion.title,
      description: suggestion.description,
      impact: suggestion.impact,
      effort: suggestion.effort,
      codeChange: typeof suggestion.codeChange === 'string' ? suggestion.codeChange : undefined
    }));
  }

  private validateQualityScore(score: any): QualityScore {
    const defaultScore: QualityScore = {
      overall: 75,
      performance: 75,
      maintainability: 75,
      correctness: 80,
      security: 70,
      style: 75
    };

    if (!score || typeof score !== 'object') {
      return defaultScore;
    }

    return {
      overall: this.validateScoreValue(score.overall) || defaultScore.overall,
      performance: this.validateScoreValue(score.performance) || defaultScore.performance,
      maintainability: this.validateScoreValue(score.maintainability) || defaultScore.maintainability,
      correctness: this.validateScoreValue(score.correctness) || defaultScore.correctness,
      security: this.validateScoreValue(score.security) || defaultScore.security,
      style: this.validateScoreValue(score.style) || defaultScore.style
    };
  }

  private validateScoreValue(value: any): number | null {
    if (typeof value === 'number' && value >= 0 && value <= 100) {
      return Math.round(value);
    }
    return null;
  }

  private extractReviewFromText(content: string, originalCode: CodeResult): ReviewResult {
    // Simple text-based extraction as fallback
    const reviewNotes: ReviewNote[] = [];
    const suggestions: Suggestion[] = [];

    // Look for common review patterns
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('bug')) {
        reviewNotes.push({
          type: 'error',
          message: line.trim(),
          severity: 'high',
          category: 'correctness'
        });
      } else if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('issue')) {
        reviewNotes.push({
          type: 'warning',
          message: line.trim(),
          severity: 'medium',
          category: 'maintainability'
        });
      } else if (line.toLowerCase().includes('suggest') || line.toLowerCase().includes('recommend')) {
        suggestions.push({
          title: 'General Suggestion',
          description: line.trim(),
          impact: 'medium',
          effort: 'medium'
        });
      }
    }

    return {
      originalCode,
      reviewNotes,
      suggestions,
      score: {
        overall: 75,
        performance: 75,
        maintainability: 75,
        correctness: 80,
        security: 70,
        style: 75
      }
    };
  }

  private generateMetadata(code: string) {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const linesOfCode = lines.length;

    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (linesOfCode > 100) complexity = 'medium';
    if (linesOfCode > 200) complexity = 'high';

    return {
      linesOfCode,
      complexity,
      dependencies: [],
      estimatedTime: Math.max(5, Math.ceil(linesOfCode / 10))
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
    return `reviewed_code.${extension}`;
  }

  getPromptTemplateId(): string {
    return this.promptTemplateId;
  }

  setPromptTemplateId(templateId: string): void {
    this.promptTemplateId = templateId;
  }
}
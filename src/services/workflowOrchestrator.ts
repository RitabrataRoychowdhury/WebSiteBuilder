import { 
  WorkflowOrchestrator, 
  CodingRequest, 
  WorkflowResult, 
  CodingAgent, 
  ReviewingAgent,
  WorkflowMetrics 
} from '../types/workflow';
import { LLMError, ErrorType } from '../types/llm';
import { CodingAgentService } from './codingAgent';
import { ReviewingAgentService } from './reviewingAgent';

export class WorkflowOrchestratorService implements WorkflowOrchestrator {
  private codingAgent: CodingAgent;
  private reviewingAgent: ReviewingAgent;
  private metrics: WorkflowMetrics[] = [];

  constructor() {
    this.codingAgent = new CodingAgentService();
    this.reviewingAgent = new ReviewingAgentService();
  }

  async executeWorkflow(request: CodingRequest): Promise<WorkflowResult> {
    const workflowId = this.generateWorkflowId();
    const startTime = Date.now();
    
    try {
      // Step 1: Generate code using coding agent
      const originalCode = await this.codingAgent.generateCode(request);
      
      // Step 2: Review code using reviewing agent
      const review = await this.reviewingAgent.reviewCode(originalCode, request);
      
      // Step 3: Use improved code if available, otherwise use original
      const finalCode = review.improvedCode || originalCode;
      
      const executionTime = Date.now() - startTime;
      
      const result: WorkflowResult = {
        originalCode,
        review,
        finalCode,
        executionTime,
        providerUsed: 'multiple', // Could be enhanced to track specific providers
        workflowId
      };

      // Record metrics
      this.recordMetrics({
        executionTime,
        providerUsed: 'multiple',
        tokensUsed: 0, // Would need to be calculated from actual usage
        cacheHitRate: 0,
        errorRate: 0,
        workflowId
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record error metrics
      this.recordMetrics({
        executionTime,
        providerUsed: 'unknown',
        tokensUsed: 0,
        cacheHitRate: 0,
        errorRate: 1,
        workflowId
      });

      if (error instanceof LLMError) {
        throw error;
      }
      
      throw new LLMError(
        ErrorType.VALIDATION_ERROR,
        `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'workflow-orchestrator',
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  getCodingAgent(): CodingAgent {
    return this.codingAgent;
  }

  getReviewingAgent(): ReviewingAgent {
    return this.reviewingAgent;
  }

  getMetrics(): WorkflowMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordMetrics(metrics: WorkflowMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
}
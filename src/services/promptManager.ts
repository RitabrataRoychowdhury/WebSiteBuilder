import { PromptTemplate, PromptMetadata } from '../types/workflow';

export class PromptManager {
  private static templates: Map<string, PromptTemplate> = new Map();
  private static readonly VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;
  private static readonly REQUIRED_FIELDS = ['id', 'role', 'template', 'variables', 'metadata'];

  static {
    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  static getPrompt(id: string, variables: Record<string, any> = {}): string {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Prompt template with id '${id}' not found`);
    }

    return this.substituteVariables(template.template, variables);
  }

  static registerPrompt(template: PromptTemplate): void {
    if (!this.validatePrompt(template)) {
      throw new Error(`Invalid prompt template: ${template.id}`);
    }
    this.templates.set(template.id, template);
  }

  static validatePrompt(template: PromptTemplate): boolean {
    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (!template[field as keyof PromptTemplate]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate role
    if (!['coding', 'reviewing'].includes(template.role)) {
      console.error(`Invalid role: ${template.role}. Must be 'coding' or 'reviewing'`);
      return false;
    }

    // Validate template content
    if (template.template.trim().length === 0) {
      console.error('Template content cannot be empty');
      return false;
    }

    // Validate variables consistency
    const templateVariables = this.extractVariables(template.template);
    const declaredVariables = new Set(template.variables);
    
    // Check for undeclared variables in template
    for (const variable of templateVariables) {
      if (!declaredVariables.has(variable)) {
        console.error(`Variable '${variable}' used in template but not declared in variables array`);
        return false;
      }
    }

    // Check for unused declared variables
    for (const variable of template.variables) {
      if (!templateVariables.includes(variable)) {
        console.warn(`Variable '${variable}' declared but not used in template`);
      }
    }

    // Validate metadata
    if (!template.metadata.version || !template.metadata.description) {
      console.error('Template metadata must include version and description');
      return false;
    }

    return true;
  }

  private static substituteVariables(template: string, variables: Record<string, any>): string {
    // Validate that all required variables are provided
    const requiredVariables = this.extractVariables(template);
    const missingVariables = requiredVariables.filter(variable => !variables.hasOwnProperty(variable));
    
    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
    }

    return template.replace(this.VARIABLE_PATTERN, (match, variable) => {
      const value = variables[variable];
      
      // Handle different data types appropriately
      if (Array.isArray(value)) {
        return value.map(item => `- ${item}`).join('\n');
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
      } else if (value === undefined || value === null) {
        return '';
      }
      
      return String(value);
    });
  }

  private static extractVariables(template: string): string[] {
    const matches = template.match(this.VARIABLE_PATTERN);
    if (!matches) return [];
    
    // Remove duplicates and extract variable names
    const variables = matches.map(match => match.slice(2, -2));
    return [...new Set(variables)];
  }

  private static initializeDefaultTemplates(): void {
    // Enhanced Coding Agent Template
    const codingTemplate: PromptTemplate = {
      id: 'coding-agent-default',
      role: 'coding',
      template: `You are an expert software developer with deep knowledge of clean architecture, SOLID principles, and modern development practices. Generate production-ready code that follows industry best practices.

## Task Description
{{task}}

## Requirements
{{requirements}}

## Technical Specifications
- **Language:** {{language}}
- **Framework:** {{framework}}
- **Architecture Pattern:** Clean Architecture with separation of concerns

## Code Style Guidelines
### Formatting
- Indentation: {{indentation}} ({{indentSize}} {{indentationType}})
- Maximum line length: {{maxLineLength}} characters
- Naming convention: {{naming}}
- Semicolons: {{semicolons}}
- Quote style: {{quotes}} quotes

### Quality Standards
- Write self-documenting code with clear variable and function names
- Include JSDoc/documentation comments for public APIs
- Implement proper error handling with meaningful error messages
- Follow SOLID principles and design patterns where appropriate
- Ensure type safety (use TypeScript features effectively)
- Write modular, testable code with single responsibility principle

### Security & Performance
- Validate all inputs and sanitize outputs
- Implement proper error boundaries
- Consider performance implications and optimize where necessary
- Follow security best practices for {{language}}

## Constraints
{{constraints}}

## Expected Output
Provide a complete, working implementation that includes:

1. **Main Implementation**: Core functionality with proper structure
2. **Error Handling**: Comprehensive error handling and validation
3. **Documentation**: Clear comments and documentation
4. **Type Definitions**: Strong typing (if applicable)
5. **Best Practices**: Following language-specific conventions

**IMPORTANT**: Format your response as valid JSON with the following structure:

\`\`\`json
{
  "code": "// Main implementation code here",
  "explanation": "Detailed explanation of the implementation approach, design decisions, and key features",
  "files": [
    {
      "path": "main-file.{{fileExtension}}",
      "content": "// Main implementation"
    },
    {
      "path": "types.{{fileExtension}}",
      "content": "// Type definitions if needed"
    }
  ],
  "metadata": {
    "linesOfCode": 150,
    "complexity": "medium",
    "dependencies": ["dependency1", "dependency2"],
    "estimatedTime": 45,
    "testCoverage": 85
  }
}
\`\`\``,
      variables: ['task', 'requirements', 'language', 'framework', 'indentation', 'indentSize', 'indentationType', 'maxLineLength', 'naming', 'semicolons', 'quotes', 'constraints', 'fileExtension'],
      metadata: {
        version: '2.0.0',
        description: 'Enhanced template for coding agent with comprehensive style guidelines and clean architecture principles',
        author: 'System',
        tags: ['coding', 'default', 'clean-architecture', 'best-practices'],
        lastUpdated: new Date()
      }
    };

    // Enhanced Reviewing Agent Template
    const reviewingTemplate: PromptTemplate = {
      id: 'reviewing-agent-default',
      role: 'reviewing',
      template: `You are a senior software architect and code reviewer with expertise in clean code principles, security best practices, and performance optimization. Conduct a thorough, constructive code review.

## Review Context
- **Original Task:** {{task}}
- **Language:** {{language}}
- **Framework:** {{framework}}

## Code Under Review
\`\`\`{{language}}
{{code}}
\`\`\`

## Implementation Explanation
{{explanation}}

## Review Criteria

### 1. Correctness & Functionality
- Does the code fulfill all stated requirements?
- Are edge cases properly handled?
- Is the logic sound and bug-free?
- Are there any potential runtime errors?

### 2. Code Quality & Maintainability
- Is the code readable and self-documenting?
- Are functions and classes appropriately sized (Single Responsibility Principle)?
- Is the code DRY (Don't Repeat Yourself)?
- Are naming conventions consistent and meaningful?
- Is the code structure logical and well-organized?

### 3. Performance & Efficiency
- Are there any performance bottlenecks?
- Is memory usage optimized?
- Are algorithms efficient for the use case?
- Are there unnecessary computations or redundant operations?

### 4. Security & Safety
- Are inputs properly validated and sanitized?
- Are there potential security vulnerabilities (injection, XSS, etc.)?
- Is error handling secure (no information leakage)?
- Are authentication and authorization properly implemented?

### 5. Best Practices & Standards
- Does the code follow {{language}} best practices?
- Are design patterns used appropriately?
- Is error handling comprehensive and consistent?
- Are dependencies managed properly?
- Is the code testable and modular?

### 6. Documentation & Comments
- Are complex algorithms or business logic well-documented?
- Are public APIs properly documented?
- Are comments helpful and up-to-date?

## Review Guidelines
- Provide specific, actionable feedback with line references when possible
- Suggest concrete improvements with code examples
- Balance criticism with positive observations
- Prioritize issues by severity and impact
- Consider the context and requirements when making suggestions

**IMPORTANT**: Format your response as valid JSON:

\`\`\`json
{
  "reviewNotes": [
    {
      "type": "error|warning|suggestion|improvement",
      "line": 15,
      "message": "Specific, actionable feedback with clear explanation",
      "severity": "critical|high|medium|low",
      "category": "correctness|performance|security|maintainability|style|documentation"
    }
  ],
  "suggestions": [
    {
      "title": "Clear, concise suggestion title",
      "description": "Detailed explanation of the suggestion and its benefits",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "codeChange": "// Specific code improvement example"
    }
  ],
  "score": {
    "overall": 85,
    "correctness": 90,
    "performance": 80,
    "security": 85,
    "maintainability": 90,
    "style": 85,
    "documentation": 75
  },
  "improvedCode": "// Complete improved version if significant changes are needed, otherwise omit this field"
}
\`\`\``,
      variables: ['task', 'language', 'framework', 'code', 'explanation'],
      metadata: {
        version: '2.0.0',
        description: 'Enhanced template for reviewing agent with comprehensive review criteria and structured feedback',
        author: 'System',
        tags: ['reviewing', 'default', 'comprehensive', 'security', 'performance'],
        lastUpdated: new Date()
      }
    };

    // Specialized Coding Templates
    const quickFixTemplate: PromptTemplate = {
      id: 'coding-agent-quickfix',
      role: 'coding',
      template: `You are a debugging expert. Fix the provided code issue quickly and efficiently.

## Issue Description
{{issue}}

## Current Code
\`\`\`{{language}}
{{currentCode}}
\`\`\`

## Error/Problem
{{error}}

Provide a minimal fix that:
1. Resolves the specific issue
2. Maintains existing functionality
3. Follows {{language}} best practices
4. Includes a brief explanation

Format as JSON:
\`\`\`json
{
  "code": "// Fixed code here",
  "explanation": "Brief explanation of the fix",
  "files": [{"path": "{{filename}}", "content": "fixed content"}],
  "metadata": {
    "linesOfCode": 50,
    "complexity": "low",
    "dependencies": [],
    "estimatedTime": 10
  }
}
\`\`\``,
      variables: ['issue', 'currentCode', 'language', 'error', 'filename'],
      metadata: {
        version: '1.0.0',
        description: 'Quick fix template for debugging and issue resolution',
        author: 'System',
        tags: ['coding', 'debugging', 'quickfix'],
        lastUpdated: new Date()
      }
    };

    const securityReviewTemplate: PromptTemplate = {
      id: 'reviewing-agent-security',
      role: 'reviewing',
      template: `You are a cybersecurity expert specializing in secure code review. Focus specifically on security vulnerabilities and best practices.

## Code Security Review
**Language:** {{language}}
**Framework:** {{framework}}

\`\`\`{{language}}
{{code}}
\`\`\`

## Security Focus Areas
1. **Input Validation**: SQL injection, XSS, command injection
2. **Authentication & Authorization**: Access controls, session management
3. **Data Protection**: Encryption, sensitive data handling
4. **Error Handling**: Information disclosure prevention
5. **Dependencies**: Known vulnerabilities in libraries
6. **Configuration**: Security misconfigurations

Provide security-focused feedback with severity ratings and remediation steps.

Format as JSON:
\`\`\`json
{
  "reviewNotes": [
    {
      "type": "security-vulnerability|security-warning|security-improvement",
      "line": 0,
      "message": "Security-specific feedback",
      "severity": "critical|high|medium|low",
      "category": "security",
      "cve": "CVE-2023-XXXX (if applicable)",
      "remediation": "Specific steps to fix the issue"
    }
  ],
  "suggestions": [
    {
      "title": "Security improvement",
      "description": "Detailed security enhancement",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "codeChange": "// Secure code example"
    }
  ],
  "score": {
    "overall": 75,
    "inputValidation": 80,
    "authentication": 70,
    "dataProtection": 85,
    "errorHandling": 75,
    "dependencies": 80,
    "configuration": 70
  }
}
\`\`\``,
      variables: ['language', 'framework', 'code'],
      metadata: {
        version: '1.0.0',
        description: 'Security-focused review template',
        author: 'System',
        tags: ['reviewing', 'security', 'vulnerability'],
        lastUpdated: new Date()
      }
    };

    // Register all templates
    this.templates.set(codingTemplate.id, codingTemplate);
    this.templates.set(reviewingTemplate.id, reviewingTemplate);
    this.templates.set(quickFixTemplate.id, quickFixTemplate);
    this.templates.set(securityReviewTemplate.id, securityReviewTemplate);
  }

  static getAvailableTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  static getTemplatesByRole(role: 'coding' | 'reviewing'): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.role === role);
  }

  static getTemplatesByTag(tag: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      template.metadata.tags.includes(tag)
    );
  }

  static searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template => 
      template.id.toLowerCase().includes(lowerQuery) ||
      template.metadata.description.toLowerCase().includes(lowerQuery) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  static updateTemplate(id: string, updates: Partial<PromptTemplate>): boolean {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template with id '${id}' not found`);
    }

    const updated = { ...existing, ...updates };
    
    // Update metadata timestamp
    if (updated.metadata) {
      updated.metadata.lastUpdated = new Date();
    }

    if (!this.validatePrompt(updated)) {
      return false;
    }

    this.templates.set(id, updated);
    return true;
  }

  static deleteTemplate(id: string): boolean {
    if (!this.templates.has(id)) {
      throw new Error(`Template with id '${id}' not found`);
    }

    // Prevent deletion of default templates
    const template = this.templates.get(id)!;
    if (template.metadata.tags.includes('default')) {
      throw new Error('Cannot delete default system templates');
    }

    return this.templates.delete(id);
  }

  static cloneTemplate(sourceId: string, newId: string, modifications?: Partial<PromptTemplate>): PromptTemplate {
    const source = this.templates.get(sourceId);
    if (!source) {
      throw new Error(`Source template with id '${sourceId}' not found`);
    }

    if (this.templates.has(newId)) {
      throw new Error(`Template with id '${newId}' already exists`);
    }

    const cloned: PromptTemplate = {
      ...source,
      id: newId,
      metadata: {
        ...source.metadata,
        version: '1.0.0',
        author: 'User',
        lastUpdated: new Date(),
        tags: [...source.metadata.tags.filter(tag => tag !== 'default'), 'custom']
      },
      ...modifications
    };

    if (!this.validatePrompt(cloned)) {
      throw new Error('Cloned template failed validation');
    }

    this.templates.set(newId, cloned);
    return cloned;
  }

  static exportTemplate(id: string): string {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }

    return JSON.stringify(template, null, 2);
  }

  static importTemplate(templateJson: string): PromptTemplate {
    let template: PromptTemplate;
    
    try {
      template = JSON.parse(templateJson);
    } catch (error) {
      throw new Error('Invalid JSON format for template import');
    }

    // Convert date strings back to Date objects
    if (template.metadata?.lastUpdated) {
      template.metadata.lastUpdated = new Date(template.metadata.lastUpdated);
    }

    if (!this.validatePrompt(template)) {
      throw new Error('Imported template failed validation');
    }

    if (this.templates.has(template.id)) {
      throw new Error(`Template with id '${template.id}' already exists`);
    }

    this.templates.set(template.id, template);
    return template;
  }

  static getTemplateInfo(id: string): { variables: string[], estimatedTokens: number, complexity: 'low' | 'medium' | 'high' } {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with id '${id}' not found`);
    }

    const variables = this.extractVariables(template.template);
    const estimatedTokens = Math.ceil(template.template.length / 4); // Rough token estimation
    
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (variables.length > 10 || template.template.length > 2000) {
      complexity = 'high';
    } else if (variables.length > 5 || template.template.length > 1000) {
      complexity = 'medium';
    }

    return { variables, estimatedTokens, complexity };
  }

  static validateVariables(templateId: string, variables: Record<string, any>): { valid: boolean, missing: string[], extra: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template with id '${templateId}' not found`);
    }

    const requiredVariables = new Set(template.variables);
    const providedVariables = new Set(Object.keys(variables));

    const missing = [...requiredVariables].filter(v => !providedVariables.has(v));
    const extra = [...providedVariables].filter(v => !requiredVariables.has(v));

    return {
      valid: missing.length === 0,
      missing,
      extra
    };
  }

  static previewPrompt(templateId: string, variables: Record<string, any>): string {
    try {
      return this.getPrompt(templateId, variables);
    } catch (error) {
      return `Preview Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
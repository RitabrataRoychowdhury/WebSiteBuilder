import { describe, it, expect, beforeEach } from 'vitest';
import { PromptManager } from '../services/promptManager';
import { PromptTemplate } from '../types/workflow';

describe('PromptManager', () => {
  beforeEach(() => {
    // Reset to default templates before each test
    // Note: In a real implementation, you might want to add a reset method
  });

  describe('getPrompt', () => {
    it('should retrieve and substitute variables in coding template', () => {
      const variables = {
        task: 'Create a user authentication system',
        requirements: ['Secure login', 'Password hashing', 'Session management'],
        language: 'TypeScript',
        framework: 'Express.js',
        indentation: 'spaces',
        indentSize: 2,
        indentationType: 'spaces',
        maxLineLength: 100,
        naming: 'camelCase',
        semicolons: true,
        quotes: 'single',
        constraints: ['Must use JWT tokens', 'No external auth services'],
        fileExtension: 'ts'
      };

      const prompt = PromptManager.getPrompt('coding-agent-default', variables);
      
      expect(prompt).toContain('Create a user authentication system');
      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('Express.js');
      expect(prompt).toContain('- Secure login');
      expect(prompt).toContain('camelCase');
    });

    it('should retrieve and substitute variables in reviewing template', () => {
      const variables = {
        task: 'Review authentication code',
        language: 'TypeScript',
        framework: 'Express.js',
        code: 'function login(user, pass) { return true; }',
        explanation: 'Simple login function'
      };

      const prompt = PromptManager.getPrompt('reviewing-agent-default', variables);
      
      expect(prompt).toContain('Review authentication code');
      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('function login(user, pass)');
      expect(prompt).toContain('Simple login function');
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        PromptManager.getPrompt('non-existent-template', {});
      }).toThrow("Prompt template with id 'non-existent-template' not found");
    });

    it('should throw error for missing variables', () => {
      expect(() => {
        PromptManager.getPrompt('coding-agent-default', { task: 'test' });
      }).toThrow('Missing required variables');
    });

    it('should handle array variables correctly', () => {
      const variables = {
        task: 'Test task',
        requirements: ['Req 1', 'Req 2', 'Req 3'],
        language: 'JavaScript',
        framework: 'React',
        indentation: 'spaces',
        indentSize: 2,
        indentationType: 'spaces',
        maxLineLength: 80,
        naming: 'camelCase',
        semicolons: false,
        quotes: 'single',
        constraints: ['Constraint 1', 'Constraint 2'],
        fileExtension: 'js'
      };

      const prompt = PromptManager.getPrompt('coding-agent-default', variables);
      
      expect(prompt).toContain('- Req 1\n- Req 2\n- Req 3');
      expect(prompt).toContain('- Constraint 1\n- Constraint 2');
    });
  });

  describe('registerPrompt', () => {
    it('should register a valid new template', () => {
      const newTemplate: PromptTemplate = {
        id: 'test-template',
        role: 'coding',
        template: 'Test template with {{variable}}',
        variables: ['variable'],
        metadata: {
          version: '1.0.0',
          description: 'Test template',
          author: 'Test',
          tags: ['test'],
          lastUpdated: new Date()
        }
      };

      expect(() => {
        PromptManager.registerPrompt(newTemplate);
      }).not.toThrow();

      const prompt = PromptManager.getPrompt('test-template', { variable: 'test value' });
      expect(prompt).toBe('Test template with test value');
    });

    it('should throw error for invalid template', () => {
      const invalidTemplate = {
        id: 'invalid',
        role: 'invalid-role',
        template: '',
        variables: [],
        metadata: {}
      } as any;

      expect(() => {
        PromptManager.registerPrompt(invalidTemplate);
      }).toThrow('Invalid prompt template');
    });
  });

  describe('validatePrompt', () => {
    it('should validate a correct template', () => {
      const validTemplate: PromptTemplate = {
        id: 'valid-template',
        role: 'coding',
        template: 'Valid template with {{var1}} and {{var2}}',
        variables: ['var1', 'var2'],
        metadata: {
          version: '1.0.0',
          description: 'Valid template',
          author: 'Test',
          tags: ['test'],
          lastUpdated: new Date()
        }
      };

      expect(PromptManager.validatePrompt(validTemplate)).toBe(true);
    });

    it('should reject template with missing required fields', () => {
      const invalidTemplate = {
        id: 'invalid',
        template: 'Template without role'
      } as any;

      expect(PromptManager.validatePrompt(invalidTemplate)).toBe(false);
    });

    it('should reject template with invalid role', () => {
      const invalidTemplate: PromptTemplate = {
        id: 'invalid-role',
        role: 'invalid' as any,
        template: 'Template with invalid role',
        variables: [],
        metadata: {
          version: '1.0.0',
          description: 'Invalid role template',
          author: 'Test',
          tags: ['test'],
          lastUpdated: new Date()
        }
      };

      expect(PromptManager.validatePrompt(invalidTemplate)).toBe(false);
    });

    it('should reject template with undeclared variables', () => {
      const invalidTemplate: PromptTemplate = {
        id: 'undeclared-vars',
        role: 'coding',
        template: 'Template with {{undeclared}} variable',
        variables: [],
        metadata: {
          version: '1.0.0',
          description: 'Undeclared variables template',
          author: 'Test',
          tags: ['test'],
          lastUpdated: new Date()
        }
      };

      expect(PromptManager.validatePrompt(invalidTemplate)).toBe(false);
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return all available templates', () => {
      const templates = PromptManager.getAvailableTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'coding-agent-default')).toBe(true);
      expect(templates.some(t => t.id === 'reviewing-agent-default')).toBe(true);
    });
  });

  describe('getTemplatesByRole', () => {
    it('should return only coding templates', () => {
      const codingTemplates = PromptManager.getTemplatesByRole('coding');
      
      expect(codingTemplates.every(t => t.role === 'coding')).toBe(true);
      expect(codingTemplates.some(t => t.id === 'coding-agent-default')).toBe(true);
    });

    it('should return only reviewing templates', () => {
      const reviewingTemplates = PromptManager.getTemplatesByRole('reviewing');
      
      expect(reviewingTemplates.every(t => t.role === 'reviewing')).toBe(true);
      expect(reviewingTemplates.some(t => t.id === 'reviewing-agent-default')).toBe(true);
    });
  });

  describe('getTemplatesByTag', () => {
    it('should return templates with specific tag', () => {
      const defaultTemplates = PromptManager.getTemplatesByTag('default');
      
      expect(defaultTemplates.length).toBeGreaterThan(0);
      expect(defaultTemplates.every(t => t.metadata.tags.includes('default'))).toBe(true);
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by id', () => {
      const results = PromptManager.searchTemplates('coding-agent');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id.includes('coding-agent'))).toBe(true);
    });

    it('should find templates by description', () => {
      const results = PromptManager.searchTemplates('review');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.metadata.description.toLowerCase().includes('review'))).toBe(true);
    });

    it('should find templates by tag', () => {
      const results = PromptManager.searchTemplates('security');
      
      expect(results.some(t => t.metadata.tags.includes('security'))).toBe(true);
    });
  });

  describe('cloneTemplate', () => {
    it('should clone existing template with modifications', () => {
      const cloned = PromptManager.cloneTemplate('coding-agent-default', 'my-custom-coding', {
        metadata: {
          version: '1.0.0',
          description: 'My custom coding template',
          author: 'User',
          tags: ['custom', 'coding'],
          lastUpdated: new Date()
        }
      });

      expect(cloned.id).toBe('my-custom-coding');
      expect(cloned.metadata.description).toBe('My custom coding template');
      expect(cloned.metadata.tags).toContain('custom');
      expect(cloned.role).toBe('coding'); // Should inherit from source
    });

    it('should throw error when cloning non-existent template', () => {
      expect(() => {
        PromptManager.cloneTemplate('non-existent', 'new-id');
      }).toThrow("Source template with id 'non-existent' not found");
    });
  });

  describe('getTemplateInfo', () => {
    it('should return template information', () => {
      const info = PromptManager.getTemplateInfo('coding-agent-default');
      
      expect(info.variables).toBeInstanceOf(Array);
      expect(info.variables.length).toBeGreaterThan(0);
      expect(info.estimatedTokens).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(info.complexity);
    });
  });

  describe('validateVariables', () => {
    it('should validate correct variables', () => {
      const variables = {
        task: 'Test task',
        requirements: ['Req 1'],
        language: 'JavaScript',
        framework: 'React',
        indentation: 'spaces',
        indentSize: 2,
        indentationType: 'spaces',
        maxLineLength: 80,
        naming: 'camelCase',
        semicolons: false,
        quotes: 'single',
        constraints: [],
        fileExtension: 'js'
      };

      const validation = PromptManager.validateVariables('coding-agent-default', variables);
      
      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should detect missing variables', () => {
      const variables = {
        task: 'Test task',
        language: 'JavaScript'
      };

      const validation = PromptManager.validateVariables('coding-agent-default', variables);
      
      expect(validation.valid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });

    it('should detect extra variables', () => {
      const variables = {
        task: 'Test task',
        requirements: ['Req 1'],
        language: 'JavaScript',
        framework: 'React',
        indentation: 'spaces',
        indentSize: 2,
        indentationType: 'spaces',
        maxLineLength: 80,
        naming: 'camelCase',
        semicolons: false,
        quotes: 'single',
        constraints: [],
        fileExtension: 'js',
        extraVariable: 'not needed'
      };

      const validation = PromptManager.validateVariables('coding-agent-default', variables);
      
      expect(validation.extra).toContain('extraVariable');
    });
  });

  describe('previewPrompt', () => {
    it('should return preview of prompt with variables', () => {
      const variables = {
        task: 'Test task',
        requirements: ['Req 1'],
        language: 'JavaScript',
        framework: 'React',
        indentation: 'spaces',
        indentSize: 2,
        indentationType: 'spaces',
        maxLineLength: 80,
        naming: 'camelCase',
        semicolons: false,
        quotes: 'single',
        constraints: [],
        fileExtension: 'js'
      };

      const preview = PromptManager.previewPrompt('coding-agent-default', variables);
      
      expect(preview).toContain('Test task');
      expect(preview).toContain('JavaScript');
      expect(preview).not.toContain('{{');
    });

    it('should return error message for invalid variables', () => {
      const preview = PromptManager.previewPrompt('coding-agent-default', { task: 'incomplete' });
      
      expect(preview).toContain('Preview Error');
    });
  });
});
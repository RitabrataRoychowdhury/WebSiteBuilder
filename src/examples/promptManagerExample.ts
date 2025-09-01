/**
 * Example usage of the PromptManager class
 * Demonstrates how to use the centralized prompt management system
 */

import { PromptManager } from '../services/promptManager';
import { PromptTemplate } from '../types/workflow';

// Example 1: Using default coding agent template
export function exampleCodingPrompt() {
  console.log('=== Coding Agent Prompt Example ===');
  
  const codingVariables = {
    task: 'Create a REST API endpoint for user registration',
    requirements: [
      'Accept email and password',
      'Validate email format',
      'Hash password securely',
      'Return JWT token on success',
      'Handle validation errors'
    ],
    language: 'TypeScript',
    framework: 'Express.js with bcrypt and jsonwebtoken',
    indentation: 'spaces',
    indentSize: 2,
    indentationType: 'spaces',
    maxLineLength: 100,
    naming: 'camelCase',
    semicolons: true,
    quotes: 'single',
    constraints: [
      'Use bcrypt for password hashing',
      'Implement proper error handling',
      'Follow RESTful conventions'
    ],
    fileExtension: 'ts'
  };

  try {
    const prompt = PromptManager.getPrompt('coding-agent-default', codingVariables);
    console.log('Generated coding prompt:');
    console.log(prompt.substring(0, 500) + '...\n');
  } catch (error) {
    console.error('Error generating coding prompt:', error);
  }
}

// Example 2: Using default reviewing agent template
export function exampleReviewingPrompt() {
  console.log('=== Reviewing Agent Prompt Example ===');
  
  const reviewVariables = {
    task: 'Review user registration endpoint',
    language: 'TypeScript',
    framework: 'Express.js',
    code: `
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });
  
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});`,
    explanation: 'Basic user registration endpoint with password hashing and JWT token generation'
  };

  try {
    const prompt = PromptManager.getPrompt('reviewing-agent-default', reviewVariables);
    console.log('Generated reviewing prompt:');
    console.log(prompt.substring(0, 500) + '...\n');
  } catch (error) {
    console.error('Error generating reviewing prompt:', error);
  }
}

// Example 3: Creating and registering a custom template
export function exampleCustomTemplate() {
  console.log('=== Custom Template Example ===');
  
  const customTemplate: PromptTemplate = {
    id: 'api-documentation-generator',
    role: 'coding',
    template: `You are a technical documentation expert. Generate comprehensive API documentation for the following endpoint.

## Endpoint Details
- **Method:** {{method}}
- **Path:** {{path}}
- **Description:** {{description}}

## Code Implementation
\`\`\`{{language}}
{{code}}
\`\`\`

## Requirements
{{requirements}}

Generate documentation that includes:
1. Endpoint description and purpose
2. Request/response schemas
3. Example requests and responses
4. Error codes and handling
5. Authentication requirements (if any)

Format as JSON:
\`\`\`json
{
  "documentation": "# API Documentation\\n\\n...",
  "examples": [
    {
      "title": "Success Example",
      "request": "curl example",
      "response": "response example"
    }
  ],
  "schemas": {
    "request": "JSON schema",
    "response": "JSON schema"
  }
}
\`\`\``,
    variables: ['method', 'path', 'description', 'language', 'code', 'requirements'],
    metadata: {
      version: '1.0.0',
      description: 'Template for generating API documentation',
      author: 'Example User',
      tags: ['documentation', 'api', 'custom'],
      lastUpdated: new Date()
    }
  };

  try {
    PromptManager.registerPrompt(customTemplate);
    console.log('Custom template registered successfully!');
    
    // Use the custom template
    const variables = {
      method: 'POST',
      path: '/api/users/register',
      description: 'Register a new user account',
      language: 'TypeScript',
      code: 'app.post("/register", async (req, res) => { /* implementation */ });',
      requirements: ['Email validation', 'Password hashing', 'JWT generation']
    };
    
    const prompt = PromptManager.getPrompt('api-documentation-generator', variables);
    console.log('Generated documentation prompt:');
    console.log(prompt.substring(0, 300) + '...\n');
  } catch (error) {
    console.error('Error with custom template:', error);
  }
}

// Example 4: Template management operations
export function exampleTemplateManagement() {
  console.log('=== Template Management Example ===');
  
  // List all available templates
  const allTemplates = PromptManager.getAvailableTemplates();
  console.log(`Total templates available: ${allTemplates.length}`);
  
  // Get templates by role
  const codingTemplates = PromptManager.getTemplatesByRole('coding');
  const reviewingTemplates = PromptManager.getTemplatesByRole('reviewing');
  console.log
(`Coding templates: ${codingTemplates.length}, Reviewing templates: ${reviewingTemplates.length}`);
  
  // Search templates
  const securityTemplates = PromptManager.searchTemplates('security');
  console.log(`Security-related templates: ${securityTemplates.length}`);
  
  // Get template information
  try {
    const info = PromptManager.getTemplateInfo('coding-agent-default');
    console.log('Template info:', {
      variables: info.variables.length,
      estimatedTokens: info.estimatedTokens,
      complexity: info.complexity
    });
  } catch (error) {
    console.error('Error getting template info:', error);
  }
  
  // Validate variables
  const testVariables = {
    task: 'Test task',
    language: 'JavaScript'
  };
  
  const validation = PromptManager.validateVariables('coding-agent-default', testVariables);
  console.log('Variable validation:', {
    valid: validation.valid,
    missing: validation.missing.length,
    extra: validation.extra.length
  });
  
  // Preview prompt with incomplete variables
  const preview = PromptManager.previewPrompt('coding-agent-default', testVariables);
  console.log('Preview result:', preview.includes('Preview Error') ? 'Error (as expected)' : 'Success');
}

// Example 5: Template cloning and customization
export function exampleTemplateCloning() {
  console.log('=== Template Cloning Example ===');
  
  try {
    // Clone the default coding template with modifications
    const customCodingTemplate = PromptManager.cloneTemplate(
      'coding-agent-default',
      'my-python-coding-template',
      {
        template: `You are a Python expert. Generate clean, Pythonic code following PEP 8 standards.

## Task
{{task}}

## Requirements
{{requirements}}

## Python-Specific Guidelines
- Follow PEP 8 style guide
- Use type hints where appropriate
- Include docstrings for functions and classes
- Use list comprehensions and generators when suitable
- Handle exceptions properly

## Constraints
{{constraints}}

Provide clean, well-documented Python code with proper error handling.

Format as JSON:
\`\`\`json
{
  "code": "# Python code here",
  "explanation": "Implementation explanation",
  "files": [{"path": "main.py", "content": "file content"}],
  "metadata": {
    "linesOfCode": 0,
    "complexity": "low|medium|high",
    "dependencies": ["package1", "package2"],
    "estimatedTime": 0
  }
}
\`\`\``,
        variables: ['task', 'requirements', 'constraints'],
        metadata: {
          version: '1.0.0',
          description: 'Python-specific coding template based on default template',
          author: 'Example User',
          tags: ['coding', 'python', 'custom', 'pep8'],
          lastUpdated: new Date()
        }
      }
    );
    
    console.log('Cloned template created:', customCodingTemplate.id);
    console.log('Template description:', customCodingTemplate.metadata.description);
    
    // Use the cloned template
    const pythonVariables = {
      task: 'Create a data processing pipeline',
      requirements: [
        'Read CSV files',
        'Clean and validate data',
        'Generate summary statistics',
        'Export results to JSON'
      ],
      constraints: [
        'Use pandas for data manipulation',
        'Include proper error handling',
        'Add logging for debugging'
      ]
    };
    
    const pythonPrompt = PromptManager.getPrompt('my-python-coding-template', pythonVariables);
    console.log('Generated Python-specific prompt:');
    console.log(pythonPrompt.substring(0, 400) + '...\n');
    
  } catch (error) {
    console.error('Error cloning template:', error);
  }
}

// Example 6: Import/Export functionality
export function exampleImportExport() {
  console.log('=== Import/Export Example ===');
  
  try {
    // Export a template
    const exportedTemplate = PromptManager.exportTemplate('coding-agent-default');
    console.log('Template exported successfully (JSON length:', exportedTemplate.length, 'characters)');
    
    // Create a modified version for import
    const templateData = JSON.parse(exportedTemplate);
    templateData.id = 'imported-coding-template';
    templateData.metadata.description = 'Imported and modified coding template';
    templateData.metadata.tags = ['im
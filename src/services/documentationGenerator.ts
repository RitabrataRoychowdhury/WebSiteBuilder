import { GeneratedWebsite, DocumentationConfig, GeneratedDocumentation } from '../types';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export class DocumentationGenerator {
  private website: GeneratedWebsite;
  private config: DocumentationConfig;

  constructor(website: GeneratedWebsite, config: DocumentationConfig) {
    this.website = website;
    this.config = config;
  }

  async generateDocumentation(): Promise<GeneratedDocumentation> {
    const docs: GeneratedDocumentation = {
      apiDocs: '',
      componentDocs: '',
      userGuide: ''
    };

    if (this.config.includeAPI) {
      docs.apiDocs = this.generateAPIDocumentation();
    }

    if (this.config.includeComponents) {
      docs.componentDocs = this.generateComponentDocumentation();
    }

    if (this.config.includeUserGuide) {
      docs.userGuide = this.generateUserGuide();
    }

    // Generate in requested formats
    if (this.config.format === 'markdown' || this.config.format === 'all') {
      docs.markdown = this.generateMarkdownDocs(docs);
    }

    if (this.config.format === 'html' || this.config.format === 'all') {
      docs.html = this.generateHTMLDocs(docs);
    }

    if (this.config.format === 'pdf' || this.config.format === 'all') {
      docs.pdf = await this.generatePDFDocs(docs);
    }

    return docs;
  }

  private generateAPIDocumentation(): string {
    const jsCode = this.website.js;
    const functions = this.extractFunctions(jsCode);
    const classes = this.extractClasses(jsCode);

    let apiDocs = '# API Documentation\n\n';

    if (functions.length > 0) {
      apiDocs += '## Functions\n\n';
      functions.forEach(func => {
        apiDocs += `### ${func.name}\n\n`;
        apiDocs += `**Description:** ${func.description || 'No description available'}\n\n`;
        apiDocs += `**Parameters:**\n`;
        func.parameters.forEach(param => {
          apiDocs += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
        });
        apiDocs += `\n**Returns:** ${func.returnType}\n\n`;
        apiDocs += `**Example:**\n\`\`\`javascript\n${func.example}\n\`\`\`\n\n`;
      });
    }

    if (classes.length > 0) {
      apiDocs += '## Classes\n\n';
      classes.forEach(cls => {
        apiDocs += `### ${cls.name}\n\n`;
        apiDocs += `**Description:** ${cls.description || 'No description available'}\n\n`;
        if (cls.methods.length > 0) {
          apiDocs += `**Methods:**\n`;
          cls.methods.forEach(method => {
            apiDocs += `- \`${method.name}()\`: ${method.description}\n`;
          });
        }
        apiDocs += '\n';
      });
    }

    return apiDocs;
  }

  private generateComponentDocumentation(): string {
    const htmlCode = this.website.html;
    const cssCode = this.website.css;
    const components = this.extractComponents(htmlCode, cssCode);

    let componentDocs = '# Component Documentation\n\n';

    components.forEach(component => {
      componentDocs += `## ${component.name}\n\n`;
      componentDocs += `**Description:** ${component.description}\n\n`;
      componentDocs += `**HTML Structure:**\n\`\`\`html\n${component.html}\n\`\`\`\n\n`;
      componentDocs += `**CSS Styles:**\n\`\`\`css\n${component.css}\n\`\`\`\n\n`;
      
      if (component.props.length > 0) {
        componentDocs += `**Properties:**\n`;
        component.props.forEach(prop => {
          componentDocs += `- \`${prop.name}\`: ${prop.description}\n`;
        });
        componentDocs += '\n';
      }

      componentDocs += `**Usage Example:**\n\`\`\`html\n${component.example}\n\`\`\`\n\n`;
    });

    return componentDocs;
  }

  private generateUserGuide(): string {
    return `# User Guide

## Getting Started

This website was generated using AI and includes modern web technologies for optimal performance and user experience.

## Features

### Navigation
- The website includes a responsive navigation system
- Mobile-friendly hamburger menu for smaller screens
- Smooth scrolling between sections

### Responsive Design
- Optimized for desktop, tablet, and mobile devices
- Flexible grid layouts that adapt to screen size
- Touch-friendly interface elements

### Performance
- Optimized CSS and JavaScript for fast loading
- Compressed images and assets
- Modern web standards compliance

## Customization

### Colors
The website uses CSS custom properties for easy color customization:
\`\`\`css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
\`\`\`

### Content
To update content, modify the HTML sections:
- Hero section: Update the main heading and description
- Features: Add or remove feature cards
- Contact: Update contact information

### Styling
The CSS is organized into logical sections:
- Base styles and resets
- Layout and grid systems
- Component-specific styles
- Media queries for responsiveness

## Browser Support

This website supports:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

1. Upload all files to your web server
2. Ensure proper MIME types are configured
3. Test on multiple devices and browsers
4. Configure HTTPS for security

## Maintenance

- Regularly update content
- Monitor performance metrics
- Test on new browser versions
- Keep dependencies updated
`;
  }

  private generateMarkdownDocs(docs: GeneratedDocumentation): string {
    return `${docs.apiDocs}\n\n${docs.componentDocs}\n\n${docs.userGuide}`;
  }

  private generateHTMLDocs(docs: GeneratedDocumentation): string {
    const markdownContent = this.generateMarkdownDocs(docs);
    const htmlContent = md.render(markdownContent);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 2rem; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
        .toc { background: #f9f9f9; padding: 1rem; border-radius: 5px; margin-bottom: 2rem; }
    </style>
</head>
<body>
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><a href="#api-documentation">API Documentation</a></li>
            <li><a href="#component-documentation">Component Documentation</a></li>
            <li><a href="#user-guide">User Guide</a></li>
        </ul>
    </div>
    ${htmlContent}
</body>
</html>`;
  }

  private async generatePDFDocs(docs: GeneratedDocumentation): Promise<Blob> {
    // This would typically use a library like puppeteer or html-pdf
    // For now, return a placeholder
    const htmlContent = this.generateHTMLDocs(docs);
    return new Blob([htmlContent], { type: 'text/html' });
  }

  private extractFunctions(jsCode: string): any[] {
    const functions: any[] = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
    const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g;
    
    let match;
    while ((match = functionRegex.exec(jsCode)) !== null) {
      functions.push({
        name: match[1],
        description: `Function ${match[1]}`,
        parameters: [],
        returnType: 'void',
        example: `${match[1]}();`
      });
    }

    while ((match = arrowFunctionRegex.exec(jsCode)) !== null) {
      functions.push({
        name: match[1],
        description: `Arrow function ${match[1]}`,
        parameters: [],
        returnType: 'void',
        example: `${match[1]}();`
      });
    }

    return functions;
  }

  private extractClasses(jsCode: string): any[] {
    const classes: any[] = [];
    const classRegex = /class\s+(\w+)/g;
    
    let match;
    while ((match = classRegex.exec(jsCode)) !== null) {
      classes.push({
        name: match[1],
        description: `Class ${match[1]}`,
        methods: []
      });
    }

    return classes;
  }

  private extractComponents(htmlCode: string, cssCode: string): any[] {
    const components: any[] = [];
    
    // Extract sections as components
    const sectionRegex = /<section[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g;
    let match;
    
    while ((match = sectionRegex.exec(htmlCode)) !== null) {
      const className = match[1];
      const sectionContent = match[2];
      
      components.push({
        name: className.charAt(0).toUpperCase() + className.slice(1),
        description: `${className} section component`,
        html: match[0],
        css: this.extractCSSForClass(cssCode, className),
        props: [],
        example: `<section class="${className}">...</section>`
      });
    }

    return components;
  }

  private extractCSSForClass(cssCode: string, className: string): string {
    const classRegex = new RegExp(`\\.${className}[^{]*{[^}]*}`, 'g');
    const matches = cssCode.match(classRegex);
    return matches ? matches.join('\n\n') : '';
  }
}
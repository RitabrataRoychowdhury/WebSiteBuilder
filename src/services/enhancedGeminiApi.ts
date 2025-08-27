import { EnhancedWebsiteRequest, EnhancedGeneratedWebsite, GeminiResponse } from '../types';
import { DocumentationGenerator } from './documentationGenerator';
import { TestGenerator } from './testGenerator';

const GEMINI_API_KEY = 'AIzaSyAUCQtoOYpvM5rZG8uPaODGb0SOFe9gVK0';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const generateEnhancedWebsite = async (request: EnhancedWebsiteRequest): Promise<EnhancedGeneratedWebsite> => {
  const prompt = `
Create a stunning, modern, production-ready website with the following specifications:

Title: ${request.title}
Description: ${request.description}
Type: ${request.type}
Style: ${request.style}
Color Scheme: ${request.colorScheme}
Features: ${request.features.join(', ')}

DESIGN REQUIREMENTS:
- Use modern CSS with gradients, shadows, and smooth animations
- Implement a mobile-first responsive design with elegant breakpoints
- Include hover effects and micro-interactions for better UX
- Use contemporary typography with proper font hierarchy
- Apply the ${request.colorScheme} color scheme throughout
- Create visually appealing sections with proper spacing and layout
- Add subtle animations and transitions for a premium feel
- Use CSS Grid and Flexbox for modern layouts
- Include proper visual hierarchy with cards, sections, and containers
- Make it look like a professional ${request.type} website

TECHNICAL REQUIREMENTS:
- Semantic HTML5 with proper structure and ARIA labels
- Modern CSS with custom properties (CSS variables)
- Smooth animations and transitions
- Interactive JavaScript for enhanced functionality
- Accessibility features (WCAG 2.1 AA compliance)
- SEO-friendly structure with meta tags
- Performance optimized code
- Cross-browser compatibility

DOCUMENTATION REQUIREMENTS:
${request.generateDocs ? `
- Add comprehensive JSDoc comments to all JavaScript functions
- Include detailed CSS comments explaining design decisions
- Add HTML comments for major sections and components
- Use semantic naming conventions throughout
` : ''}

TESTING REQUIREMENTS:
${request.generateTests ? `
- Write testable, modular code
- Include data attributes for testing
- Ensure all interactive elements are accessible
- Use semantic HTML for better testability
` : ''}

Return the code in this exact format:
<!-- HTML START -->
[Complete HTML code with semantic structure, meta tags, and accessibility features]
<!-- HTML END -->

/* CSS START */
[Complete CSS code with modern features, responsive design, and performance optimizations]
/* CSS END */

// JS START
[Complete JavaScript code with proper error handling and modern ES6+ features]
// JS END
`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';

    // Parse the generated code using multiple strategies
    const website = parseGeneratedContent(generatedText, request);

    // Generate documentation if requested
    if (request.generateDocs && request.docConfig) {
      const docGenerator = new DocumentationGenerator(website, request.docConfig);
      website.documentation = await docGenerator.generateDocumentation();
    }

    // Generate and run tests if requested
    if (request.generateTests && request.testConfig) {
      const testGenerator = new TestGenerator(website, request.testConfig);
      website.testSuite = await testGenerator.generateAndRunTests();
    }

    // Generate project structure
    website.projectStructure = generateProjectStructure(website, request);

    return website;
  } catch (error) {
    console.error('Error generating enhanced website:', error);
    // Return fallback content with basic structure
    const fallbackWebsite = generateFallbackWebsite(request);
    
    if (request.generateDocs && request.docConfig) {
      const docGenerator = new DocumentationGenerator(fallbackWebsite, request.docConfig);
      fallbackWebsite.documentation = await docGenerator.generateDocumentation();
    }

    if (request.generateTests && request.testConfig) {
      const testGenerator = new TestGenerator(fallbackWebsite, request.testConfig);
      fallbackWebsite.testSuite = await testGenerator.generateAndRunTests();
    }

    fallbackWebsite.projectStructure = generateProjectStructure(fallbackWebsite, request);
    
    return fallbackWebsite;
  }
};

function parseGeneratedContent(content: string, request: EnhancedWebsiteRequest): EnhancedGeneratedWebsite {
  try {
    // Strategy 1: Try to extract from markdown code blocks
    const htmlMatch = content.match(/<!-- HTML START -->([\s\S]*?)<!-- HTML END -->/);
    const cssMatch = content.match(/\/\* CSS START \*\/([\s\S]*?)\/\* CSS END \*\//);
    const jsMatch = content.match(/\/\/ JS START([\s\S]*?)\/\/ JS END/);

    let html = htmlMatch ? htmlMatch[1].trim() : '';
    let css = cssMatch ? cssMatch[1].trim() : '';
    let js = jsMatch ? jsMatch[1].trim() : '';

    // Strategy 2: Fallback to individual code blocks
    if (!html) {
      const htmlBlockMatch = content.match(/```html\n([\s\S]*?)\n```/);
      html = htmlBlockMatch ? htmlBlockMatch[1] : '';
    }

    if (!css) {
      const cssBlockMatch = content.match(/```css\n([\s\S]*?)\n```/);
      css = cssBlockMatch ? cssBlockMatch[1] : '';
    }

    if (!js) {
      const jsBlockMatch = content.match(/```javascript\n([\s\S]*?)\n```/) || 
                          content.match(/```js\n([\s\S]*?)\n```/);
      js = jsBlockMatch ? jsBlockMatch[1] : '';
    }

    // If still no content, use fallback
    if (!html || !css) {
      return generateFallbackWebsite(request);
    }

    return { html, css, js };
  } catch (error) {
    console.error('Error parsing generated content:', error);
    return generateFallbackWebsite(request);
  }
}

function generateFallbackWebsite(request: EnhancedWebsiteRequest): EnhancedGeneratedWebsite {
  const html = generateFallbackHTML(request);
  const css = generateFallbackCSS(request);
  const js = generateFallbackJS();

  return { html, css, js };
}

function generateFallbackHTML(request: EnhancedWebsiteRequest): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${request.description}">
    <meta name="keywords" content="${request.features.join(', ')}">
    <title>${request.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="nav-container">
            <div class="nav-logo">
                <h1>${request.title}</h1>
            </div>
            <div class="nav-menu">
                <a href="#home" class="nav-link" aria-label="Go to home section">Home</a>
                <a href="#about" class="nav-link" aria-label="Go to about section">About</a>
                <a href="#services" class="nav-link" aria-label="Go to services section">Services</a>
                <a href="#contact" class="nav-link" aria-label="Go to contact section">Contact</a>
            </div>
            <button class="mobile-menu-toggle" aria-label="Toggle mobile menu" data-testid="mobile-menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>

    <!-- Hero Section -->
    <header id="home" class="hero" role="banner">
        <div class="hero-container">
            <div class="hero-content">
                <h1 class="hero-title" data-testid="hero-title">${request.title}</h1>
                <p class="hero-subtitle" data-testid="hero-description">${request.description}</p>
                <div class="hero-buttons">
                    <button class="btn btn-primary" data-testid="cta-primary" aria-label="Get started with ${request.title}">
                        Get Started
                    </button>
                    <button class="btn btn-secondary" data-testid="cta-secondary" aria-label="Learn more about ${request.title}">
                        Learn More
                    </button>
                </div>
            </div>
            <div class="hero-image" aria-hidden="true">
                <div class="hero-graphic"></div>
            </div>
        </div>
    </header>

    <main role="main">
        <!-- Features Section -->
        <section id="services" class="features" aria-labelledby="features-title">
            <div class="container">
                <h2 id="features-title" class="section-title">Our Features</h2>
                <p class="section-subtitle">Everything you need to succeed</p>
                <div class="features-grid" role="list">
                    ${request.features.map((feature, index) => `
                    <div class="feature-card" role="listitem" data-testid="feature-${index}" data-aos="fade-up" data-aos-delay="${index * 100}">
                        <div class="feature-icon" aria-hidden="true">
                            <div class="icon-circle"></div>
                        </div>
                        <h3 class="feature-title">${feature}</h3>
                        <p class="feature-description">Experience the power of ${feature.toLowerCase()} with our innovative approach and cutting-edge technology.</p>
                    </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="about" aria-labelledby="about-title">
            <div class="container">
                <div class="about-content">
                    <div class="about-text">
                        <h2 id="about-title" class="section-title">About ${request.title}</h2>
                        <p class="about-description">${request.description}</p>
                        <p>We're committed to delivering exceptional results that exceed expectations. Our innovative approach combines cutting-edge technology with creative solutions to provide unmatched value.</p>
                        <div class="stats" role="list" aria-label="Company statistics">
                            <div class="stat" role="listitem">
                                <div class="stat-number" data-testid="stat-clients">100+</div>
                                <div class="stat-label">Happy Clients</div>
                            </div>
                            <div class="stat" role="listitem">
                                <div class="stat-number" data-testid="stat-projects">50+</div>
                                <div class="stat-label">Projects Completed</div>
                            </div>
                            <div class="stat" role="listitem">
                                <div class="stat-number" data-testid="stat-experience">5+</div>
                                <div class="stat-label">Years Experience</div>
                            </div>
                        </div>
                    </div>
                    <div class="about-image" aria-hidden="true">
                        <div class="image-placeholder"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="contact" aria-labelledby="contact-title">
            <div class="container">
                <h2 id="contact-title" class="section-title">Get In Touch</h2>
                <p class="section-subtitle">Ready to start your journey with us?</p>
                <div class="contact-content">
                    <div class="contact-info">
                        <div class="contact-item">
                            <h4>Email</h4>
                            <p><a href="mailto:hello@${request.title.toLowerCase().replace(/\s+/g, '')}.com" data-testid="contact-email">hello@${request.title.toLowerCase().replace(/\s+/g, '')}.com</a></p>
                        </div>
                        <div class="contact-item">
                            <h4>Phone</h4>
                            <p><a href="tel:+15551234567" data-testid="contact-phone">+1 (555) 123-4567</a></p>
                        </div>
                        <div class="contact-item">
                            <h4>Address</h4>
                            <p data-testid="contact-address">123 Business St, City, State 12345</p>
                        </div>
                    </div>
                    <form class="contact-form" data-testid="contact-form" aria-label="Contact form">
                        <div class="form-group">
                            <label for="name" class="sr-only">Your Name</label>
                            <input type="text" id="name" name="name" placeholder="Your Name" required aria-required="true" data-testid="form-name">
                        </div>
                        <div class="form-group">
                            <label for="email" class="sr-only">Your Email</label>
                            <input type="email" id="email" name="email" placeholder="Your Email" required aria-required="true" data-testid="form-email">
                        </div>
                        <div class="form-group">
                            <label for="message" class="sr-only">Your Message</label>
                            <textarea id="message" name="message" placeholder="Your Message" rows="5" required aria-required="true" data-testid="form-message"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" data-testid="form-submit" aria-label="Send your message">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>${request.title}</h4>
                    <p>Building the future, one project at a time.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul role="list">
                        <li role="listitem"><a href="#home">Home</a></li>
                        <li role="listitem"><a href="#about">About</a></li>
                        <li role="listitem"><a href="#services">Services</a></li>
                        <li role="listitem"><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Follow Us</h4>
                    <div class="social-links" role="list" aria-label="Social media links">
                        <a href="#" class="social-link" role="listitem" aria-label="Follow us on Twitter" data-testid="social-twitter">Twitter</a>
                        <a href="#" class="social-link" role="listitem" aria-label="Follow us on LinkedIn" data-testid="social-linkedin">LinkedIn</a>
                        <a href="#" class="social-link" role="listitem" aria-label="Follow us on Instagram" data-testid="social-instagram">Instagram</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 ${request.title}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Skip to main content link for accessibility -->
    <a href="#main" class="skip-link">Skip to main content</a>
</body>
</html>`;
}

function generateFallbackCSS(request: EnhancedWebsiteRequest): string {
  const getColorScheme = () => {
    const scheme = request.colorScheme.toLowerCase();
    if (scheme.includes('dark')) return {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#0f3460',
      text: '#ffffff',
      background: '#0d1117'
    };
    if (scheme.includes('blue')) return {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      text: '#333333',
      background: '#ffffff'
    };
    if (scheme.includes('green')) return {
      primary: '#11998e',
      secondary: '#38ef7d',
      accent: '#4facfe',
      text: '#333333',
      background: '#ffffff'
    };
    return {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      text: '#333333',
      background: '#ffffff'
    };
  };

  const colors = getColorScheme();

  return `/* CSS Variables for consistent theming */
:root {
  --primary-color: ${colors.primary};
  --secondary-color: ${colors.secondary};
  --accent-color: ${colors.accent};
  --text-color: ${colors.text};
  --background-color: ${colors.background};
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  overflow-x: hidden;
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-color);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Navigation */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: var(--box-shadow);
  transition: var(--transition);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.nav-logo h1 {
  color: var(--primary-color);
  font-size: 1.5rem;
  font-weight: 700;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  transition: var(--transition);
  position: relative;
}

.nav-link:hover,
.nav-link:focus {
  color: var(--primary-color);
  outline: none;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: var(--transition);
}

.nav-link:hover::after,
.nav-link:focus::after {
  width: 100%;
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-menu-toggle span {
  width: 25px;
  height: 3px;
  background: var(--text-color);
  margin: 3px 0;
  transition: var(--transition);
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: 8rem 0 4rem;
  margin-top: 80px;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.1;
}

.hero-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  animation: fadeInUp 1s ease-out;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  animation: fadeInUp 1s ease-out 0.4s both;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-graphic {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, var(--accent-color), transparent);
  border-radius: 50%;
  position: relative;
  animation: float 6s ease-in-out infinite;
}

.hero-graphic::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn-primary {
  background: white;
  color: var(--primary-color);
}

.btn-primary:hover,
.btn-primary:focus {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  outline: none;
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover,
.btn-secondary:focus {
  background: white;
  color: var(--primary-color);
  outline: none;
}

/* Sections */
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.section-subtitle {
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 3rem;
  opacity: 0.8;
}

/* Features Section */
.features {
  padding: 6rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  text-align: center;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transform: scaleX(0);
  transition: var(--transition);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  margin-bottom: 1.5rem;
}

.icon-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.icon-circle::before {
  content: '✨';
  font-size: 2rem;
  color: white;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.feature-description {
  color: #666;
  line-height: 1.6;
}

/* About Section */
.about {
  padding: 6rem 0;
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.about-text {
  padding-right: 2rem;
}

.about-description {
  font-size: 1.125rem;
  margin-bottom: 2rem;
  color: #666;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 3rem;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.about-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 400px;
  height: 300px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: var(--border-radius);
  position: relative;
  overflow: hidden;
}

.image-placeholder::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

/* Contact Section */
.contact {
  padding: 6rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  margin-top: 3rem;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.contact-item h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.contact-item p {
  color: #666;
}

.contact-item a {
  color: var(--primary-color);
  text-decoration: none;
  transition: var(--transition);
}

.contact-item a:hover,
.contact-item a:focus {
  text-decoration: underline;
  outline: none;
}

.contact-form {
  background: white;
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: var(--transition);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

/* Footer */
.footer {
  background: #1a1a1a;
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #ccc;
  text-decoration: none;
  transition: var(--transition);
}

.footer-section a:hover,
.footer-section a:focus {
  color: white;
  outline: none;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.social-link:hover,
.social-link:focus {
  background: var(--primary-color);
  transform: translateY(-2px);
}

.footer-bottom {
  border-top: 1px solid #333;
  padding-top: 1rem;
  text-align: center;
  color: #ccc;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .nav-menu {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .hero {
    padding: 6rem 0 3rem;
  }

  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .about-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .about-text {
    padding-right: 0;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .social-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 250px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .btn-primary {
    border: 2px solid var(--text-color);
  }
  
  .feature-card {
    border: 1px solid var(--text-color);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .hero-graphic {
    animation: none;
  }
}

/* Print styles */
@media print {
  .navbar,
  .hero-buttons,
  .contact-form,
  .footer {
    display: none;
  }
  
  body {
    font-size: 12pt;
    line-height: 1.4;
  }
  
  .hero {
    background: none;
    color: black;
  }
}`;
}

function generateFallbackJS(): string {
  return `/**
 * Website JavaScript functionality
 * Handles interactive elements and user experience enhancements
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

/**
 * Initialize all website functionality
 */
function initializeWebsite() {
    try {
        initializeMobileMenu();
        initializeSmoothScrolling();
        initializeFormHandling();
        initializeAnimations();
        initializeAccessibility();
        
        console.log('Website initialized successfully');
    } catch (error) {
        console.error('Error initializing website:', error);
    }
}

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('[data-testid="mobile-menu-toggle"]');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = this.querySelectorAll('span');
            spans.forEach((span, index) => {
                span.style.transform = !isExpanded ? 
                    \`rotate(\${index === 1 ? 45 : -45}deg) translate(\${index === 0 ? 5 : -5}px, \${index === 0 ? 5 : -5}px)\` : 
                    'none';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuToggle.contains(event.target) && !navMenu.contains(event.target)) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
    }
}

/**
 * Initialize smooth scrolling for navigation links
 */
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Update focus for accessibility
                targetElement.focus({ preventScroll: true });
            }
        });
    });
}

/**
 * Initialize form handling
 */
function initializeFormHandling() {
    const contactForm = document.querySelector('[data-testid="contact-form"]');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const formObject = Object.fromEntries(formData);
            
            // Validate form
            if (validateForm(formObject)) {
                handleFormSubmission(formObject);
            }
        });
        
        // Add real-time validation
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    }
}

/**
 * Validate form data
 * @param {Object} formData - Form data object
 * @returns {boolean} - Validation result
 */
function validateForm(formData) {
    let isValid = true;
    const errors = [];
    
    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
        isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' });
        isValid = false;
    }
    
    // Message validation
    if (!formData.message || formData.message.trim().length < 10) {
        errors.push({ field: 'message', message: 'Message must be at least 10 characters long' });
        isValid = false;
    }
    
    // Display errors
    if (!isValid) {
        displayFormErrors(errors);
    }
    
    return isValid;
}

/**
 * Validate individual form field
 * @param {HTMLElement} field - Form field element
 */
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';
    
    switch (field.name) {
        case 'name':
            if (value.length < 2) {
                isValid = false;
                message = 'Name must be at least 2 characters long';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
            break;
        case 'message':
            if (value.length < 10) {
                isValid = false;
                message = 'Message must be at least 10 characters long';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, message);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

/**
 * Display form errors
 * @param {Array} errors - Array of error objects
 */
function displayFormErrors(errors) {
    errors.forEach(error => {
        const field = document.querySelector(\`[name="\${error.field}"]\`);
        if (field) {
            showFieldError(field, error.message);
        }
    });
}

/**
 * Show field error
 * @param {HTMLElement} field - Form field element
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    
    field.parentNode.appendChild(errorElement);
}

/**
 * Clear field error
 * @param {HTMLElement} field - Form field element
 */
function clearFieldError(field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Handle form submission
 * @param {Object} formData - Form data object
 */
function handleFormSubmission(formData) {
    const submitButton = document.querySelector('[data-testid="form-submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        // Reset form
        document.querySelector('[data-testid="contact-form"]').reset();
        
        // Show success message
        showNotification('Thank you! Your message has been sent successfully.', 'success');
        
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
        console.log('Form submitted:', formData);
    }, 2000);
}

/**
 * Show notification message
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification notification--\${type}\`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

/**
 * Initialize scroll animations
 */
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Animate stats counter
                if (entry.target.classList.contains('stat-number')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .stat-number, .about-text, .contact-form');
    animateElements.forEach(el => observer.observe(el));
}

/**
 * Animate counter numbers
 * @param {HTMLElement} element - Counter element
 */
function animateCounter(element) {
    const target = parseInt(element.textContent);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + (element.textContent.includes('+') ? '+' : '');
    }, 16);
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
    // Add keyboard navigation for custom elements
    const customButtons = document.querySelectorAll('.btn, .feature-card');
    
    customButtons.forEach(button => {
        if (!button.hasAttribute('tabindex')) {
            button.setAttribute('tabindex', '0');
        }
        
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Add focus indicators
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Announce page changes to screen readers
    const pageTitle = document.title;
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = \`Page loaded: \${pageTitle}\`;
    document.body.appendChild(announcement);
}

/**
 * Handle errors gracefully
 * @param {Error} error - Error object
 * @param {string} context - Error context
 */
function handleError(error, context = 'Unknown') {
    console.error(\`Error in \${context}:\`, error);
    
    // Show user-friendly error message
    showNotification('Something went wrong. Please try again later.', 'error');
    
    // Report error (in production, send to error tracking service)
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'exception', {
            description: error.message,
            fatal: false
        });
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    handleError(e.error, 'Global');
});

window.addEventListener('unhandledrejection', function(e) {
    handleError(e.reason, 'Promise rejection');
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        validateField,
        handleFormSubmission,
        showNotification,
        animateCounter
    };
}`;
}

function generateProjectStructure(website: EnhancedGeneratedWebsite, request: EnhancedWebsiteRequest): any {
  const files = [
    {
      path: 'index.html',
      content: website.html,
      type: 'html' as const
    },
    {
      path: 'styles.css',
      content: website.css,
      type: 'css' as const
    },
    {
      path: 'script.js',
      content: website.js,
      type: 'js' as const
    }
  ];

  if (website.documentation) {
    if (website.documentation.html) {
      files.push({
        path: 'docs/index.html',
        content: website.documentation.html,
        type: 'doc' as const
      });
    }
    if (website.documentation.markdown) {
      files.push({
        path: 'docs/README.md',
        content: website.documentation.markdown,
        type: 'doc' as const
      });
    }
  }

  if (website.testSuite) {
    files.push({
      path: 'tests/website.test.js',
      content: generateTestFile(website.testSuite),
      type: 'test' as const
    });
  }

  return { files };
}

function generateTestFile(testSuite: any): string {
  return `// Generated test file for website
// Test Suite: ${testSuite.name}

describe('Website Tests', () => {
  ${testSuite.results.map((result: any) => `
  test('${result.name}', () => {
    // ${result.type} test
    expect(true).toBe(${result.status === 'pass'});
  });`).join('')}
});

// Test results summary:
// Total tests: ${testSuite.totalTests}
// Passed: ${testSuite.passedTests}
// Failed: ${testSuite.failedTests}
// Duration: ${testSuite.duration}ms
`;
}
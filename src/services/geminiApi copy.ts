import { WebsiteRequest, GeminiResponse, GeneratedWebsite } from '../types';

const GEMINI_API_KEY = 'AIzaSyAUCQtoOYpvM5rZG8uPaODGb0SOFe9gVK0';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const generateWebsite = async (request: WebsiteRequest): Promise<GeneratedWebsite> => {
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
- Semantic HTML5 with proper structure
- Modern CSS with custom properties (CSS variables)
- Smooth animations and transitions
- Interactive JavaScript for enhanced functionality
- Accessibility features (ARIA labels, proper contrast)
- SEO-friendly structure with meta tags

Return the code in this exact format:
<!-- HTML START -->
[HTML code here]
<!-- HTML END -->

/* CSS START */
[CSS code here]
/* CSS END */

// JS START
[JavaScript code here]
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
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';

    // Parse the generated code
    const htmlMatch = generatedText.match(/<!-- HTML START -->([\s\S]*?)<!-- HTML END -->/);
    const cssMatch = generatedText.match(/\/\* CSS START \*\/([\s\S]*?)\/\* CSS END \*\//);
    const jsMatch = generatedText.match(/\/\/ JS START([\s\S]*?)\/\/ JS END/);

    const html = htmlMatch ? htmlMatch[1].trim() : generateFallbackHTML(request);
    const css = cssMatch ? cssMatch[1].trim() : generateFallbackCSS(request);
    const js = jsMatch ? jsMatch[1].trim() : '// No JavaScript generated';

    return { html, css, js };
  } catch (error) {
    console.error('Error generating website:', error);
    // Return fallback content
    return {
      html: generateFallbackHTML(request),
      css: generateFallbackCSS(request),
      js: generateFallbackJS()
    };
  }
};

const generateFallbackHTML = (request: WebsiteRequest): string => {
  const getColorScheme = () => {
    const scheme = request.colorScheme.toLowerCase();
    if (scheme.includes('dark')) return { primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', text: '#ffffff' };
    if (scheme.includes('blue')) return { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb', text: '#333333' };
    if (scheme.includes('green')) return { primary: '#11998e', secondary: '#38ef7d', accent: '#4facfe', text: '#333333' };
    if (scheme.includes('purple')) return { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb', text: '#333333' };
    return { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb', text: '#333333' };
  };

  const colors = getColorScheme();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${request.description}">
    <title>${request.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">${request.title}</div>
            <div class="nav-menu">
                <a href="#home" class="nav-link">Home</a>
                <a href="#about" class="nav-link">About</a>
                <a href="#services" class="nav-link">Services</a>
                <a href="#contact" class="nav-link">Contact</a>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header id="home" class="hero">
        <div class="hero-container">
            <div class="hero-content">
                <h1 class="hero-title">${request.title}</h1>
                <p class="hero-subtitle">${request.description}</p>
                <div class="hero-buttons">
                    <button class="btn btn-primary">Get Started</button>
                    <button class="btn btn-secondary">Learn More</button>
                </div>
            </div>
            <div class="hero-image">
                <div class="hero-graphic"></div>
            </div>
        </div>
    </header>

    <main>
        <!-- Features Section -->
        <section id="services" class="features">
            <div class="container">
                <h2 class="section-title">Our Features</h2>
                <p class="section-subtitle">Everything you need to succeed</p>
                <div class="features-grid">
                    ${request.features.map((feature, index) => `
                    <div class="feature-card" data-aos="fade-up" data-aos-delay="${index * 100}">
                        <div class="feature-icon">
                            <div class="icon-circle"></div>
                        </div>
                        <h3 class="feature-title">${feature}</h3>
                        <p class="feature-description">Experience the power of ${feature.toLowerCase()} with our innovative approach.</p>
                    </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section id="about" class="about">
            <div class="container">
                <div class="about-content">
                    <div class="about-text">
                        <h2 class="section-title">About ${request.title}</h2>
                        <p class="about-description">${request.description}</p>
                        <p>We're committed to delivering exceptional results that exceed expectations. Our innovative approach combines cutting-edge technology with creative solutions.</p>
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-number">100+</div>
                                <div class="stat-label">Happy Clients</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">50+</div>
                                <div class="stat-label">Projects</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">5+</div>
                                <div class="stat-label">Years Experience</div>
                            </div>
                        </div>
                    </div>
                    <div class="about-image">
                        <div class="image-placeholder"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="contact">
            <div class="container">
                <h2 class="section-title">Get In Touch</h2>
                <p class="section-subtitle">Ready to start your journey with us?</p>
                <div class="contact-content">
                    <div class="contact-info">
                        <div class="contact-item">
                            <h4>Email</h4>
                            <p>hello@${request.title.toLowerCase().replace(/\s+/g, '')}.com</p>
                        </div>
                        <div class="contact-item">
                            <h4>Phone</h4>
                            <p>+1 (555) 123-4567</p>
                        </div>
                        <div class="contact-item">
                            <h4>Address</h4>
                            <p>123 Business St, City, State 12345</p>
                        </div>
                    </div>
                    <form class="contact-form">
                        <div class="form-group">
                            <input type="text" placeholder="Your Name" required>
                        </div>
                        <div class="form-group">
                            <input type="email" placeholder="Your Email" required>
                        </div>
                        <div class="form-group">
                            <textarea placeholder="Your Message" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>${request.title}</h4>
                    <p>Building the future, one project at a time.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#services">Services</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Follow Us</h4>
                    <div class="social-links">
                        <a href="#" class="social-link">Twitter</a>
                        <a href="#" class="social-link">LinkedIn</a>
                        <a href="#" class="social-link">Instagram</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 ${request.title}. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
};

const generateFallbackCSS = (request: WebsiteRequest): string => {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background: ${request.colorScheme.includes('dark') ? '#1a1a1a' : '#ffffff'};
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.hero {
    text-align: center;
    padding: 4rem 0;
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.features ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    list-style: none;
    margin-top: 2rem;
}

.features li {
    padding: 1rem;
    background: #f4f4f4;
    border-radius: 8px;
    text-align: center;
}

footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem;
    margin-top: 4rem;
}

@media (max-width: 768px) {
    .hero h2 {
        font-size: 2rem;
    }
    
    main {
        padding: 1rem;
    }
}`;
};
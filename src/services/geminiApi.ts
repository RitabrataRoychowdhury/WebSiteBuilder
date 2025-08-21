import { WebsiteRequest, GeneratedWebsite, GeminiResponse } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateWebsite(request: WebsiteRequest): Promise<GeneratedWebsite> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  const prompt = createWebsitePrompt(request);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const generatedContent = data.candidates[0].content.parts[0].text;
    return parseGeneratedContent(generatedContent);
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate website. Please check your API key and try again.');
  }
}

function createWebsitePrompt(request: WebsiteRequest): string {
  return `Create a complete, modern, responsive website based on the following requirements:

Title: ${request.title}
Description: ${request.description}
Type: ${request.type}
Style: ${request.style}
Color Scheme: ${request.colorScheme}
Features: ${request.features.join(', ')}

Please generate a complete website with the following structure:
1. HTML: Complete HTML5 structure with semantic elements
2. CSS: Modern CSS with responsive design, animations, and the specified color scheme
3. JavaScript: Interactive functionality for the requested features

Requirements:
- Use modern HTML5 semantic elements
- Implement responsive design with mobile-first approach
- Include smooth animations and transitions
- Use the specified color scheme throughout
- Implement all requested features
- Include placeholder content that matches the theme
- Use modern CSS Grid and Flexbox for layouts
- Add hover effects and micro-interactions
- Ensure accessibility with proper ARIA labels
- Include meta tags for SEO

Please format your response as JSON with three properties:
{
  "html": "complete HTML code here",
  "css": "complete CSS code here", 
  "js": "complete JavaScript code here"
}

Make sure the website is production-ready, visually appealing, and fully functional.`;
}

function parseGeneratedContent(content: string): GeneratedWebsite {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        html: parsed.html || '',
        css: parsed.css || '',
        js: parsed.js || ''
      };
    }
    
    // Fallback: try to extract code blocks
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
    const cssMatch = content.match(/```css\n([\s\S]*?)\n```/);
    const jsMatch = content.match(/```javascript\n([\s\S]*?)\n```/);
    
    return {
      html: htmlMatch ? htmlMatch[1] : '',
      css: cssMatch ? cssMatch[1] : '',
      js: jsMatch ? jsMatch[1] : ''
    };
  } catch (error) {
    console.error('Error parsing generated content:', error);
    throw new Error('Failed to parse generated website content');
  }
}
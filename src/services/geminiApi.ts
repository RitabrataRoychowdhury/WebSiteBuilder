import { WebsiteRequest, GeneratedWebsite } from '../types';

export async function generateWebsite(request: WebsiteRequest): Promise<GeneratedWebsite> {
  // TODO: Implement actual API call to Gemini
  // For now, return a placeholder response
  return {
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${request.title || 'Generated Website'}</title>
</head>
<body>
    <h1>${request.title || 'Welcome'}</h1>
    <p>${request.description || 'This is a generated website.'}</p>
</body>
</html>`,
    preview: 'Preview not available'
  };
}
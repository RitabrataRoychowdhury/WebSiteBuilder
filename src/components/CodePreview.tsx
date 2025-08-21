import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GeneratedWebsite } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Code, 
  Download, 
  Copy, 
  Check, 
  Monitor, 
  Smartphone, 
  Tablet,
  ExternalLink
} from 'lucide-react';

interface CodePreviewProps {
  website: GeneratedWebsite;
}

const CodePreview: React.FC<CodePreviewProps> = ({ website }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'css' | 'js'>('preview');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tabs = [
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'html' as const, label: 'HTML', icon: Code },
    { id: 'css' as const, label: 'CSS', icon: Code },
    { id: 'js' as const, label: 'JavaScript', icon: Code }
  ];

  const viewModes = [
    { id: 'desktop' as const, label: 'Desktop', icon: Monitor, width: '100%' },
    { id: 'tablet' as const, label: 'Tablet', icon: Tablet, width: '768px' },
    { id: 'mobile' as const, label: 'Mobile', icon: Smartphone, width: '375px' }
  ];

  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        const fullHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${website.css}</style>
          </head>
          <body>
            ${website.html}
            <script>${website.js}</script>
          </body>
          </html>
        `;
        
        doc.open();
        doc.write(fullHTML);
        doc.close();
      }
    }
  }, [activeTab, website, viewMode]);

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates({ ...copiedStates, [type]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [type]: false });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
${website.css}
  </style>
</head>
<body>
${website.html}
  <script>
${website.js}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
${website.css}
  </style>
</head>
<body>
${website.html}
  <script>
${website.js}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getCodeContent = () => {
    switch (activeTab) {
      case 'html':
        return website.html;
      case 'css':
        return website.css;
      case 'js':
        return website.js;
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl">Website Preview & Code</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={openInNewTab}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="sm"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Preview Mode Controls */}
          {activeTab === 'preview' && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                View:
              </span>
              {viewModes.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-all duration-200 ${
                      viewMode === mode.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content Area */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            {activeTab === 'preview' ? (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 min-h-[600px] flex justify-center">
                <div 
                  className="transition-all duration-300 bg-white rounded-lg shadow-lg overflow-hidden"
                  style={{ 
                    width: viewModes.find(m => m.id === viewMode)?.width,
                    maxWidth: '100%'
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    className="w-full h-[600px] border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    onClick={() => handleCopy(getCodeContent(), activeTab)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copiedStates[activeTab] ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-6 bg-gray-900 text-gray-100 overflow-x-auto text-sm leading-relaxed">
                  <code>{getCodeContent()}</code>
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CodePreview;
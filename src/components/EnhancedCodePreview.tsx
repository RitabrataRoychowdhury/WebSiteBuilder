import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnhancedGeneratedWebsite } from '../types';
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
  ExternalLink,
  FileText,
  TestTube,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  FolderOpen,
  Archive
} from 'lucide-react';

interface EnhancedCodePreviewProps {
  website: EnhancedGeneratedWebsite;
}

const EnhancedCodePreview: React.FC<EnhancedCodePreviewProps> = ({ website }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'css' | 'js' | 'docs' | 'tests' | 'structure'>('preview');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tabs = [
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'html' as const, label: 'HTML', icon: Code },
    { id: 'css' as const, label: 'CSS', icon: Code },
    { id: 'js' as const, label: 'JavaScript', icon: Code },
    ...(website.documentation ? [{ id: 'docs' as const, label: 'Documentation', icon: FileText }] : []),
    ...(website.testSuite ? [{ id: 'tests' as const, label: 'Tests', icon: TestTube }] : []),
    ...(website.projectStructure ? [{ id: 'structure' as const, label: 'Project', icon: FolderOpen }] : [])
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

  const handleDownloadProject = () => {
    if (!website.projectStructure) return;

    // Create a zip-like structure (simplified for demo)
    const files = website.projectStructure.files;
    const projectData = {
      files: files.map(file => ({
        path: file.path,
        content: file.content
      }))
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-structure.json';
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

  const runTests = async () => {
    setIsRunningTests(true);
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunningTests(false);
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

  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
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
            <CardTitle className="text-2xl">Enhanced Website Preview & Code</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
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
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </Button>
              {website.projectStructure && (
                <Button
                  onClick={handleDownloadProject}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="sm"
                >
                  <Archive className="w-4 h-4" />
                  Download Project
                </Button>
              )}
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

          {/* Test Controls */}
          {activeTab === 'tests' && website.testSuite && (
            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Button
                onClick={runTests}
                disabled={isRunningTests}
                className="flex items-center gap-2"
                size="sm"
              >
                <Play className="w-4 h-4" />
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {website.testSuite.passedTests} Passed
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  {website.testSuite.failedTests} Failed
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  {website.testSuite.duration}ms
                </span>
              </div>
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
            ) : activeTab === 'docs' && website.documentation ? (
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="flex gap-2 mb-4">
                  {website.documentation.html && (
                    <Button
                      onClick={() => handleCopy(website.documentation!.html!, 'docs-html')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copiedStates['docs-html'] ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied HTML!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy HTML Docs
                        </>
                      )}
                    </Button>
                  )}
                  {website.documentation.markdown && (
                    <Button
                      onClick={() => handleCopy(website.documentation!.markdown!, 'docs-md')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copiedStates['docs-md'] ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied Markdown!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Markdown
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  {website.documentation.html ? (
                    <div dangerouslySetInnerHTML={{ __html: website.documentation.html }} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">
                      {website.documentation.apiDocs}
                      {'\n\n'}
                      {website.documentation.componentDocs}
                      {'\n\n'}
                      {website.documentation.userGuide}
                    </pre>
                  )}
                </div>
              </div>
            ) : activeTab === 'tests' && website.testSuite ? (
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  {/* Test Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{website.testSuite.totalTests}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Total Tests</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{website.testSuite.passedTests}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Passed</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{website.testSuite.failedTests}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Failed</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{website.testSuite.duration}ms</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Duration</div>
                    </div>
                  </div>

                  {/* Coverage Report */}
                  {website.testSuite.coverage && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Code Coverage
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-lg font-bold">{website.testSuite.coverage.lines}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Lines</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{website.testSuite.coverage.functions}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Functions</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{website.testSuite.coverage.branches}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Branches</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{website.testSuite.coverage.statements}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Statements</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Results */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Test Results</h4>
                    {website.testSuite.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          result.status === 'pass'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                            : result.status === 'fail'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTestStatusIcon(result.status)}
                            <span className="font-medium">{result.name}</span>
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                              {result.type}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {result.duration}ms
                          </span>
                        </div>
                        {result.error && (
                          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {result.error}
                          </div>
                        )}
                        {result.details && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            <pre className="text-xs">{JSON.stringify(result.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'structure' && website.projectStructure ? (
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Project Structure
                  </h4>
                  <div className="space-y-2">
                    {website.projectStructure.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${
                            file.type === 'html' ? 'bg-orange-500' :
                            file.type === 'css' ? 'bg-blue-500' :
                            file.type === 'js' ? 'bg-yellow-500' :
                            file.type === 'test' ? 'bg-green-500' :
                            'bg-gray-500'
                          }`} />
                          <span className="font-mono text-sm">{file.path}</span>
                        </div>
                        <Button
                          onClick={() => handleCopy(file.content, `file-${index}`)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          {copiedStates[`file-${index}`] ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
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
                <pre className="p-6 bg-gray-900 text-gray-100 overflow-x-auto text-sm leading-relaxed max-h-[600px] overflow-y-auto">
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

export default EnhancedCodePreview;
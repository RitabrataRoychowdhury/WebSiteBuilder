import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnhancedWebsiteRequest, EnhancedGeneratedWebsite } from './types';
import { generateEnhancedWebsite } from './services/enhancedGeminiApi';
import EnhancedWebsiteForm from './components/EnhancedWebsiteForm';
import EnhancedCodePreview from './components/EnhancedCodePreview';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Sparkles, Zap, Globe2, Palette, Code2, Rocket, FileText, TestTube, Settings } from 'lucide-react';

function App() {
  const [generatedWebsite, setGeneratedWebsite] = useState<EnhancedGeneratedWebsite | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWebsite = async (request: EnhancedWebsiteRequest) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const website = await generateEnhancedWebsite(request);
      setGeneratedWebsite(website);
    } catch (err) {
      setError('Failed to generate website. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartNew = () => {
    setGeneratedWebsite(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Website Builder</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Powered by Gemini AI</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {generatedWebsite && (
                <Button
                  onClick={handleStartNew}
                  className="flex items-center"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create New Website
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedWebsite ? (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative inline-block mb-6"
              >
                <Globe2 className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto" />
                <div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 rounded-full animate-ping"></div>
              </motion.div>
              
              <motion.h2 
                className="text-5xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                AI-Powered Web Development Platform
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Create stunning websites with integrated documentation and comprehensive testing. 
                Our AI generates production-ready code with automated test suites and complete documentation.
              </motion.p>
            </div>

            {/* Features */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[
                {
                  icon: Code2,
                  title: 'Complete Code Generation',
                  description: 'Generate HTML, CSS, and JavaScript with modern frameworks, responsive design, and accessibility features',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: FileText,
                  title: 'Automated Documentation',
                  description: 'Generate comprehensive API docs, component guides, and user manuals in multiple formats',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: TestTube,
                  title: 'Comprehensive Testing',
                  description: 'Automated unit, integration, E2E, performance, and accessibility tests with detailed reports',
                  gradient: 'from-green-500 to-emerald-500'
                },
                {
                  icon: Rocket,
                  title: 'Production Ready',
                  description: 'Deploy-ready websites with CI/CD integration, performance optimization, and industry best practices',
                  gradient: 'from-orange-500 to-red-500'
                }
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="text-center p-8 h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="pt-6">
                        <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${feature.gradient} p-4 shadow-lg`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Website Form */}
            <EnhancedWebsiteForm onSubmit={handleGenerateWebsite} isGenerating={isGenerating} />
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Success Message */}
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Your Enhanced Website is Ready!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Preview your website, explore the documentation, run tests, and download the complete project.
              </p>
            </motion.div>

            {/* Code Preview */}
            <EnhancedCodePreview website={generatedWebsite} />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2025 Enhanced AI Website Builder. Built with React, TypeScript, and Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
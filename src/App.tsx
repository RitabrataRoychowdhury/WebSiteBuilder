import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WebsiteRequest, GeneratedWebsite } from './types';
import { generateWebsite } from './services/geminiApi';
import WebsiteForm from './components/WebsiteForm';
import CodePreview from './components/CodePreview';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Sparkles, Zap, Globe2, Palette, Code2, Rocket } from 'lucide-react';

function App() {
  const [generatedWebsite, setGeneratedWebsite] = useState<GeneratedWebsite | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWebsite = async (request: WebsiteRequest) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const website = await generateWebsite(request);
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
                className="text-5xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Build Beautiful Websites with AI
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Describe your vision and let our AI create stunning, fully functional, 
                responsive websites in seconds. No coding required.
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
                  icon: Palette,
                  title: 'AI-Powered Generation',
                  description: 'Advanced AI understands your requirements and creates custom websites with modern design patterns',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: Zap,
                  title: 'Instant Results',
                  description: 'Get your complete website with HTML, CSS, and JavaScript in seconds with industry-grade code',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: Rocket,
                  title: 'Production Ready',
                  description: 'Generated websites are responsive, accessible, and ready to deploy with modern animations',
                  gradient: 'from-green-500 to-emerald-500'
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
            <WebsiteForm onSubmit={handleGenerateWebsite} isGenerating={isGenerating} />
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
                Your Website is Ready!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Preview your website below, view the source code, or download the files.
              </p>
            </motion.div>

            {/* Code Preview */}
            <CodePreview website={generatedWebsite} />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2025 AI Website Builder. Built with React, TypeScript, and Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
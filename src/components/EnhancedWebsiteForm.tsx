import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnhancedWebsiteRequest, ValidationError, DocumentationConfig, TestConfig } from '../types';
import { validateWebsiteRequest, sanitizeInput } from '../utils/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader, Globe, Palette, Code, Sparkles, FileText, TestTube, Settings } from 'lucide-react';

interface EnhancedWebsiteFormProps {
  onSubmit: (request: EnhancedWebsiteRequest) => void;
  isGenerating: boolean;
}

const EnhancedWebsiteForm: React.FC<EnhancedWebsiteFormProps> = ({ onSubmit, isGenerating }) => {
  const [formData, setFormData] = useState<Partial<EnhancedWebsiteRequest>>({
    title: '',
    description: '',
    type: 'landing',
    colorScheme: '',
    features: [],
    style: 'modern',
    generateDocs: true,
    generateTests: true,
    docConfig: {
      includeAPI: true,
      includeComponents: true,
      includeUserGuide: true,
      format: 'all',
      includeCodeComments: true
    },
    testConfig: {
      unitTests: true,
      integrationTests: true,
      e2eTests: true,
      performanceTests: true,
      accessibilityTests: true,
      crossBrowserTests: true
    }
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'docs' | 'tests'>('basic');

  const websiteTypes = [
    { value: 'landing', label: 'Landing Page' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'blog', label: 'Blog' },
    { value: 'business', label: 'Business' },
    { value: 'ecommerce', label: 'E-commerce' }
  ];

  const styles = [
    { value: 'modern', label: 'Modern' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'creative', label: 'Creative' },
    { value: 'corporate', label: 'Corporate' }
  ];

  const commonFeatures = [
    'Contact Form',
    'Image Gallery',
    'Testimonials',
    'Social Media Links',
    'Newsletter Signup',
    'Search Functionality',
    'Mobile Menu',
    'Animation Effects'
  ];

  const tabs = [
    { id: 'basic' as const, label: 'Website Details', icon: Globe },
    { id: 'docs' as const, label: 'Documentation', icon: FileText },
    { id: 'tests' as const, label: 'Testing', icon: TestTube }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedData = {
      ...formData,
      title: sanitizeInput(formData.title || ''),
      description: sanitizeInput(formData.description || ''),
      colorScheme: sanitizeInput(formData.colorScheme || '')
    };

    const validationErrors = validateWebsiteRequest(sanitizedData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSubmit(sanitizedData as EnhancedWebsiteRequest);
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formData.features || [];
    const updatedFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    setFormData({ ...formData, features: updatedFeatures });
  };

  const updateDocConfig = (key: keyof DocumentationConfig, value: any) => {
    setFormData({
      ...formData,
      docConfig: {
        ...formData.docConfig!,
        [key]: value
      }
    });
  };

  const updateTestConfig = (key: keyof TestConfig, value: boolean) => {
    setFormData({
      ...formData,
      testConfig: {
        ...formData.testConfig!,
        [key]: value
      }
    });
  };

  const getError = (field: string) => {
    return errors.find(error => error.field === field);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Enhanced Website Builder
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Create websites with integrated documentation and comprehensive testing
          </p>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Website Details Tab */}
            {activeTab === 'basic' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Website Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Website Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${
                      getError('title') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="My Awesome Website"
                    maxLength={100}
                  />
                  {getError('title') && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {getError('title')?.message}
                    </motion.p>
                  )}
                </div>

                {/* Website Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Description *
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm resize-none ${
                      getError('description') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={4}
                    placeholder="Describe what your website is about, its purpose, and target audience..."
                    maxLength={500}
                  />
                  {getError('description') && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {getError('description')?.message}
                    </motion.p>
                  )}
                </div>

                {/* Website Type and Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Website Type *
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200"
                    >
                      {websiteTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Style *
                    </label>
                    <select
                      value={formData.style || ''}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200"
                    >
                      {styles.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Scheme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    <Palette className="w-4 h-4 inline mr-2" />
                    Color Scheme *
                  </label>
                  <input
                    type="text"
                    value={formData.colorScheme || ''}
                    onChange={(e) => setFormData({ ...formData, colorScheme: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm ${
                      getError('colorScheme') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="blue and white, dark theme, warm colors, etc."
                  />
                  {getError('colorScheme') && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {getError('colorScheme')?.message}
                    </motion.p>
                  )}
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Features (Select what you need)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commonFeatures.map((feature, index) => (
                      <motion.label 
                        key={feature} 
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm border border-gray-200 dark:border-gray-600 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <input
                          type="checkbox"
                          checked={(formData.features || []).includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Documentation Tab */}
            {activeTab === 'docs' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Documentation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Automatically create comprehensive documentation for your website</p>
                  </div>
                  <Switch
                    checked={formData.generateDocs || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, generateDocs: checked })}
                  />
                </div>

                {formData.generateDocs && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.docConfig?.includeAPI || false}
                          onChange={(e) => updateDocConfig('includeAPI', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">API Documentation</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.docConfig?.includeComponents || false}
                          onChange={(e) => updateDocConfig('includeComponents', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Component Documentation</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.docConfig?.includeUserGuide || false}
                          onChange={(e) => updateDocConfig('includeUserGuide', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">User Guide</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.docConfig?.includeCodeComments || false}
                          onChange={(e) => updateDocConfig('includeCodeComments', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Code Comments</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Documentation Format
                      </label>
                      <select
                        value={formData.docConfig?.format || 'all'}
                        onChange={(e) => updateDocConfig('format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50"
                      >
                        <option value="html">HTML</option>
                        <option value="markdown">Markdown</option>
                        <option value="pdf">PDF</option>
                        <option value="all">All Formats</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Testing Tab */}
            {activeTab === 'tests' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Test Suite</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Create comprehensive automated tests for your website</p>
                  </div>
                  <Switch
                    checked={formData.generateTests || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, generateTests: checked })}
                  />
                </div>

                {formData.generateTests && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pl-4 border-l-2 border-green-200 dark:border-green-800"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.testConfig?.unitTests || false}
                          onChange={(e) => updateTestConfig('unitTests', e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium">Unit Tests</span>
                          <p className="text-xs text-gray-500">Test individual functions and components</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.testConfig?.integrationTests || false}
                          onChange={(e) => updateTestConfig('integrationTests', e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium">Integration Tests</span>
                          <p className="text-xs text-gray-500">Test component interactions</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.testConfig?.e2eTests || false}
                          onChange={(e) => updateTestConfig('e2eTests', e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium">End-to-End Tests</span>
                          <p className="text-xs text-gray-500">Test complete user workflows</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.testConfig?.performanceTests || false}
                          onChange={(e) => updateTestConfig('performanceTests', e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium">Performance Tests</span>
                          <p className="text-xs text-gray-500">Test load times and optimization</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.testConfig?.accessibilityTests || false}
                          onChange={(e) => updateTestConfig('accessibilityTests', e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium">Accessibility Tests</span>
                          <p className="text-xs text-gray-500">Test WCAG compliance</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.testConfig?.crossBrowserTests || false}
                          onChange={(e) => updateTestConfig('crossBrowserTests', e.target.checked)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <span className="text-sm font-medium">Cross-Browser Tests</span>
                          <p className="text-xs text-gray-500">Test browser compatibility</p>
                        </div>
                      </label>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 mr-3 animate-spin" />
                    Generating Enhanced Website...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-3" />
                    Generate Enhanced Website
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedWebsiteForm;
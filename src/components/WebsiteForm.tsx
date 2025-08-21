import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WebsiteRequest, ValidationError } from '../types';
import { validateWebsiteRequest, sanitizeInput } from '../utils/validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Globe, Palette, Code, Sparkles } from 'lucide-react';

interface WebsiteFormProps {
  onSubmit: (request: WebsiteRequest) => void;
  isGenerating: boolean;
}

const WebsiteForm: React.FC<WebsiteFormProps> = ({ onSubmit, isGenerating }) => {
  const [formData, setFormData] = useState<Partial<WebsiteRequest>>({
    title: '',
    description: '',
    type: 'landing',
    colorScheme: '',
    features: [],
    style: 'modern'
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);

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
    onSubmit(sanitizedData as WebsiteRequest);
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = formData.features || [];
    const updatedFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    setFormData({ ...formData, features: updatedFeatures });
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
              <Globe className="w-5 h-5 text-white" />
            </div>
            Create Your Website
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Website Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
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
            </motion.div>

            {/* Website Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
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
            </motion.div>

            {/* Website Type and Style */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
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
            </motion.div>

            {/* Color Scheme */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
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
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
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
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
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
            </motion.div>

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
                    Generating Website...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-3" />
                    Generate Website
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

export default WebsiteForm;
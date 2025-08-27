import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CodingRequest, CodeStyle, ValidationError } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Code2, Settings, Zap, Plus, X } from 'lucide-react';

interface CodingTaskFormProps {
  onSubmit: (request: CodingRequest) => void;
  isGenerating: boolean;
}

const CodingTaskForm: React.FC<CodingTaskFormProps> = ({ onSubmit, isGenerating }) => {
  const [formData, setFormData] = useState<Partial<CodingRequest>>({
    task: '',
    requirements: [''],
    language: 'typescript',
    framework: '',
    style: {
      indentation: 'spaces',
      indentSize: 2,
      maxLineLength: 100,
      naming: 'camelCase',
      semicolons: true,
      quotes: 'single'
    },
    constraints: ['']
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const languages = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' }
  ];

  const frameworks = {
    typescript: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'NestJS'],
    javascript: ['React', 'Vue', 'Angular', 'Node.js', 'Express'],
    python: ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy'],
    java: ['Spring Boot', 'Spring MVC', 'Hibernate'],
    csharp: ['.NET Core', 'ASP.NET', 'Entity Framework'],
    cpp: ['Qt', 'Boost'],
    go: ['Gin', 'Echo', 'Fiber'],
    rust: ['Actix', 'Rocket', 'Warp'],
    php: ['Laravel', 'Symfony', 'CodeIgniter'],
    ruby: ['Rails', 'Sinatra']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateCodingRequest(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSubmit(formData as CodingRequest);
  };

  const validateCodingRequest = (data: Partial<CodingRequest>): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!data.task || data.task.trim().length < 10) {
      errors.push({ field: 'task', message: 'Task description must be at least 10 characters long' });
    }

    if (!data.requirements || data.requirements.filter(req => req.trim().length > 0).length === 0) {
      errors.push({ field: 'requirements', message: 'At least one requirement is needed' });
    }

    if (!data.language) {
      errors.push({ field: 'language', message: 'Programming language is required' });
    }

    return errors;
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...(formData.requirements || []), '']
    });
  };

  const removeRequirement = (index: number) => {
    const newRequirements = [...(formData.requirements || [])];
    newRequirements.splice(index, 1);
    setFormData({
      ...formData,
      requirements: newRequirements.length > 0 ? newRequirements : ['']
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...(formData.requirements || [])];
    newRequirements[index] = value;
    setFormData({
      ...formData,
      requirements: newRequirements
    });
  };

  const addConstraint = () => {
    setFormData({
      ...formData,
      constraints: [...(formData.constraints || []), '']
    });
  };

  const removeConstraint = (index: number) => {
    const newConstraints = [...(formData.constraints || [])];
    newConstraints.splice(index, 1);
    setFormData({
      ...formData,
      constraints: newConstraints.length > 0 ? newConstraints : ['']
    });
  };

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...(formData.constraints || [])];
    newConstraints[index] = value;
    setFormData({
      ...formData,
      constraints: newConstraints
    });
  };

  const updateStyle = (key: keyof CodeStyle, value: any) => {
    setFormData({
      ...formData,
      style: {
        ...formData.style!,
        [key]: value
      }
    });
  };

  const getError = (field: string) => {
    return errors.find(error => error.field === field);
  };

  const availableFrameworks = frameworks[formData.language as keyof typeof frameworks] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            Two-Agent Coding Workflow
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Submit your coding task and get high-quality, reviewed code through our AI workflow
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Task Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Task Description *
              </label>
              <textarea
                value={formData.task || ''}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm resize-none ${
                  getError('task') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                rows={4}
                placeholder="Describe what you want the code to do. Be specific about functionality, inputs, outputs, and any special requirements..."
                maxLength={1000}
              />
              {getError('task') && (
                <motion.p 
                  className="text-red-500 text-sm mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {getError('task')?.message}
                </motion.p>
              )}
            </motion.div>

            {/* Language and Framework */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Programming Language *
                </label>
                <select
                  value={formData.language || ''}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value, framework: '' })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Framework (Optional)
                </label>
                <select
                  value={formData.framework || ''}
                  onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">None</option>
                  {availableFrameworks.map(framework => (
                    <option key={framework} value={framework}>{framework}</option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requirements *
                </label>
                <Button
                  type="button"
                  onClick={addRequirement}
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.requirements || ['']).map((requirement, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200"
                      placeholder={`Requirement ${index + 1}`}
                    />
                    {(formData.requirements || []).length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {getError('requirements') && (
                <motion.p 
                  className="text-red-500 text-sm mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {getError('requirements')?.message}
                </motion.p>
              )}
            </motion.div>

            {/* Constraints */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Constraints (Optional)
                </label>
                <Button
                  type="button"
                  onClick={addConstraint}
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.constraints || ['']).map((constraint, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={constraint}
                      onChange={(e) => updateConstraint(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-200"
                      placeholder={`Constraint ${index + 1} (e.g., no external dependencies, must be under 100 lines)`}
                    />
                    {(formData.constraints || []).length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeConstraint(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Code Style Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code Style Preferences
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Indentation
                  </label>
                  <select
                    value={formData.style?.indentation || 'spaces'}
                    onChange={(e) => updateStyle('indentation', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="spaces">Spaces</option>
                    <option value="tabs">Tabs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Indent Size
                  </label>
                  <select
                    value={formData.style?.indentSize || 2}
                    onChange={(e) => updateStyle('indentSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Naming Convention
                  </label>
                  <select
                    value={formData.style?.naming || 'camelCase'}
                    onChange={(e) => updateStyle('naming', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="camelCase">camelCase</option>
                    <option value="snake_case">snake_case</option>
                    <option value="PascalCase">PascalCase</option>
                    <option value="kebab-case">kebab-case</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Max Line Length
                  </label>
                  <input
                    type="number"
                    value={formData.style?.maxLineLength || 100}
                    onChange={(e) => updateStyle('maxLineLength', parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    min={80}
                    max={200}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Quotes
                  </label>
                  <select
                    value={formData.style?.quotes || 'single'}
                    onChange={(e) => updateStyle('quotes', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  >
                    <option value="single">Single (')</option>
                    <option value="double">Double (")</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.style?.semicolons || false}
                      onChange={(e) => updateStyle('semicolons', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Use Semicolons</span>
                  </label>
                </div>
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
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 mr-3 animate-spin" />
                    Processing Workflow...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-3" />
                    Start Two-Agent Workflow
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

export default CodingTaskForm;
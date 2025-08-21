import { WebsiteRequest, ValidationError } from '../types';

export const validateWebsiteRequest = (data: Partial<WebsiteRequest>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 3 characters long'
    });
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push({
      field: 'description',
      message: 'Description must be at least 10 characters long'
    });
  }

  if (!data.type) {
    errors.push({
      field: 'type',
      message: 'Website type is required'
    });
  }

  if (!data.style) {
    errors.push({
      field: 'style',
      message: 'Style preference is required'
    });
  }

  if (!data.colorScheme || data.colorScheme.trim().length === 0) {
    errors.push({
      field: 'colorScheme',
      message: 'Color scheme is required'
    });
  }

  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
import React from 'react';
import { GeneratedWebsite } from '../types';

interface CodePreviewProps {
  website: GeneratedWebsite;
}

const CodePreview: React.FC<CodePreviewProps> = ({ website }) => {
  return (
    <div className="code-preview">
      <h3>Generated Code Preview</h3>
      <pre>
        <code>{website.code}</code>
      </pre>
    </div>
  );
};

export default CodePreview;
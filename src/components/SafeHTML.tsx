/**
 * Safe HTML Component
 * Renders sanitized HTML content to prevent XSS attacks
 */

import React from 'react';
import { sanitizeHTML, sanitizeEmailHTML } from '../utils/sanitize';

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowEmail?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Component that safely renders HTML content with XSS protection
 * Use this instead of dangerouslySetInnerHTML
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({ 
  html, 
  className, 
  allowEmail = false,
  as: Component = 'div'
}) => {
  const sanitized = allowEmail ? sanitizeEmailHTML(html) : sanitizeHTML(html);
  
  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default SafeHTML;

/**
 * HTML Sanitization Utilities
 * Provides safe HTML rendering to prevent XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The untrusted HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHTML = (
  dirty: string,
  options?: DOMPurify.Config
): string => {
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
      'width', 'height', 'align', 'valign', 'colspan', 'rowspan'
    ],
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
  };

  const config = { ...defaultConfig, ...options };
  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitize email HTML content (allows more tags for email templates)
 * @param dirty - The untrusted HTML string
 * @returns Sanitized HTML string safe for email rendering
 */
export const sanitizeEmailHTML = (dirty: string): string => {
  return sanitizeHTML(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'blockquote', 'code', 'pre', 'hr', 'font', 'center'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style',
      'width', 'height', 'align', 'valign', 'colspan', 'rowspan', 'color',
      'bgcolor', 'border', 'cellpadding', 'cellspacing'
    ],
  });
};

/**
 * Escape HTML special characters
 * @param text - The text to escape
 * @returns Escaped text safe for HTML rendering
 */
export const escapeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Strip all HTML tags from a string
 * @param html - The HTML string
 * @returns Plain text without HTML tags
 */
export const stripHTML = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

/**
 * Sanitize user input for search queries
 * @param input - The user input
 * @returns Sanitized search query
 */
export const sanitizeSearchQuery = (input: string): string => {
  return input
    .replace(/[<>\"\']/g, '') // Remove dangerous characters
    .trim()
    .slice(0, 200); // Limit length
};

/**
 * Validate and sanitize URL
 * @param url - The URL to validate
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeURL = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

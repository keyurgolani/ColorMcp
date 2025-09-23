/**
 * Input sanitization and validation for security
 */

import { logger } from '../utils/logger';

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  allowedCharacters?: RegExp;
  stripScripts?: boolean;
  stripEvents?: boolean;
}

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  removedElements: string[];
  securityIssues: string[];
}

export class InputSanitizer {
  private static instance: InputSanitizer;

  private constructor() {}

  public static getInstance(): InputSanitizer {
    if (!InputSanitizer.instance) {
      InputSanitizer.instance = new InputSanitizer();
    }
    return InputSanitizer.instance;
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  public sanitizeHtml(
    input: string,
    options: SanitizationOptions = {}
  ): SanitizationResult {
    const {
      allowHtml = false,
      maxLength = 10000,
      stripEvents = true,
    } = options;

    let sanitized = input;
    const removedElements: string[] = [];
    const securityIssues: string[] = [];
    let wasModified = false;

    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      wasModified = true;
      securityIssues.push(`Input truncated to ${maxLength} characters`);
    }

    if (!allowHtml) {
      // Escape all HTML entities
      const originalLength = sanitized.length;
      sanitized = this.escapeHtml(sanitized);
      if (sanitized.length !== originalLength) {
        wasModified = true;
        securityIssues.push('HTML entities escaped');
      }
    } else {
      // Remove dangerous elements and attributes
      const scriptPattern =
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      const scriptMatches = sanitized.match(scriptPattern);
      if (scriptMatches) {
        sanitized = sanitized.replace(scriptPattern, '');
        removedElements.push(...scriptMatches);
        wasModified = true;
        securityIssues.push('Script tags removed');
      }

      // Remove event handlers
      if (stripEvents) {
        const eventPattern = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
        const eventMatches = sanitized.match(eventPattern);
        if (eventMatches) {
          sanitized = sanitized.replace(eventPattern, '');
          removedElements.push(...eventMatches);
          wasModified = true;
          securityIssues.push('Event handlers removed');
        }
      }

      // Remove javascript: URLs
      const jsUrlPattern = /javascript\s*:/gi;
      if (jsUrlPattern.test(sanitized)) {
        sanitized = sanitized.replace(jsUrlPattern, 'blocked:');
        wasModified = true;
        securityIssues.push('JavaScript URLs blocked');
      }

      // Remove data: URLs with executable content
      const dataUrlPattern =
        /data\s*:\s*[^,]*(?:text\/html|application\/javascript|text\/javascript|javascript|vbscript)[^,]*,/gi;
      if (dataUrlPattern.test(sanitized)) {
        sanitized = sanitized.replace(
          dataUrlPattern,
          'data:text/plain,blocked'
        );
        wasModified = true;
        securityIssues.push('Executable data URLs blocked');
      }
    }

    // Log security issues
    if (securityIssues.length > 0) {
      logger.warn('Input sanitization applied', {
        securityIssues,
        removedElements: removedElements.length,
      });
    }

    return {
      sanitized,
      wasModified,
      removedElements,
      securityIssues,
    };
  }

  /**
   * Sanitize URL to prevent malicious redirects
   */
  public sanitizeUrl(url: string): SanitizationResult {
    let sanitized = url.trim();
    const securityIssues: string[] = [];
    let wasModified = false;

    // Check for valid URL format
    try {
      const urlObj = new URL(sanitized);

      // Block dangerous protocols
      const dangerousProtocols = [
        'javascript:',
        'data:',
        'vbscript:',
        'file:',
        'ftp:',
      ];

      if (dangerousProtocols.some(protocol => urlObj.protocol === protocol)) {
        sanitized = 'about:blank';
        wasModified = true;
        securityIssues.push(`Blocked dangerous protocol: ${urlObj.protocol}`);
      }

      // Only allow HTTP and HTTPS for external resources
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        sanitized = 'about:blank';
        wasModified = true;
        securityIssues.push(`Blocked non-HTTP protocol: ${urlObj.protocol}`);
      }

      // Check for suspicious domains (basic check)
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
      if (suspiciousDomains.includes(urlObj.hostname)) {
        sanitized = 'about:blank';
        wasModified = true;
        securityIssues.push(`Blocked suspicious domain: ${urlObj.hostname}`);
      }
    } catch {
      sanitized = 'about:blank';
      wasModified = true;
      securityIssues.push('Invalid URL format');
    }

    if (securityIssues.length > 0) {
      logger.warn('URL sanitization applied', { url, securityIssues });
    }

    return {
      sanitized,
      wasModified,
      removedElements: [],
      securityIssues,
    };
  }

  /**
   * Sanitize color input to prevent injection attacks
   */
  public sanitizeColorInput(color: string): SanitizationResult {
    let sanitized = color.trim();
    const securityIssues: string[] = [];
    let wasModified = false;

    // Remove script tags and their content first
    const scriptTagPattern = /<script[^>]*>.*?<\/script>/gi;
    const beforeScriptTag = sanitized;
    sanitized = sanitized.replace(scriptTagPattern, '');
    if (sanitized !== beforeScriptTag) {
      wasModified = true;
      securityIssues.push('HTML tags removed from color input');
    }

    // Remove any remaining HTML tags
    const htmlPattern = /<[^>]*>/g;
    const originalLength = sanitized.length;
    sanitized = sanitized.replace(htmlPattern, '');
    if (sanitized.length !== originalLength) {
      wasModified = true;
      securityIssues.push('HTML tags removed from color input');
    }

    // Remove any script-like content
    const scriptPattern =
      /(javascript|vbscript|onload|onerror|eval|expression)/gi;
    const beforeScript = sanitized;
    sanitized = sanitized.replace(scriptPattern, '');
    if (sanitized !== beforeScript) {
      wasModified = true;
      securityIssues.push('Script-like content removed from color input');
    }

    // Limit length
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
      wasModified = true;
      securityIssues.push('Color input truncated to 100 characters');
    }

    // Only allow safe characters for color values
    const safeColorPattern = /^[a-zA-Z0-9#(),%.\s:[\]-]+$/;
    if (!safeColorPattern.test(sanitized)) {
      // Remove unsafe characters
      sanitized = sanitized.replace(/[^a-zA-Z0-9#(),%.\s:[\]-]/g, '');
      wasModified = true;
      securityIssues.push('Unsafe characters removed from color input');
    }

    if (securityIssues.length > 0) {
      logger.warn('Color input sanitization applied', {
        originalColor: color,
        sanitizedColor: sanitized,
        securityIssues,
      });
    }

    return {
      sanitized,
      wasModified,
      removedElements: [],
      securityIssues,
    };
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, match => htmlEscapes[match] || match);
  }

  /**
   * Validate file upload content
   */
  public validateFileContent(
    buffer: Buffer,
    expectedType: string
  ): {
    isValid: boolean;
    actualType?: string;
    securityIssues: string[];
  } {
    const securityIssues: string[] = [];

    // Check file size (max 50MB)
    if (buffer.length > 50 * 1024 * 1024) {
      return {
        isValid: false,
        securityIssues: ['File size exceeds 50MB limit'],
      };
    }

    // Check for executable content in the beginning of the file
    const header = buffer.slice(0, 1024).toString('ascii', 0, 1024);
    const executablePatterns = [
      /MZ/, // Windows executable
      /\x7fELF/, // Linux executable
      /#!\/bin/, // Shell script
      /<script/i, // HTML with script
      /javascript/i, // JavaScript content
    ];

    for (const pattern of executablePatterns) {
      if (pattern.test(header)) {
        securityIssues.push('Executable content detected in file');
        return {
          isValid: false,
          securityIssues,
        };
      }
    }

    // Basic image format validation
    if (expectedType === 'image') {
      const imageSignatures = [
        { signature: [0xff, 0xd8, 0xff], type: 'jpeg' },
        { signature: [0x89, 0x50, 0x4e, 0x47], type: 'png' },
        { signature: [0x47, 0x49, 0x46], type: 'gif' },
        { signature: [0x52, 0x49, 0x46, 0x46], type: 'webp' },
      ];

      let actualType: string | undefined;
      for (const { signature, type } of imageSignatures) {
        if (signature.every((byte, index) => buffer[index] === byte)) {
          actualType = type;
          break;
        }
      }

      if (!actualType) {
        securityIssues.push('Invalid image file format');
        return {
          isValid: false,
          securityIssues,
        };
      }

      return {
        isValid: true,
        actualType,
        securityIssues,
      };
    }

    return {
      isValid: true,
      securityIssues,
    };
  }
}

// Export singleton instance
export const inputSanitizer = InputSanitizer.getInstance();

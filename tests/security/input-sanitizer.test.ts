/**
 * Tests for input sanitization
 */

import { inputSanitizer } from '../../src/security/input-sanitizer';

describe('InputSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML entities when HTML is not allowed', () => {
      const input = '<script>alert("xss")</script><p>Hello</p>';
      const result = inputSanitizer.sanitizeHtml(input, { allowHtml: false });

      expect(result.sanitized).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;&lt;p&gt;Hello&lt;&#x2F;p&gt;'
      );
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain('HTML entities escaped');
    });

    it('should remove script tags when HTML is allowed', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><div>World</div>';
      const result = inputSanitizer.sanitizeHtml(input, { allowHtml: true });

      expect(result.sanitized).toBe('<p>Hello</p><div>World</div>');
      expect(result.wasModified).toBe(true);
      expect(result.removedElements).toHaveLength(1);
      expect(result.securityIssues).toContain('Script tags removed');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)" onload="evil()">Content</div>';
      const result = inputSanitizer.sanitizeHtml(input, { allowHtml: true });

      expect(result.sanitized).toBe('<div>Content</div>');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain('Event handlers removed');
    });

    it('should block javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = inputSanitizer.sanitizeHtml(input, { allowHtml: true });

      expect(result.sanitized).toBe('<a href="blocked:alert(1)">Link</a>');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain('JavaScript URLs blocked');
    });

    it('should block executable data URLs', () => {
      const input =
        '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">';
      const result = inputSanitizer.sanitizeHtml(input, { allowHtml: true });

      expect(result.sanitized).toContain('data:text/plain,blocked');
      expect(result.wasModified).toBe(true);
    });

    it('should truncate overly long input', () => {
      const input = 'a'.repeat(15000);
      const result = inputSanitizer.sanitizeHtml(input, { maxLength: 10000 });

      expect(result.sanitized).toHaveLength(10000);
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Input truncated to 10000 characters'
      );
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTPS URLs', () => {
      const input = 'https://example.com/image.jpg';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe(input);
      expect(result.wasModified).toBe(false);
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should allow valid HTTP URLs', () => {
      const input = 'http://example.com/image.jpg';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe(input);
      expect(result.wasModified).toBe(false);
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should block javascript: URLs', () => {
      const input = 'javascript:alert(1)';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe('about:blank');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Blocked dangerous protocol: javascript:'
      );
    });

    it('should block data: URLs', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe('about:blank');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Blocked dangerous protocol: data:'
      );
    });

    it('should block file: URLs', () => {
      const input = 'file:///etc/passwd';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe('about:blank');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Blocked dangerous protocol: file:'
      );
    });

    it('should block localhost URLs', () => {
      const input = 'http://localhost:8080/admin';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe('about:blank');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Blocked suspicious domain: localhost'
      );
    });

    it('should block invalid URLs', () => {
      const input = 'not-a-url';
      const result = inputSanitizer.sanitizeUrl(input);

      expect(result.sanitized).toBe('about:blank');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain('Invalid URL format');
    });
  });

  describe('sanitizeColorInput', () => {
    it('should allow valid hex colors', () => {
      const input = '#FF0000';
      const result = inputSanitizer.sanitizeColorInput(input);

      expect(result.sanitized).toBe(input);
      expect(result.wasModified).toBe(false);
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should allow valid RGB colors', () => {
      const input = 'rgb(255, 0, 0)';
      const result = inputSanitizer.sanitizeColorInput(input);

      expect(result.sanitized).toBe(input);
      expect(result.wasModified).toBe(false);
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should remove HTML tags from color input', () => {
      const input = '<script>alert(1)</script>#FF0000';
      const result = inputSanitizer.sanitizeColorInput(input);

      expect(result.sanitized).toBe('#FF0000');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'HTML tags removed from color input'
      );
    });

    it('should remove script-like content', () => {
      const input = 'javascript:alert(1)';
      const result = inputSanitizer.sanitizeColorInput(input);

      expect(result.sanitized).toBe(':alert(1)');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Script-like content removed from color input'
      );
    });

    it('should truncate overly long color input', () => {
      const input = '#FF0000' + 'a'.repeat(100);
      const result = inputSanitizer.sanitizeColorInput(input);

      expect(result.sanitized).toHaveLength(100);
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Color input truncated to 100 characters'
      );
    });

    it('should remove unsafe characters', () => {
      const input = '#FF0000<>&"\'';
      const result = inputSanitizer.sanitizeColorInput(input);

      expect(result.sanitized).toBe('#FF0000');
      expect(result.wasModified).toBe(true);
      expect(result.securityIssues).toContain(
        'Unsafe characters removed from color input'
      );
    });
  });

  describe('validateFileContent', () => {
    it('should validate JPEG files', () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = inputSanitizer.validateFileContent(jpegHeader, 'image');

      expect(result.isValid).toBe(true);
      expect(result.actualType).toBe('jpeg');
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should validate PNG files', () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const result = inputSanitizer.validateFileContent(pngHeader, 'image');

      expect(result.isValid).toBe(true);
      expect(result.actualType).toBe('png');
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should reject files that are too large', () => {
      const largeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      const result = inputSanitizer.validateFileContent(largeBuffer, 'image');

      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('File size exceeds 50MB limit');
    });

    it('should detect executable content', () => {
      const executableBuffer = Buffer.from('MZ\x90\x00'); // Windows executable header
      const result = inputSanitizer.validateFileContent(
        executableBuffer,
        'image'
      );

      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain(
        'Executable content detected in file'
      );
    });

    it('should detect script content in files', () => {
      const scriptBuffer = Buffer.from('<script>alert(1)</script>');
      const result = inputSanitizer.validateFileContent(scriptBuffer, 'image');

      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain(
        'Executable content detected in file'
      );
    });

    it('should reject invalid image formats', () => {
      const invalidBuffer = Buffer.from('invalid image data');
      const result = inputSanitizer.validateFileContent(invalidBuffer, 'image');

      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('Invalid image file format');
    });
  });
});

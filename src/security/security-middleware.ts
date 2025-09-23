/**
 * Security middleware for MCP tool execution
 */

import { logger } from '../utils/logger';
import { inputSanitizer } from './input-sanitizer';
import { rateLimiter } from './rate-limiter';
import { securityAuditor } from './security-audit';
import { resourceManager } from '../utils/resource-manager';

export interface SecurityContext {
  operation: string;
  clientId?: string;
  userAgent?: string;
  ipAddress?: string;
  parameters: Record<string, unknown>;
}

export interface SecurityCheckResult {
  allowed: boolean;
  sanitizedParameters?: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  rateLimitInfo?: {
    remainingRequests: number;
    resetTime: number;
    retryAfter?: number;
  };
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;

  private constructor() {}

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Comprehensive security check before tool execution
   */
  public async checkSecurity(
    context: SecurityContext
  ): Promise<SecurityCheckResult> {
    const { operation, clientId = 'default', parameters } = context;
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitizedParameters = { ...parameters };

    logger.debug(`Security check for operation: ${operation}`, {
      tool: operation,
      clientId,
    });

    try {
      // 1. Rate limiting check
      const rateLimitResult = rateLimiter.checkRateLimit(operation, clientId);
      if (!rateLimitResult.allowed) {
        errors.push(
          `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`
        );

        securityAuditor.logSecurityEvent({
          type: 'rate_limit',
          severity: 'medium',
          operation,
          clientId,
          details: {
            limit: 'exceeded',
            retryAfter: rateLimitResult.retryAfter,
          },
        });

        return {
          allowed: false,
          errors,
          warnings,
          rateLimitInfo: rateLimitResult,
        };
      }

      // 2. Resource availability check
      const resourceAllowed =
        await resourceManager.shouldAllowRequest(operation);
      if (!resourceAllowed) {
        errors.push('Server is under high load. Please try again later.');

        securityAuditor.logSecurityEvent({
          type: 'resource_abuse',
          severity: 'high',
          operation,
          clientId: clientId || 'unknown',
          details: {
            reason: 'resource_exhaustion',
            resourceStatus: resourceManager.getResourceStatus(),
          },
        });

        return {
          allowed: false,
          errors,
          warnings,
          rateLimitInfo: rateLimitResult,
        };
      }

      // 3. Operation-specific security checks
      const operationAllowed = resourceManager.isOperationAllowed(operation);
      if (!operationAllowed) {
        errors.push(
          'Operation temporarily disabled due to resource constraints.'
        );

        securityAuditor.logSecurityEvent({
          type: 'access_denied',
          severity: 'medium',
          operation,
          clientId: clientId || 'unknown',
          details: {
            reason: 'operation_disabled',
          },
        });

        return {
          allowed: false,
          errors,
          warnings,
          rateLimitInfo: rateLimitResult,
        };
      }

      // 4. Suspicious activity detection (before sanitization to catch malicious input)
      const suspiciousActivity = this.detectSuspiciousActivity(
        context,
        parameters // Use original parameters, not sanitized
      );
      if (suspiciousActivity.isSuspicious) {
        if (suspiciousActivity.severity === 'critical') {
          errors.push('Request blocked due to suspicious activity.');
          return {
            allowed: false,
            errors,
            warnings,
            rateLimitInfo: rateLimitResult,
          };
        } else {
          warnings.push('Suspicious activity detected - request monitored.');
        }
      }

      // 5. Input validation and sanitization
      const sanitizationResult = await this.sanitizeParameters(
        operation,
        parameters
      );
      sanitizedParameters = sanitizationResult.sanitized;

      if (sanitizationResult.errors.length > 0) {
        errors.push(...sanitizationResult.errors);
      }

      if (sanitizationResult.warnings.length > 0) {
        warnings.push(...sanitizationResult.warnings);
      }

      // 6. Final validation
      const validationResult = await this.validateFinalParameters(
        operation,
        sanitizedParameters
      );
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
      }

      const allowed = errors.length === 0;

      if (allowed) {
        logger.debug(`Security check passed for ${operation}`, {
          tool: operation,
          clientId,
          warnings: warnings.length,
        });
      } else {
        logger.warn(`Security check failed for ${operation}`, {
          tool: operation,
          clientId,
          errors: errors.length,
          warnings: warnings.length,
        });
      }

      const result: SecurityCheckResult = {
        allowed,
        errors,
        warnings,
        rateLimitInfo: rateLimitResult,
      };

      if (allowed) {
        result.sanitizedParameters = sanitizedParameters;
      }

      return result;
    } catch (error) {
      logger.error(`Security check error for ${operation}`, {
        tool: operation,
        error: error as Error,
      });

      const logContext: Record<string, unknown> = {
        error: (error as Error).message,
        stack: (error as Error).stack,
      };

      securityAuditor.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        operation,
        clientId: clientId || 'unknown',
        details: logContext,
      });

      return {
        allowed: false,
        errors: ['Security check failed due to internal error.'],
        warnings,
      };
    }
  }

  /**
   * Sanitize parameters based on operation type
   */
  private async sanitizeParameters(
    operation: string,
    parameters: Record<string, unknown>
  ): Promise<{
    sanitized: Record<string, unknown>;
    errors: string[];
    warnings: string[];
  }> {
    const sanitized = { ...parameters };
    const errors: string[] = [];
    const warnings: string[] = [];

    // Color input sanitization
    const colorFields = [
      'color',
      'base_color',
      'primary_color',
      'foreground',
      'background',
    ];
    for (const field of colorFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        const result = inputSanitizer.sanitizeColorInput(
          sanitized[field] as string
        );
        sanitized[field] = result.sanitized;

        if (result.wasModified) {
          warnings.push(`Color input '${field}' was sanitized.`);

          securityAuditor.logSecurityEvent({
            type: 'input_validation',
            severity: 'low',
            operation,
            details: {
              field,
              securityIssues: result.securityIssues,
            },
          });
        }
      }
    }

    // Array of colors sanitization
    const colorArrayFields = ['colors', 'palette', 'color_sets'];
    for (const field of colorArrayFields) {
      if (Array.isArray(sanitized[field])) {
        const colorArray = sanitized[field] as string[];
        const sanitizedArray: string[] = [];

        for (let i = 0; i < colorArray.length; i++) {
          const colorValue = colorArray[i];
          if (typeof colorValue === 'string') {
            const result = inputSanitizer.sanitizeColorInput(colorValue);
            sanitizedArray.push(result.sanitized);

            if (result.wasModified) {
              warnings.push(`Color in array '${field}[${i}]' was sanitized.`);
            }
          } else if (colorValue !== undefined) {
            sanitizedArray.push(colorValue);
          }
        }

        sanitized[field] = sanitizedArray;
      }
    }

    // URL sanitization
    const urlFields = ['image_url'];
    for (const field of urlFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        const result = inputSanitizer.sanitizeUrl(sanitized[field] as string);
        sanitized[field] = result.sanitized;

        if (result.wasModified) {
          if (result.securityIssues.some(issue => issue.includes('Blocked'))) {
            errors.push(
              `URL '${field}' contains security risks and was blocked.`
            );
          } else {
            warnings.push(`URL '${field}' was sanitized.`);
          }

          securityAuditor.logSecurityEvent({
            type: 'input_validation',
            severity: result.securityIssues.some(issue =>
              issue.includes('Blocked')
            )
              ? 'high'
              : 'medium',
            operation,
            details: {
              field,
              securityIssues: result.securityIssues,
            },
          });
        }
      }
    }

    // HTML content sanitization
    const htmlFields = ['html_content', 'template'];
    for (const field of htmlFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        const result = inputSanitizer.sanitizeHtml(sanitized[field] as string, {
          allowHtml: true,
          maxLength: 100000,
        });
        sanitized[field] = result.sanitized;

        if (result.wasModified) {
          warnings.push(`HTML content '${field}' was sanitized.`);

          securityAuditor.logSecurityEvent({
            type: 'input_validation',
            severity: result.securityIssues.length > 0 ? 'medium' : 'low',
            operation,
            details: {
              field,
              securityIssues: result.securityIssues,
              removedElements: result.removedElements.length,
            },
          });
        }
      }
    }

    // Numeric parameter validation
    const numericFields = [
      'precision',
      'count',
      'size',
      'resolution',
      'angle',
      'duration',
    ];
    for (const field of numericFields) {
      if (sanitized[field] !== undefined) {
        const value = sanitized[field];
        if (typeof value === 'number') {
          // Check for reasonable bounds
          if (!Number.isFinite(value) || value < 0 || value > 10000) {
            errors.push(
              `Numeric parameter '${field}' is out of acceptable range.`
            );
          }
        } else if (typeof value === 'string') {
          const parsed = parseFloat(value);
          if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10000) {
            errors.push(`Numeric parameter '${field}' is not a valid number.`);
          } else {
            sanitized[field] = parsed;
          }
        }
      }
    }

    return { sanitized, errors, warnings };
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousActivity(
    context: SecurityContext,
    parameters: Record<string, unknown>
  ): {
    isSuspicious: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
  } {
    const { operation, clientId = 'default' } = context;
    const reasons: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for rapid successive requests
    const recentRequests = securityAuditor.getClientEventCount(clientId, 60000); // Last minute
    if (recentRequests > 100) {
      reasons.push('Excessive request rate');
      maxSeverity = 'high';
    } else if (recentRequests > 50) {
      reasons.push('High request rate');
      maxSeverity = 'medium';
    }

    // Check for suspicious parameter patterns
    const paramString = JSON.stringify(parameters);
    const analysis = securityAuditor.analyzeInput(
      paramString,
      operation,
      clientId
    );

    if (analysis.isSuspicious) {
      reasons.push(...analysis.suspiciousPatterns);
      if (analysis.riskScore > 30) {
        maxSeverity = 'critical';
      } else if (analysis.riskScore > 15) {
        maxSeverity = maxSeverity === 'high' ? 'high' : 'medium';
      } else {
        maxSeverity =
          maxSeverity === 'high' || maxSeverity === 'medium'
            ? maxSeverity
            : 'low';
      }
    }

    // Check for unusual operation patterns
    const expensiveOps = [
      'create_palette_png',
      'create_gradient_png',
      'extract_palette_from_image',
    ];
    if (expensiveOps.includes(operation)) {
      const expensiveRequests = securityAuditor.getClientEventCount(
        clientId,
        300000
      ); // Last 5 minutes
      if (expensiveRequests > 10) {
        reasons.push('Excessive expensive operations');
        maxSeverity = maxSeverity === 'critical' ? 'critical' : 'high';
      }
    }

    // Check for parameter size abuse
    const paramSize = JSON.stringify(parameters).length;
    if (paramSize > 100000) {
      // 100KB
      reasons.push('Excessive parameter size');
      maxSeverity = maxSeverity === 'critical' ? 'critical' : 'medium';
    }

    // Check client risk score and event history
    const clientRiskScore = securityAuditor.getClientRiskScore(clientId);
    const totalClientEvents = securityAuditor.getClientEventCount(
      clientId,
      24 * 60 * 60 * 1000
    ); // Last 24 hours

    if (clientRiskScore >= 80 || totalClientEvents > 100) {
      reasons.push('High-risk client with extensive security event history');
      maxSeverity = 'critical';
    } else if (clientRiskScore >= 50 || totalClientEvents > 50) {
      reasons.push('Medium-risk client with security concerns');
      maxSeverity = maxSeverity === 'critical' ? 'critical' : 'high';
    }

    const isSuspicious = reasons.length > 0;

    if (isSuspicious) {
      securityAuditor.logSecurityEvent({
        type: 'suspicious_activity',
        severity: maxSeverity,
        operation,
        clientId,
        details: {
          reasons,
          recentRequests,
          parameterSize: paramSize,
          riskScore: analysis.riskScore,
        },
      });
    }

    return {
      isSuspicious,
      severity: maxSeverity,
      reasons,
    };
  }

  /**
   * Final parameter validation
   */
  private async validateFinalParameters(
    operation: string,
    parameters: Record<string, unknown>
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Operation-specific validation
    switch (operation) {
      case 'extract_palette_from_image':
        if (
          !parameters['image_url'] ||
          typeof parameters['image_url'] !== 'string'
        ) {
          errors.push('image_url is required and must be a string');
        } else if (parameters['image_url'] === 'about:blank') {
          errors.push('Invalid or blocked image URL');
        }
        break;

      case 'create_palette_png':
      case 'create_gradient_png':
        // Check for reasonable image dimensions
        if (
          parameters['dimensions'] &&
          Array.isArray(parameters['dimensions'])
        ) {
          const dimensions = parameters['dimensions'] as number[];
          const [width, height] = dimensions;
          if (width && height) {
            if (width > 10000 || height > 10000) {
              errors.push('Image dimensions too large (max 10000x10000)');
            }
            if (width * height > 50000000) {
              // 50 megapixels
              errors.push('Image area too large (max 50 megapixels)');
            }
          }
        }
        break;

      case 'generate_harmony_palette':
      case 'generate_contextual_palette':
        // Limit palette size
        if (
          parameters['count'] &&
          typeof parameters['count'] === 'number' &&
          parameters['count'] > 50
        ) {
          errors.push('Palette size too large (max 50 colors)');
        }
        break;
    }

    // Check for required parameters based on operation
    const requiredParams = this.getRequiredParameters(operation);
    for (const param of requiredParams) {
      if (parameters[param] === undefined || parameters[param] === null) {
        errors.push(`Required parameter '${param}' is missing`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get required parameters for each operation
   */
  private getRequiredParameters(operation: string): string[] {
    const requiredParams: Record<string, string[]> = {
      convert_color: ['color', 'output_format'],
      analyze_color: ['color'],
      generate_harmony_palette: ['base_color', 'harmony_type'],
      generate_contextual_palette: ['context'],
      generate_algorithmic_palette: ['algorithm'],
      extract_palette_from_image: ['image_url'],
      create_palette_html: ['palette'],
      create_palette_png: ['palette'],
      create_color_wheel_html: [],
      create_gradient_html: ['gradient_css'],
      create_gradient_png: ['gradient', 'dimensions'],
      check_contrast: ['foreground', 'background'],
      simulate_colorblindness: ['colors', 'type'],
      optimize_for_accessibility: ['palette', 'use_cases'],
      mix_colors: ['colors'],
      generate_color_variations: ['base_color', 'variation_type'],
      sort_colors: ['colors', 'sort_by'],
      analyze_color_collection: ['colors'],
    };

    return requiredParams[operation] || [];
  }

  /**
   * Get security headers for HTTP responses
   */
  public getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();

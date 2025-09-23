/**
 * Tests for security auditing
 */

import { securityAuditor } from '../../src/security/security-audit';
import { rateLimiter } from '../../src/security/rate-limiter';
import { performanceMonitor } from '../../src/utils/performance-monitor';
import { resourceManager } from '../../src/utils/resource-manager';
import { cacheManager } from '../../src/utils/cache-manager';

describe('SecurityAuditor', () => {
  beforeEach(() => {
    // Reset security auditor state
    securityAuditor.reset();
  });

  afterAll(() => {
    // Clean up intervals and timers
    securityAuditor.destroy();
    rateLimiter.destroy();
    performanceMonitor.destroy();
    resourceManager.destroy();
    cacheManager.destroy();
  });

  describe('logSecurityEvent', () => {
    it('should log security events', () => {
      securityAuditor.logSecurityEvent({
        type: 'input_validation',
        severity: 'medium',
        operation: 'convert_color',
        clientId: 'test-client',
        details: { issue: 'invalid_format' },
      });

      const metrics = securityAuditor.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsByType['input_validation']).toBe(1);
      expect(metrics.eventsBySeverity['medium']).toBe(1);
    });

    it('should update client risk scores', () => {
      securityAuditor.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        operation: 'convert_color',
        clientId: 'risky-client',
        details: { pattern: 'script_injection' },
      });

      const metrics = securityAuditor.getMetrics();
      expect(metrics.suspiciousClients).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            clientId: 'risky-client',
            riskScore: expect.any(Number),
          }),
        ])
      );
    });

    it('should track multiple events for same client', () => {
      const clientId = 'repeat-offender';

      // Log multiple events
      for (let i = 0; i < 5; i++) {
        securityAuditor.logSecurityEvent({
          type: 'rate_limit',
          severity: 'medium',
          operation: 'convert_color',
          clientId,
          details: { attempt: i + 1 },
        });
      }

      const eventCount = securityAuditor.getClientEventCount(clientId, 60000);
      expect(eventCount).toBe(5);
    });
  });

  describe('analyzeInput', () => {
    it('should detect script injection attempts', () => {
      const suspiciousInput = '<script>alert("xss")</script>';
      const result = securityAuditor.analyzeInput(
        suspiciousInput,
        'convert_color',
        'test-client'
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.suspiciousPatterns).toContain('script');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect javascript injection', () => {
      const suspiciousInput = 'javascript:alert(1)';
      const result = securityAuditor.analyzeInput(
        suspiciousInput,
        'convert_color',
        'test-client'
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.suspiciousPatterns).toContain('javascript');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect excessive length', () => {
      const longInput = 'a'.repeat(15000);
      const result = securityAuditor.analyzeInput(
        longInput,
        'convert_color',
        'test-client'
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.suspiciousPatterns).toContain('excessive_length');
    });

    it('should detect unusual characters', () => {
      const unusualInput = 'color' + '\x00'.repeat(20); // Null bytes
      const result = securityAuditor.analyzeInput(
        unusualInput,
        'convert_color',
        'test-client'
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.suspiciousPatterns).toContain('unusual_characters');
    });

    it('should detect repeated patterns', () => {
      const repeatedInput = 'abcabc'.repeat(10);
      const result = securityAuditor.analyzeInput(
        repeatedInput,
        'convert_color',
        'test-client'
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.suspiciousPatterns).toContain('repeated_patterns');
    });

    it('should not flag normal input as suspicious', () => {
      const normalInput = '#FF0000';
      const result = securityAuditor.analyzeInput(
        normalInput,
        'convert_color',
        'test-client'
      );

      expect(result.isSuspicious).toBe(false);
      expect(result.suspiciousPatterns).toHaveLength(0);
      expect(result.riskScore).toBe(0);
    });
  });

  describe('getClientEventCount', () => {
    it('should count events within time window', () => {
      const clientId = 'test-client';

      // Log 3 events
      for (let i = 0; i < 3; i++) {
        securityAuditor.logSecurityEvent({
          type: 'input_validation',
          severity: 'low',
          operation: 'convert_color',
          clientId,
          details: { event: i },
        });
      }

      const count = securityAuditor.getClientEventCount(clientId, 60000); // Last minute
      expect(count).toBe(3);
    });

    it('should not count events outside time window', async () => {
      const clientId = 'test-client';

      securityAuditor.logSecurityEvent({
        type: 'input_validation',
        severity: 'low',
        operation: 'convert_color',
        clientId,
        details: { event: 'old' },
      });

      // Wait a small amount to ensure the event is outside the time window
      await new Promise(resolve => setTimeout(resolve, 5));

      // Count events in a very small time window (should be 0)
      const count = securityAuditor.getClientEventCount(clientId, 1); // 1ms window
      expect(count).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('should return comprehensive metrics', () => {
      // Log various events
      securityAuditor.logSecurityEvent({
        type: 'input_validation',
        severity: 'low',
        operation: 'convert_color',
        clientId: 'client1',
        details: {},
      });

      securityAuditor.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        operation: 'analyze_color',
        clientId: 'client2',
        details: {},
      });

      securityAuditor.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        operation: 'convert_color',
        clientId: 'client1',
        details: {},
      });

      const metrics = securityAuditor.getMetrics();

      expect(metrics.totalEvents).toBe(3);
      expect(metrics.eventsByType).toEqual({
        input_validation: 1,
        rate_limit: 1,
        suspicious_activity: 1,
      });
      expect(metrics.eventsBySeverity).toEqual({
        low: 1,
        medium: 1,
        high: 1,
      });
      expect(metrics.recentEvents).toHaveLength(3);
    });

    it('should identify suspicious clients', () => {
      const suspiciousClient = 'bad-actor';

      // Log multiple high-severity events
      for (let i = 0; i < 3; i++) {
        securityAuditor.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          operation: 'convert_color',
          clientId: suspiciousClient,
          details: { attempt: i },
        });
      }

      const metrics = securityAuditor.getMetrics();
      const suspiciousClients = metrics.suspiciousClients;

      expect(suspiciousClients).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            clientId: suspiciousClient,
            eventCount: 3,
            riskScore: expect.any(Number),
          }),
        ])
      );

      // Risk score should be high due to multiple high-severity events
      const client = suspiciousClients.find(
        c => c.clientId === suspiciousClient
      );
      expect(client?.riskScore).toBeGreaterThan(50);
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate comprehensive security report', () => {
      // Log some events
      securityAuditor.logSecurityEvent({
        type: 'input_validation',
        severity: 'medium',
        operation: 'convert_color',
        clientId: 'client1',
        details: {},
      });

      securityAuditor.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        operation: 'analyze_color',
        clientId: 'client2',
        details: {},
      });

      const report = securityAuditor.generateSecurityReport();

      expect(report.summary).toContain('Security Report');
      expect(report.summary).toContain('2 events');
      expect(report.criticalIssues).toHaveLength(1);
      expect(report.criticalIssues[0]?.severity).toBe('critical');
      expect(report.recommendations).toEqual(expect.any(Array));
      expect(report.trends).toEqual(expect.any(Object));
    });

    it('should provide relevant recommendations', () => {
      // Log critical events
      securityAuditor.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        operation: 'convert_color',
        clientId: 'attacker',
        details: {},
      });

      const report = securityAuditor.generateSecurityReport();

      expect(report.recommendations).toContain(
        'Investigate critical security events immediately'
      );
    });

    it('should track trends', () => {
      // Log an event
      securityAuditor.logSecurityEvent({
        type: 'input_validation',
        severity: 'low',
        operation: 'convert_color',
        clientId: 'client1',
        details: {},
      });

      const report = securityAuditor.generateSecurityReport();

      expect(report.trends).toHaveProperty('totalEvents');
      expect(report.trends).toHaveProperty('criticalEvents');
      expect(report.trends).toHaveProperty('suspiciousClients');
    });
  });

  describe('reset', () => {
    it('should clear all security data', () => {
      // Log some events
      securityAuditor.logSecurityEvent({
        type: 'input_validation',
        severity: 'low',
        operation: 'convert_color',
        clientId: 'client1',
        details: {},
      });

      securityAuditor.reset();

      const metrics = securityAuditor.getMetrics();
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.suspiciousClients).toHaveLength(0);
    });
  });
});

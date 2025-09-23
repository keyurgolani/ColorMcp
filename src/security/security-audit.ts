/**
 * Security audit logging and monitoring
 */

import { logger } from '../utils/logger';

export interface SecurityEvent {
  type:
    | 'input_validation'
    | 'rate_limit'
    | 'resource_abuse'
    | 'suspicious_activity'
    | 'access_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
  operation?: string;
  clientId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  recentEvents: SecurityEvent[];
  suspiciousClients: Array<{
    clientId: string;
    eventCount: number;
    lastEvent: Date;
    riskScore: number;
  }>;
}

export class SecurityAuditor {
  private static instance: SecurityAuditor;
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events
  private clientRiskScores: Map<string, number> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private suspiciousPatterns: RegExp[] = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /eval\(/i,
    /expression\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  private constructor() {
    // Only start periodic cleanup in non-test environments
    const isTestEnvironment =
      process.env['NODE_ENV'] === 'test' ||
      process.env['JEST_WORKER_ID'] !== undefined ||
      process.env['CI'] === 'true' ||
      typeof jest !== 'undefined' ||
      (typeof global !== 'undefined' && 'jest' in global);

    if (!isTestEnvironment) {
      this.cleanupInterval = setInterval(
        () => {
          this.cleanupOldEvents();
        },
        60 * 60 * 1000
      ); // Every hour
    }
  }

  public static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor();
    }
    return SecurityAuditor.instance;
  }

  public logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Update client risk score
    if (event.clientId) {
      this.updateClientRiskScore(event.clientId, event.severity, event.type);
    }

    // Log based on severity
    const logMessage = `Security event: ${event.type}`;
    const logContext: Record<string, unknown> = {
      severity: event.severity,
      details: event.details,
    };

    if (event.operation) {
      logContext['tool'] = event.operation;
    }
    if (event.clientId) {
      logContext['clientId'] = event.clientId;
    }

    switch (event.severity) {
      case 'critical':
        logger.error(logMessage, logContext);
        break;
      case 'high':
        logger.warn(logMessage, logContext);
        break;
      case 'medium':
        logger.info(logMessage, logContext);
        break;
      case 'low':
        logger.debug(logMessage, logContext);
        break;
    }

    // Trim events if we have too many
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Check for immediate threats
    this.checkForImmediateThreats(fullEvent);
  }

  private updateClientRiskScore(
    clientId: string,
    severity: string,
    eventType: string
  ): void {
    const currentScore = this.clientRiskScores.get(clientId) || 0;
    let scoreIncrease = 0;

    // Score increases based on severity
    switch (severity) {
      case 'critical':
        scoreIncrease = 50;
        break;
      case 'high':
        scoreIncrease = 20;
        break;
      case 'medium':
        scoreIncrease = 5;
        break;
      case 'low':
        scoreIncrease = 1;
        break;
    }

    // Additional score for certain event types
    if (eventType === 'suspicious_activity') {
      scoreIncrease *= 2;
    }

    const newScore = Math.min(100, currentScore + scoreIncrease);
    this.clientRiskScores.set(clientId, newScore);

    // Log high-risk clients
    if (newScore >= 80) {
      logger.warn(`High-risk client detected: ${clientId}`, {
        riskScore: newScore,
        eventType,
        severity,
      });
    }
  }

  private checkForImmediateThreats(event: SecurityEvent): void {
    // Prevent infinite recursion by not checking threats for threat events
    if (event.type === 'suspicious_activity' && event.details['threat']) {
      return;
    }

    // Check for patterns that indicate immediate threats
    const threatPatterns = [
      {
        condition:
          event.type === 'input_validation' && event.severity === 'critical',
        action: 'Block client temporarily',
      },
      {
        condition: event.type === 'resource_abuse' && event.severity === 'high',
        action: 'Implement aggressive rate limiting',
      },
      {
        condition: this.getClientEventCount(event.clientId || '', 60000) > 100, // 100 events in 1 minute
        action: 'Potential DoS attack detected',
      },
    ];

    for (const pattern of threatPatterns) {
      if (pattern.condition) {
        const logContext: Record<string, unknown> = {
          eventType: event.type,
          severity: event.severity,
        };
        if (event.clientId) {
          logContext['clientId'] = event.clientId;
        }
        logger.error(
          `Immediate threat detected: ${pattern.action}`,
          logContext
        );

        // Create threat event directly without triggering recursive check
        const threatEvent: SecurityEvent = {
          type: 'suspicious_activity',
          severity: 'critical',
          operation: event.operation || 'unknown',
          clientId: event.clientId || 'unknown',
          timestamp: new Date(),
          details: {
            threat: pattern.action,
            triggeringEvent: event,
          },
        };

        // Add to events without calling logSecurityEvent to prevent recursion
        this.events.push(threatEvent);

        // Update client risk score directly without triggering more events
        if (threatEvent.clientId) {
          const currentScore =
            this.clientRiskScores.get(threatEvent.clientId) || 0;
          const newScore = Math.min(100, currentScore + 50); // Critical = +50
          this.clientRiskScores.set(threatEvent.clientId, newScore);
        }
      }
    }
  }

  public analyzeInput(
    input: string,
    operation: string,
    clientId?: string
  ): {
    isSuspicious: boolean;
    suspiciousPatterns: string[];
    riskScore: number;
  } {
    const suspiciousPatterns: string[] = [];
    let riskScore = 0;

    // Check against known suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(input)) {
        suspiciousPatterns.push(pattern.source);
        riskScore += 10;
      }
    }

    // Check for excessive length
    if (input.length > 10000) {
      suspiciousPatterns.push('excessive_length');
      riskScore += 5;
    }

    // Check for unusual characters
    const unusualChars = /[^\x20-\x7E\s]/g;
    const unusualMatches = input.match(unusualChars);
    if (unusualMatches && unusualMatches.length > 10) {
      suspiciousPatterns.push('unusual_characters');
      riskScore += 5;
    }

    // Check for repeated patterns (potential injection)
    const repeatedPattern = /(.{3,})\1{3,}/g;
    if (repeatedPattern.test(input)) {
      suspiciousPatterns.push('repeated_patterns');
      riskScore += 5;
    }

    const isSuspicious = suspiciousPatterns.length > 0 || riskScore > 15;

    if (isSuspicious) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: riskScore > 30 ? 'high' : riskScore > 15 ? 'medium' : 'low',
        operation,
        clientId: clientId || 'unknown',
        details: {
          suspiciousPatterns,
          riskScore,
          inputLength: input.length,
          inputPreview: input.substring(0, 100), // First 100 chars for analysis
        },
      });
    }

    return {
      isSuspicious,
      suspiciousPatterns,
      riskScore,
    };
  }

  public getClientEventCount(clientId: string, timeWindowMs: number): number {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.events.filter(
      event => event.clientId === clientId && event.timestamp >= cutoff
    ).length;
  }

  public getClientRiskScore(clientId: string): number {
    return this.clientRiskScores.get(clientId) || 0;
  }

  public getMetrics(): SecurityMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter recent events
    const recentEvents = this.events.filter(
      event => event.timestamp >= last24Hours
    );

    // Count by type
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] =
        (eventsBySeverity[event.severity] || 0) + 1;
    }

    // Get suspicious clients
    const clientEventCounts: Record<
      string,
      { count: number; lastEvent: Date }
    > = {};
    for (const event of recentEvents) {
      if (event.clientId) {
        if (!clientEventCounts[event.clientId]) {
          clientEventCounts[event.clientId] = {
            count: 0,
            lastEvent: event.timestamp,
          };
        }
        const clientData = clientEventCounts[event.clientId];
        if (clientData) {
          clientData.count++;
          if (event.timestamp > clientData.lastEvent) {
            clientData.lastEvent = event.timestamp;
          }
        }
      }
    }

    const suspiciousClients = Object.entries(clientEventCounts)
      .map(([clientId, data]) => ({
        clientId,
        eventCount: data.count,
        lastEvent: data.lastEvent,
        riskScore: this.clientRiskScores.get(clientId) || 0,
      }))
      .filter(client => client.riskScore > 20 || client.eventCount > 50)
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: recentEvents.slice(-100), // Last 100 events
      suspiciousClients,
    };
  }

  public generateSecurityReport(): {
    summary: string;
    recommendations: string[];
    criticalIssues: SecurityEvent[];
    trends: Record<string, number>;
  } {
    const metrics = this.getMetrics();
    const criticalIssues = this.events
      .filter(event => event.severity === 'critical')
      .slice(-10);

    // Calculate trends (compare last 24h vs previous 24h)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const recent = this.events.filter(e => e.timestamp >= last24h).length;
    const previous = this.events.filter(
      e => e.timestamp >= previous24h && e.timestamp < last24h
    ).length;

    const trends = {
      totalEvents: recent - previous,
      criticalEvents: criticalIssues.length,
      suspiciousClients: metrics.suspiciousClients.length,
    };

    // Generate recommendations
    const recommendations: string[] = [];

    if ((metrics.eventsBySeverity['critical'] || 0) > 0) {
      recommendations.push('Investigate critical security events immediately');
    }

    if (metrics.suspiciousClients.length > 5) {
      recommendations.push('Consider implementing stricter rate limiting');
    }

    if ((metrics.eventsByType['input_validation'] || 0) > 100) {
      recommendations.push(
        'Review input validation rules - high validation failure rate'
      );
    }

    if (trends.totalEvents > 50) {
      recommendations.push(
        'Security event volume increasing - monitor closely'
      );
    }

    const summary = `Security Report: ${metrics.totalEvents} events in last 24h, ${criticalIssues.length} critical issues, ${metrics.suspiciousClients.length} suspicious clients`;

    return {
      summary,
      recommendations,
      criticalIssues,
      trends,
    };
  }

  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const originalLength = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoff);

    const removed = originalLength - this.events.length;
    if (removed > 0) {
      logger.debug(`Cleaned up ${removed} old security events`);
    }

    // Also cleanup old client risk scores
    const activeClients = new Set(
      this.events.filter(e => e.clientId).map(e => e.clientId!)
    );

    for (const [clientId] of this.clientRiskScores.entries()) {
      if (!activeClients.has(clientId)) {
        this.clientRiskScores.delete(clientId);
      }
    }
  }

  public reset(): void {
    this.events = [];
    this.clientRiskScores.clear();
    logger.info('Security audit data reset');
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.events = [];
    this.clientRiskScores.clear();
    // @ts-ignore - We need to reset the instance for testing
    SecurityAuditor.instance = undefined;
  }
}

// Export singleton instance
export const securityAuditor = SecurityAuditor.getInstance();

# MCP Color Server - Security Guide

## Overview

The MCP Color Server implements comprehensive security measures to protect against various attack vectors while maintaining high performance and usability. This guide covers the security architecture, implemented protections, and best practices for deployment.

## Security Architecture

### Multi-Layer Security Approach

1. **Input Validation & Sanitization**
   - Comprehensive input validation using Joi schemas
   - HTML/JavaScript sanitization to prevent XSS attacks
   - URL validation to prevent malicious redirects
   - File content validation for image processing

2. **Rate Limiting**
   - Operation-specific rate limits
   - Client-based tracking
   - Automatic window reset
   - Graceful degradation under load

3. **Resource Protection**
   - Memory usage monitoring
   - Concurrent request limiting
   - Automatic resource cleanup
   - Graceful degradation strategies

4. **Security Auditing**
   - Comprehensive event logging
   - Suspicious activity detection
   - Client risk scoring
   - Security metrics and reporting

5. **Access Control**
   - Parameter validation
   - Operation-specific restrictions
   - Resource-based access control

## Implemented Security Features

### Input Sanitization

#### HTML Content Protection

```typescript
// XSS Prevention
const result = inputSanitizer.sanitizeHtml(userInput, {
  allowHtml: false, // Escape all HTML by default
  stripScripts: true, // Remove script tags
  stripEvents: true, // Remove event handlers
  maxLength: 10000, // Prevent DoS via large inputs
});
```

**Protected Against:**

- Script injection (`<script>`, `javascript:`)
- Event handler injection (`onclick`, `onload`)
- Data URL exploitation
- HTML entity injection
- Excessive input length

#### URL Validation

```typescript
// Malicious URL Prevention
const result = inputSanitizer.sanitizeUrl(url);
// Blocks: javascript:, data:, file:, localhost, etc.
```

**Protected Against:**

- JavaScript protocol URLs
- Data URLs with executable content
- File system access attempts
- Local network probing
- Invalid URL formats

#### Color Input Validation

```typescript
// Color-specific sanitization
const result = inputSanitizer.sanitizeColorInput(color);
// Only allows safe color characters: [a-zA-Z0-9#(),%.\s-]
```

**Protected Against:**

- Script injection in color values
- HTML tags in color strings
- Excessive color string length
- Invalid characters

### Rate Limiting

#### Operation-Specific Limits

```typescript
const rateLimits = {
  // High-frequency operations
  convert_color: { windowMs: 60000, maxRequests: 1000 },
  analyze_color: { windowMs: 60000, maxRequests: 500 },

  // Moderate-frequency operations
  generate_harmony_palette: { windowMs: 60000, maxRequests: 100 },
  create_palette_html: { windowMs: 60000, maxRequests: 100 },

  // Resource-intensive operations
  create_palette_png: { windowMs: 60000, maxRequests: 20 },
  extract_palette_from_image: { windowMs: 60000, maxRequests: 10 },
};
```

#### Features:

- Per-client tracking
- Sliding window implementation
- Automatic cleanup of expired entries
- Configurable limits per operation
- Graceful error responses with retry-after headers

### Resource Protection

#### Memory Management

- Maximum memory usage per request: 100MB
- Total server memory limit: 1GB
- Automatic garbage collection hints
- Memory pressure detection

#### Concurrent Request Handling

- Maximum concurrent requests: 50
- Request queuing under load
- Automatic request rejection under extreme load
- Resource usage monitoring

#### Graceful Degradation

```typescript
const degradationLevels = {
  light: ['throttle_requests', 'cleanup_expired_cache'],
  moderate: ['queue_requests', 'reduce_cache_sizes'],
  aggressive: ['reject_new_requests', 'clear_all_caches'],
};
```

### Security Auditing

#### Event Types

- `input_validation`: Invalid or sanitized inputs
- `rate_limit`: Rate limit violations
- `resource_abuse`: Resource exhaustion attempts
- `suspicious_activity`: Potential attack patterns
- `access_denied`: Blocked operations

#### Risk Scoring

```typescript
const riskScores = {
  critical: 50, // Immediate threat
  high: 20, // Serious concern
  medium: 5, // Moderate risk
  low: 1, // Minor issue
};
```

#### Suspicious Pattern Detection

- Script injection attempts
- JavaScript protocol usage
- Excessive request rates
- Unusual character patterns
- Repeated attack patterns

## Security Configuration

### Environment Variables

```bash
# Security settings
NODE_ENV=production              # Hides detailed error messages
SECURITY_LOG_LEVEL=info         # Security event logging level
RATE_LIMIT_ENABLED=true         # Enable rate limiting
MAX_MEMORY_USAGE=1073741824     # 1GB memory limit
MAX_CONCURRENT_REQUESTS=50      # Concurrent request limit
```

### Rate Limit Customization

```typescript
// Update rate limits for specific operations
rateLimiter.updateLimits('convert_color', {
  windowMs: 30000, // 30 second window
  maxRequests: 500, // 500 requests per window
});
```

### Security Headers

```typescript
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

## Monitoring and Alerting

### Security Metrics

```typescript
const metrics = securityAuditor.getMetrics();
// Returns:
// - totalEvents: number
// - eventsByType: Record<string, number>
// - eventsBySeverity: Record<string, number>
// - suspiciousClients: Array<ClientRisk>
```

### Security Reports

```typescript
const report = securityAuditor.generateSecurityReport();
// Returns:
// - summary: string
// - recommendations: string[]
// - criticalIssues: SecurityEvent[]
// - trends: Record<string, number>
```

### Real-time Monitoring

- Performance metrics collection
- Resource usage tracking
- Security event aggregation
- Automatic alerting for critical events

## Deployment Security

### Production Checklist

#### Server Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Configure appropriate rate limits
- [ ] Set memory and resource limits
- [ ] Enable security logging
- [ ] Configure monitoring and alerting

#### Network Security

- [ ] Use HTTPS for all communications
- [ ] Implement proper firewall rules
- [ ] Restrict access to management endpoints
- [ ] Use secure MCP transport protocols

#### Monitoring Setup

- [ ] Configure log aggregation
- [ ] Set up security event monitoring
- [ ] Implement automated alerting
- [ ] Regular security report reviews

### Docker Security

```dockerfile
# Use non-root user
USER node

# Set security limits
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Health checks
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
```

### Kubernetes Security

```yaml
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
    - name: mcp-color-server
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      resources:
        limits:
          memory: '1Gi'
          cpu: '1000m'
        requests:
          memory: '512Mi'
          cpu: '500m'
```

## Incident Response

### Security Event Response

#### Critical Events

1. **Immediate Actions**
   - Block suspicious clients
   - Increase monitoring
   - Review security logs
   - Assess impact

2. **Investigation**
   - Analyze attack patterns
   - Check for data exposure
   - Review system integrity
   - Document findings

3. **Recovery**
   - Apply security patches
   - Update security rules
   - Restore normal operations
   - Post-incident review

#### Event Classification

- **Critical**: Active exploitation attempts
- **High**: Suspicious patterns detected
- **Medium**: Rate limit violations
- **Low**: Input validation failures

### Automated Response

```typescript
// Automatic client blocking for critical events
if (event.severity === 'critical') {
  rateLimiter.updateLimits(event.operation, {
    maxRequests: 0, // Block all requests
    windowMs: 3600000, // For 1 hour
  });
}
```

## Security Testing

### Automated Security Tests

- Input sanitization validation
- Rate limiting verification
- Resource exhaustion testing
- Attack pattern detection
- Performance under attack

### Penetration Testing

- XSS injection attempts
- CSRF attack simulation
- DoS attack testing
- Input validation bypass attempts
- Resource exhaustion attacks

### Security Audit Commands

```bash
# Run security tests
npm run test:security

# Generate security report
npm run security:report

# Check for vulnerabilities
npm audit

# Update dependencies
npm audit fix
```

## Best Practices

### Development

1. **Input Validation**
   - Validate all inputs at entry points
   - Use whitelist validation when possible
   - Sanitize outputs for display
   - Implement proper error handling

2. **Rate Limiting**
   - Set appropriate limits per operation
   - Monitor rate limit effectiveness
   - Adjust limits based on usage patterns
   - Provide clear error messages

3. **Resource Management**
   - Monitor memory usage
   - Implement proper cleanup
   - Use streaming for large operations
   - Set reasonable timeouts

4. **Security Logging**
   - Log all security events
   - Include relevant context
   - Avoid logging sensitive data
   - Implement log rotation

### Operations

1. **Monitoring**
   - Set up real-time alerting
   - Regular security report reviews
   - Performance monitoring
   - Resource usage tracking

2. **Maintenance**
   - Regular security updates
   - Dependency vulnerability scanning
   - Security configuration reviews
   - Incident response testing

3. **Documentation**
   - Keep security documentation current
   - Document security procedures
   - Maintain incident response plans
   - Regular security training

## Compliance

### Data Protection

- No persistent storage of user data
- Minimal logging of sensitive information
- Automatic cleanup of temporary data
- Secure handling of image processing

### Industry Standards

- OWASP Top 10 protection
- Secure coding practices
- Regular security assessments
- Vulnerability management

### Audit Trail

- Comprehensive security logging
- Event correlation and analysis
- Retention policies for security data
- Regular audit report generation

## Support and Updates

### Security Updates

- Regular dependency updates
- Security patch management
- Vulnerability disclosure process
- Emergency response procedures

### Community

- Security issue reporting
- Responsible disclosure policy
- Security advisory notifications
- Community security contributions

For security issues or questions, please contact the security team or file a security advisory through the appropriate channels.

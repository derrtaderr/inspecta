# InspectorAI Security Documentation

This document provides comprehensive details about the security features and best practices implemented in the InspectorAI system.

## Table of Contents

- [Overview](#overview)
- [Authentication & Authorization](#authentication--authorization)
- [API Security](#api-security)
- [Data Protection](#data-protection)
- [Network Security](#network-security)
- [Security Headers](#security-headers)
- [Rate Limiting](#rate-limiting)
- [Browser Security](#browser-security)
- [Monitoring & Auditing](#monitoring--auditing)
- [Security Configuration](#security-configuration)
- [Best Practices](#best-practices)

## Overview

InspectorAI implements a robust security architecture designed to protect against common web application vulnerabilities and threats. The security features are implemented in multiple layers, providing defense in depth for the application.

Core security principles followed:

- **Least Privilege**: Each component has only the permissions it needs
- **Defense in Depth**: Multiple security controls at different layers
- **Secure by Default**: Security features are enabled by default
- **Fail Secure**: When errors occur, systems default to secure state
- **Input Validation**: All user inputs are validated and sanitized

## Authentication & Authorization

### Authentication Methods

InspectorAI supports two authentication methods:

1. **JWT Token Authentication**
   - Used for interactive sessions
   - Configurable token expiration
   - Refresh token mechanism for longer sessions
   - Tokens contain user role and permission information

2. **API Key Authentication**
   - Used for programmatic access
   - Keys can be created with specific permissions
   - Configurable expiration dates
   - Revocable at any time

### User Management

- User accounts with role-based permissions
- Default roles: admin, user, api
- Fine-grained permission system
- Admin interface for user and API key management

### Authentication Workflow

1. User logs in with username/password
2. System validates credentials
3. System issues JWT access token and refresh token
4. User includes token in Authorization header
5. System validates token for each request

## API Security

### Input Validation

All API endpoints implement strict input validation using Zod schemas:

- Type checking for all parameters
- Boundary validation for numeric values
- Pattern validation for strings
- Schema validation for complex objects

### CSRF Protection

- CSRF tokens required for state-changing operations
- SameSite cookie settings to prevent CSRF attacks
- Origin checking for cross-origin requests

### Secure Defaults

- All API endpoints are protected by default
- Authentication can be enabled/disabled via configuration
- Health check endpoints exempt from authentication
- Rate limiting applied to all endpoints

## Data Protection

### Sensitive Data Handling

- Passwords are never stored in plaintext
- API keys are treated as sensitive information
- Personally identifiable information (PII) is minimized

### Secure Storage

- Refresh tokens stored securely
- API keys stored with limited visibility
- User credentials encrypted at rest

### Data Minimization

- Only necessary data is collected and stored
- Data retention policies limit how long data is kept
- Cached data expires after configured TTL

## Network Security

### TLS/SSL

- HTTPS recommended for all deployments
- HTTP Strict Transport Security (HSTS) enabled
- Modern TLS protocols (TLS 1.2+) enforced
- Secure cipher suites configured

### CORS Configuration

- Configurable Cross-Origin Resource Sharing
- Default restrictive CORS policy
- Origin validation for all requests
- Support for credentials when needed

## Security Headers

InspectorAI implements security headers using Helmet:

### Content Security Policy (CSP)

- Restricts sources of executable scripts
- Prevents XSS attacks
- Configurable policy based on application needs
- Violation reporting endpoint available

### Other Security Headers

- X-Content-Type-Options: Prevents MIME sniffing
- X-Frame-Options: Prevents clickjacking
- Referrer-Policy: Controls referrer information
- Permissions-Policy: Restricts browser features
- X-XSS-Protection: Additional XSS safeguards

## Rate Limiting

InspectorAI implements rate limiting to prevent abuse:

- Global rate limits for all API endpoints
- Stricter limits for authentication endpoints
- Configurable window sizes and request limits
- IP-based rate limiting by default
- Customizable per-endpoint limits

## Browser Security

As InspectorAI uses browser automation, special attention is paid to browser security:

- Sandbox mode for browser instances
- Content isolation between browser sessions
- Restricted file system access
- Memory limits to prevent DoS attacks
- Automatic cleanup of browser resources

## Monitoring & Auditing

### Security Logging

- Authentication events logged
- Access attempts recorded
- Rate limit violations logged
- Security header violations tracked

### Audit Trail

- User actions recorded for accountability
- API key usage tracked
- Administrative actions logged
- Timestamps and originating IP addresses included

### Security Monitoring Endpoint

- `/api/stats/security` provides security status
- Visibility into security feature configuration
- Real-time security metrics

## Security Configuration

Security features can be configured via environment variables or configuration file:

### Authentication Configuration

```
AUTH_ENABLED=true
JWT_SECRET=your-strong-secret-key
TOKEN_EXPIRATION=24h
API_KEY_HEADER=x-api-key
```

### Rate Limiting Configuration

```
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Helmet Configuration

```
HELMET_ENABLED=true
CSP_ENABLED=true
```

### CORS Configuration

```
CORS_ALLOW_ORIGINS=https://example.com,https://admin.example.com
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE
CORS_ALLOW_HEADERS=Content-Type,Authorization,x-api-key
CORS_ALLOW_CREDENTIALS=false
CORS_MAX_AGE=86400
```

## Best Practices

### Development Practices

- Use security linters in development
- Perform regular dependency audits
- Follow secure coding guidelines
- Conduct code reviews with security focus

### Deployment Practices

- Use environment-specific security settings
- Generate unique secrets for each environment
- Apply least privilege to service accounts
- Keep software dependencies updated

### Operational Practices

- Monitor security logs regularly
- Conduct periodic security reviews
- Have an incident response plan
- Follow a responsible disclosure policy

### User Guidance

- Enforce strong password policies
- Implement multi-factor authentication when available
- Rotate API keys periodically
- Revoke unused or suspicious API keys

## Security Vulnerability Reporting

If you discover a security vulnerability in InspectorAI, please follow responsible disclosure principles:

1. Do not disclose the vulnerability publicly
2. Email details to security@example.com
3. Allow time for the issue to be addressed
4. Coordinate disclosure timeline with maintainers

We take security concerns seriously and will respond promptly to all reports. 
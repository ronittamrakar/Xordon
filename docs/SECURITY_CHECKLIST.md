# Security Checklist for Xordon

This document outlines the security measures implemented and additional steps for production deployment.

## ✅ Implemented Security Features

### Authentication & Authorization
- [x] **Token-based authentication** with secure random tokens (`bin2hex(random_bytes(24))`)
- [x] **Token expiration** (30 days default, configurable)
- [x] **Password hashing** with `PASSWORD_DEFAULT` (bcrypt) and Argon2ID option
- [x] **Login rate limiting** - Brute-force protection (5 attempts per email, 10 per IP)
- [x] **Account lockout** after failed attempts (15 minutes)
- [x] **Workspace/tenant isolation** - Multi-tenancy with workspace_id scoping

### Input Validation & Sanitization
- [x] **InputValidator class** with comprehensive validation methods
- [x] **Email validation** with format and sanitization
- [x] **SQL injection prevention** - Prepared statements throughout
- [x] **XSS prevention** - HTML escaping via `htmlspecialchars()`

### File Upload Security
- [x] **SecureUpload class** with:
  - MIME type validation (finfo)
  - Magic bytes verification
  - Dangerous extension blocking (.php, .exe, etc.)
  - Random filename generation
  - Path traversal prevention
  - SVG sanitization (script/event handler removal)
  - File size limits

### HTTP Security Headers
- [x] **Content-Security-Policy** (CSP)
- [x] **X-Frame-Options: DENY** (clickjacking protection)
- [x] **X-Content-Type-Options: nosniff**
- [x] **X-XSS-Protection: 1; mode=block**
- [x] **Referrer-Policy: strict-origin-when-cross-origin**
- [x] **Permissions-Policy** (disable unused features)
- [x] **HSTS** (production only, when HTTPS)

### CORS Configuration
- [x] **Explicit origin allowlist** (no wildcard with credentials)
- [x] **Credentials support** with proper origin reflection
- [x] **Preflight caching** (24 hours)

### Rate Limiting
- [x] **Global API rate limiting** (100 requests/hour default)
- [x] **Login-specific rate limiting** (prevents credential stuffing)
- [x] **Rate limit headers** (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)

### Error Handling
- [x] **Global exception handler** - Prevents PHP errors from leaking
- [x] **Structured error responses** - Consistent JSON format
- [x] **Error logging** - Detailed logs without exposing to users

### Apache/.htaccess Hardening
- [x] **Directory listing disabled**
- [x] **Sensitive file blocking** (.env, .sql, .log, etc.)
- [x] **PHP execution blocked in uploads**
- [x] **Server signature removed**

---

## 🔧 Configuration Required for Production

### 1. Generate Secure Secrets
Run these commands to generate secure values:

```bash
# Generate JWT_SECRET (32+ characters)
php -r "echo bin2hex(random_bytes(32));"

# Generate ENCRYPTION_KEY (32+ characters)
php -r "echo bin2hex(random_bytes(32));"
```

Update `.env`:
```env
JWT_SECRET=<generated-value>
ENCRYPTION_KEY=<generated-value>
```

### 2. Set Production Environment
```env
APP_ENV=production
```

### 3. Configure CORS for Production
```env
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

### 4. Enable HTTPS
- Obtain SSL certificate (Let's Encrypt recommended)
- Configure Apache/Nginx for HTTPS
- Redirect HTTP to HTTPS

### 5. Database Security
- [ ] Use a non-root MySQL user with limited privileges
- [ ] Set a strong MySQL password
- [ ] Enable MySQL SSL if connecting remotely
- [ ] Regular backups with encryption

---

## 📋 Pre-Production Checklist

### Environment
- [ ] `APP_ENV=production` is set
- [ ] Debug mode is disabled
- [ ] Error display is off (`display_errors=Off` in php.ini)
- [ ] Secure secrets are generated and unique

### Network
- [ ] HTTPS is enabled and enforced
- [ ] HSTS is configured
- [ ] Firewall rules are in place
- [ ] Database is not publicly accessible

### Authentication
- [ ] Default/test accounts are removed
- [ ] Dev token endpoint is disabled in production
- [ ] Password policy is enforced on signup

### Monitoring
- [ ] Error logging is configured
- [ ] Security event logging is enabled
- [ ] Alerts for suspicious activity

### Backups
- [ ] Automated database backups
- [ ] Backup encryption
- [ ] Tested restore procedure

---

## 🛡️ Additional Security Recommendations

### For XAMPP Development
1. **Bind to localhost only** - Don't expose XAMPP to network
2. **Password-protect phpMyAdmin**
3. **Keep XAMPP updated**
4. **Don't use XAMPP in production**

### For Production
1. **Use a proper web server** (Apache/Nginx on Linux)
2. **Enable WAF** (Web Application Firewall) - Cloudflare, AWS WAF
3. **DDoS protection** via CDN
4. **Regular security audits**
5. **Dependency updates** - Run `npm audit` and `composer audit` regularly
6. **Penetration testing** before major releases

### Code Practices
1. **Never commit secrets** to git
2. **Use environment variables** for all credentials
3. **Validate all input** on the server side
4. **Escape all output** to prevent XSS
5. **Use prepared statements** for all SQL queries
6. **Log security events** but never log passwords

---

## 🔍 Security Testing Commands

### Check for vulnerabilities
```bash
# Frontend dependencies
npm audit

# Backend dependencies (if using Composer)
composer audit
```

### Test rate limiting
```bash
# Should get 429 after 5 failed attempts
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

### Test security headers
```bash
curl -I http://localhost:8080/api/
```

Expected headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 📁 Security-Related Files

| File | Purpose |
|------|---------|
| `backend/src/Auth.php` | Token-based authentication |
| `backend/src/SecureAuth.php` | Enhanced auth with rate limiting |
| `backend/src/LoginRateLimiter.php` | Brute-force protection |
| `backend/src/SecureUpload.php` | Safe file upload handling |
| `backend/src/SecurityHeaders.php` | HTTP security headers |
| `backend/src/InputValidator.php` | Input validation/sanitization |
| `backend/src/RateLimiter.php` | API rate limiting |
| `backend/src/ErrorHandler.php` | Global error handling |
| `backend/public/.htaccess` | Apache security rules |

---

## 🚨 Incident Response

If you suspect a security breach:

1. **Isolate** - Take affected systems offline if necessary
2. **Assess** - Check logs for unauthorized access
3. **Contain** - Revoke compromised tokens/credentials
4. **Notify** - Inform affected users if data was exposed
5. **Fix** - Patch the vulnerability
6. **Review** - Update security measures to prevent recurrence

---

*Last updated: December 2024*

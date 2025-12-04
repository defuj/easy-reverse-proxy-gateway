# External HTTPS Services Support 🌐

## Feature: Proxy ke External HTTPS Services

Gateway sekarang support proxy ke **external HTTPS services** seperti:
- Public APIs (facebook.com, api.github.com, etc.)
- Third-party services
- CDN endpoints
- Cloud services

---

## ✨ Cara Kerja

### Auto-Detection Protocol

Gateway **otomatis detect** apakah service menggunakan HTTP atau HTTPS:

**Internal Services (IP Address):**
```bash
192.168.1.100:4000  → HTTP (default)
192.168.1.101:443   → HTTPS (by port)
```

**External Services (Domain):**
```bash
facebook.com        → HTTPS (auto-detect) ✅
api.github.com      → HTTPS (auto-detect) ✅
example.com:80      → HTTP (by port)
```

---

## 📋 Configuration

### Example 1: Proxy ke Facebook

**.env:**
```bash
ENABLE_PATH_REWRITE=true

FACEBOOK_HOST=facebook.com
FACEBOOK_ROUTES=/facebook
FACEBOOK_PRIORITY=1
```

**Generated nginx.conf:**
```nginx
upstream facebook_app {
    server facebook.com:443;
}

location /facebook/ {
    rewrite ^/facebook(/|$)(.*) /$2 break;
    
    proxy_pass https://facebook_app;
    
    # SSL/TLS settings
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    proxy_ssl_verify off;
    
    # Preserve original host
    proxy_set_header Host facebook.com;
    # ... other settings
}
```

**Test:**
```bash
curl -I http://localhost:3003/facebook/
# ✅ Works! Gets response from facebook.com
```

---

### Example 2: Proxy ke GitHub API

**.env:**
```bash
GITHUB_API_HOST=api.github.com
GITHUB_API_ROUTES=/github
GITHUB_API_PRIORITY=1
```

**Test:**
```bash
curl http://localhost:3003/github/users/octocat
# ✅ Returns GitHub user data
```

---

### Example 3: Proxy ke Multiple External Services

**.env:**
```bash
ENABLE_PATH_REWRITE=true

# GitHub API
GITHUB_HOST=api.github.com
GITHUB_ROUTES=/github
GITHUB_PRIORITY=1

# JSONPlaceholder (Testing API)
JSONPLACEHOLDER_HOST=jsonplaceholder.typicode.com
JSONPLACEHOLDER_ROUTES=/api
JSONPLACEHOLDER_PRIORITY=2

# Your Internal App
INTERNAL_APP_HOST=192.168.1.100:3000
# No routes = catch-all
INTERNAL_APP_PRIORITY=999
```

**Result:**
- `/github/*` → api.github.com (HTTPS)
- `/api/*` → jsonplaceholder.typicode.com (HTTPS)
- `/*` → Internal app (HTTP)

---

## 🔧 Manual Protocol Override

Jika auto-detection tidak sesuai, bisa override manual:

**.env:**
```bash
# Force HTTPS (even for internal)
API_HOST=192.168.1.100:8443
API_PROTOCOL=https
API_ROUTES=/api

# Force HTTP (even for external)
LEGACY_API_HOST=oldapi.example.com
LEGACY_API_PROTOCOL=http
LEGACY_API_ROUTES=/legacy
```

---

## 🎯 Generated nginx Config

### For HTTPS External Service:

```nginx
upstream external_service {
    server api.example.com:443;
}

location /service/ {
    proxy_pass https://external_service;
    
    # SSL/TLS Configuration
    proxy_ssl_server_name on;       # SNI support
    proxy_ssl_protocols TLSv1.2 TLSv1.3;  # Modern TLS only
    proxy_ssl_verify off;           # Skip cert verification
    
    # Preserve original hostname
    proxy_set_header Host api.example.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # ... other settings
}
```

### Key Points:

1. **`proxy_pass https://`** - Uses HTTPS to upstream
2. **`proxy_ssl_server_name on`** - Enables SNI (Server Name Indication)
3. **`proxy_ssl_verify off`** - Disables certificate verification (for flexibility)
4. **`Host: api.example.com`** - Preserves original hostname

---

## 🧪 Testing

### Test 1: Check Detection

```bash
npm run generate
# Should show:
# Protocol: HTTPS (external)
```

### Test 2: Test Connection

```bash
curl -I http://localhost:3003/facebook/
# Should get response from facebook.com
```

### Test 3: Check Headers

```bash
curl -v http://localhost:3003/api/endpoint 2>&1 | grep "Host:"
# Should show: Host: api.example.com
```

---

## 🌐 Common External Services

### Public APIs

```bash
# GitHub API
GITHUB_HOST=api.github.com
GITHUB_ROUTES=/github

# OpenAI API
OPENAI_HOST=api.openai.com
OPENAI_ROUTES=/ai

# Stripe API
STRIPE_HOST=api.stripe.com
STRIPE_ROUTES=/stripe
```

### Social Media

```bash
# Facebook
FACEBOOK_HOST=graph.facebook.com
FACEBOOK_ROUTES=/facebook

# Twitter API
TWITTER_HOST=api.twitter.com
TWITTER_ROUTES=/twitter
```

### Cloud Services

```bash
# AWS S3
S3_HOST=mybucket.s3.amazonaws.com
S3_ROUTES=/files

# Google Cloud Storage
GCS_HOST=storage.googleapis.com
GCS_ROUTES=/storage
```

---

## 🐛 Troubleshooting

### Issue: SSL/TLS Errors

**Problem:** 
```
SSL handshake failed
```

**Solutions:**

1. Check if service is actually HTTPS:
```bash
curl -I https://api.example.com
```

2. Try disabling SSL verify (already done by default):
```nginx
proxy_ssl_verify off;
```

3. Force HTTP if service doesn't support HTTPS:
```bash
API_PROTOCOL=http
```

---

### Issue: "Host not allowed"

**Problem:** External service rejects request with wrong Host header.

**Solution:** Already handled! We set correct Host header:
```nginx
proxy_set_header Host api.example.com;
```

---

### Issue: CORS Errors

**Problem:** Browser shows CORS errors when accessing external API.

**Solution:** This is expected for external APIs. Options:

1. **Use as backend proxy** (recommended):
   Your frontend calls your gateway, gateway calls external API.

2. **Add CORS headers** (if you control the gateway):
   Manually add to nginx.conf after generate.

3. **Use external API directly** from frontend:
   Skip gateway for public APIs.

---

### Issue: Rate Limiting

**Problem:** External service rate limits your gateway IP.

**Solution:**

1. **Pass client IP**:
```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```
(Already included!)

2. **Add API keys** in headers:
   Need manual nginx.conf edit after generate.

3. **Cache responses**:
   Add nginx caching (advanced).

---

## 💡 Best Practices

### 1. Use for Backend-to-Backend

**Good:**
```
Your Frontend → Your Gateway → External API
```

**Not recommended:**
```
Browser → Your Gateway → External API
(CORS issues, rate limiting from single IP)
```

### 2. Add API Keys

For APIs requiring authentication, edit nginx.conf after generate:

```nginx
location /github/ {
    proxy_pass https://github_api;
    
    # Add API key
    proxy_set_header Authorization "Bearer YOUR_TOKEN";
    
    # ... other settings
}
```

### 3. Document External Dependencies

In `.env` comments:
```bash
# GITHUB - Proxying to GitHub API
# Requires API token for authenticated endpoints
GITHUB_HOST=api.github.com
GITHUB_ROUTES=/github
```

### 4. Monitor Usage

External services may have:
- Rate limits
- Usage costs
- Downtime

Monitor and add fallbacks if needed.

---

## 🎯 Use Cases

### Use Case 1: Unified API Gateway

Combine internal and external APIs:

```bash
# Your internal microservices
USER_SERVICE_HOST=192.168.1.100:8001
USER_SERVICE_ROUTES=/users

ORDER_SERVICE_HOST=192.168.1.101:8002
ORDER_SERVICE_ROUTES=/orders

# External payment provider
STRIPE_HOST=api.stripe.com
STRIPE_ROUTES=/payments

# External email service
SENDGRID_HOST=api.sendgrid.com
SENDGRID_ROUTES=/email
```

**Result:** Single endpoint for your frontend!
```
http://api.myapp.com/users      → Internal
http://api.myapp.com/orders     → Internal
http://api.myapp.com/payments   → Stripe (HTTPS)
http://api.myapp.com/email      → SendGrid (HTTPS)
```

---

### Use Case 2: Development Proxy

Bypass CORS during development:

```bash
# External API with CORS restrictions
API_HOST=api.restrictive-site.com
API_ROUTES=/api
```

Your frontend calls `http://localhost:3003/api/` instead of direct API.

---

### Use Case 3: Legacy System Integration

Mix old HTTP internal systems with modern HTTPS external services:

```bash
# Old internal system (HTTP)
LEGACY_HOST=192.168.1.50:8080
LEGACY_PROTOCOL=http
LEGACY_ROUTES=/legacy

# Modern external API (HTTPS)
MODERN_API_HOST=api.newservice.com
MODERN_API_ROUTES=/api
```

---

## 📊 Protocol Detection Logic

```javascript
// Auto-detection flow:

1. Check explicit PROTOCOL setting
   → If set, use it

2. Check if HOST includes port
   → Port 443 = HTTPS
   → Port 80 = HTTP

3. Check if HOST is IP or domain
   → IP address = HTTP (internal)
   → Domain name = HTTPS (external) ✅

4. Default
   → HTTP
```

**Examples:**
- `192.168.1.100:4000` → HTTP (IP)
- `192.168.1.100:443` → HTTPS (port 443)
- `facebook.com` → HTTPS (external domain) ✅
- `api.github.com` → HTTPS (external domain) ✅
- `localhost:3000` → HTTP (localhost)

---

## 🔒 Security Notes

### SSL Certificate Verification

By default, `proxy_ssl_verify off` for flexibility.

**For production with known services:**

Edit nginx.conf after generate:
```nginx
proxy_ssl_verify on;
proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
```

### Headers

We preserve:
- `Host` header (original domain)
- `X-Forwarded-For` (client IP)
- `X-Forwarded-Proto` (original protocol)

### Credentials

**Don't put secrets in `.env`!**

Add auth headers in nginx.conf:
```nginx
proxy_set_header Authorization "Bearer ${API_KEY}";
```

Or use environment variables with `envsubst`.

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Auto HTTPS detection | ✅ |
| External domains | ✅ |
| SSL/TLS support | ✅ |
| SNI support | ✅ |
| Manual override | ✅ (PROTOCOL) |
| Host header preservation | ✅ |

**Enable:** Just add external domain to `.env`!

```bash
FACEBOOK_HOST=facebook.com
FACEBOOK_ROUTES=/facebook
```

**That's it!** Gateway handles HTTPS automatically! 🎉

---

## 📚 Related Documentation

- [README.md](README.md) - Main docs
- [PATH-REWRITE-FEATURE.md](PATH-REWRITE-FEATURE.md) - Path rewriting
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debug guide

---

**External HTTPS services sekarang fully supported! 🌐**

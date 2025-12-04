# Path Rewriting Guide 🔄

## Problem: Service 404 saat diakses via Proxy

### Scenario:
- Service berjalan di: `http://192.168.1.100:4000/`
- Akses langsung works: `http://192.168.1.100:4000/` ✅
- Via proxy 404: `http://localhost/portainer` ❌

### Root Cause:
Service expect path `/` tapi receive path `/portainer` dari proxy.

---

## Solutions

### Option 1: Service di Root, Proxy di Subpath (REWRITE NEEDED)

Jika service running di root (`/`) tapi Anda ingin akses via subpath (`/portainer`):

#### Manual Edit nginx.conf

Setelah generate, edit `nginx.conf`:

```nginx
location /portainer/ {
    # Rewrite path: /portainer/xxx → /xxx
    rewrite ^/portainer/(.*)$ /$1 break;
    
    proxy_pass http://portainer_app;
    proxy_set_header Host $host;
    # ... other headers ...
}
```

**atau pakai proxy_pass trailing slash:**

```nginx
location /portainer/ {
    # Trailing slash di proxy_pass akan strip /portainer
    proxy_pass http://portainer_app/;
    proxy_set_header Host $host;
    # ... other headers ...
}
```

---

### Option 2: Update Service Base Path

Banyak aplikasi modern support base path configuration:

**Express.js:**
```javascript
app.use('/portainer', router);
```

**Next.js (next.config.js):**
```javascript
module.exports = {
  basePath: '/portainer',
}
```

**Nuxt.js (nuxt.config.js):**
```javascript
export default {
  router: {
    base: '/portainer/'
  }
}
```

**Vue.js:**
```javascript
const router = new VueRouter({
  base: '/portainer/',
  routes
})
```

**React (BrowserRouter):**
```javascript
<BrowserRouter basename="/portainer">
```

---

### Option 3: Use Root Path (RECOMMENDED for simplicity)

Akses service langsung tanpa subpath:

**.env:**
```bash
# Service A handle semua traffic
PORTAINER_HOST=192.168.1.100:4000
# Tidak perlu ROUTES (akan jadi catch-all)
PORTAINER_PRIORITY=999
```

Akses: `http://localhost/` → `http://192.168.1.100:4000/`

---

### Option 4: Use Subdomain

Gunakan subdomain untuk setiap service:

**.env:**
```bash
# /etc/hosts atau DNS:
# 127.0.0.1 portainer.local
# 127.0.0.1 registry.local

SERVER_NAME=*.local

PORTAINER_HOST=192.168.1.100:4000
PORTAINER_ROUTES=/
PORTAINER_PRIORITY=1

REGISTRY_HOST=192.168.1.101:5000
REGISTRY_ROUTES=/
REGISTRY_PRIORITY=2
```

Akses:
- `http://portainer.local/` → Portainer
- `http://registry.local/` → Registry

---

## Working Examples

### Example 1: API Gateway Pattern

```bash
# .env
API_V1_HOST=192.168.1.100:8001
API_V1_ROUTES=/api/v1
API_V1_PRIORITY=1

API_V2_HOST=192.168.1.101:8002
API_V2_ROUTES=/api/v2
API_V2_PRIORITY=2
```

Services harus handle:
- V1 Service: handle `/api/v1/*`
- V2 Service: handle `/api/v2/*`

---

### Example 2: Frontend + Backend

```bash
# .env
# Frontend SPA (catch-all)
FRONTEND_HOST=192.168.1.100:3000
# No routes = default
FRONTEND_PRIORITY=999

# API (specific path)
API_HOST=192.168.1.101:8080
API_ROUTES=/api
API_PRIORITY=1
```

Result:
- `/` → Frontend
- `/about` → Frontend
- `/api/users` → Backend API

**API Service must handle `/api/*` paths!**

---

### Example 3: Multiple SPAs (dengan rewrite manual)

```bash
# .env
APP1_HOST=192.168.1.100:3000
APP1_ROUTES=/app1
APP1_PRIORITY=1

APP2_HOST=192.168.1.101:3001
APP2_ROUTES=/app2
APP2_PRIORITY=2
```

**Manual edit nginx.conf after generate:**

```nginx
location /app1/ {
    proxy_pass http://app1_host/;  # Trailing slash strips /app1
    proxy_set_header Host $host;
    # ...
}

location /app2/ {
    proxy_pass http://app2_host/;  # Trailing slash strips /app2
    proxy_set_header Host $host;
    # ...
}
```

---

## Decision Matrix

| Use Case | Solution | Complexity |
|----------|----------|------------|
| Single main app | Root path (no routes) | ⭐ Easy |
| API Gateway | Subpaths (services handle full path) | ⭐⭐ Medium |
| Multiple sites | Subdomains | ⭐⭐ Medium |
| Multiple SPAs | Path rewrite (manual) | ⭐⭐⭐ Advanced |

---

## Troubleshooting Path Issues

### Test 1: Direct Service Access
```bash
curl http://192.168.1.100:4000/
```
Harus works! Kalau 404 = service issue bukan proxy.

### Test 2: Via Proxy
```bash
curl http://localhost/portainer
```
404 = mungkin perlu path rewrite.

### Test 3: Check Headers
```bash
curl -v http://localhost/portainer 2>&1 | grep "^>"
```
Lihat path yang di-forward ke backend.

### Test 4: Nginx Logs
```bash
docker logs -f reverse-proxy-gateway
```
Lihat request yang masuk.

---

## Quick Fixes

### Fix 1: Trailing Slash in Route

**.env:**
```bash
# Tambahkan trailing slash
PORTAINER_ROUTES=/portainer/
```

Then generate will create:
```nginx
location /portainer/ {
    proxy_pass http://portainer_app;
}
```

### Fix 2: Make Service Handle Subpath

Configure aplikasi untuk base path `/portainer`.

### Fix 3: Use Root for Simple Cases

```bash
# Paling simple
MAIN_APP_HOST=192.168.1.100:3000
# No routes
```

Access: `http://localhost/`

---

## Summary

🎯 **Recommended Approach:**

1. **Simple setup (1-2 services):** Use root path
2. **APIs with versioning:** Use subpaths yang di-handle service
3. **Multiple websites:** Use subdomains  
4. **Complex routing:** Manual nginx.conf edits after generate

**Golden Rule:** Path yang dikonfigurasi di ROUTES harus di-handle oleh service, atau perlu manual rewrite di nginx.conf!

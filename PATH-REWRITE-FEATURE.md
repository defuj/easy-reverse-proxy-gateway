# Path Rewrite & Redirect Fixing Feature 🔄

## Masalah yang Diselesaikan

### Scenario:
1. Service running di root: `http://192.168.1.100:4000/`
2. Akses via proxy subpath: `http://localhost/portainer`
3. Service melakukan redirect: `Location: /auth/login`
4. Browser redirect ke: `http://localhost/auth/login` ❌ **404 Not Found!**

**Seharusnya redirect ke:** `http://localhost/portainer/auth/login` ✅

---

## ✨ Solusi: Auto Path Rewrite

Fitur ini **otomatis**:
1. ✅ Strip base path dari request
2. ✅ Rewrite redirect Location header
3. ✅ Inject headers untuk backend aware base path

### Cara Enable:

**.env:**
```bash
ENABLE_PATH_REWRITE=true
```

That's it! 🎉

---

## 🎯 Bagaimana Cara Kerjanya?

### Request Flow (dengan Path Rewrite):

```
1. Browser → http://localhost/portainer/
   ↓
2. Nginx rewrite → http://backend/ 
   (strip /portainer)
   ↓
3. Backend response → Location: /auth/login
   ↓
4. Nginx rewrite Location → /portainer/auth/login
   ↓
5. Browser redirect → http://localhost/portainer/auth/login ✅
```

### Generated nginx.conf:

```nginx
location /portainer/ {
    # Strip base path
    rewrite ^/portainer(/|$)(.*) /$2 break;
    
    proxy_pass http://portainer_app;
    
    # Auto-fix redirects
    proxy_redirect ~^(https?://[^/]+)(/.*)?$ $1/portainer$2;
    proxy_redirect / /portainer/;
    
    # Inform backend about base path
    proxy_set_header X-Forwarded-Prefix /portainer;
    proxy_set_header X-Script-Name /portainer;
    
    # ... other headers ...
}
```

---

## 📋 Kapan Menggunakan?

### ✅ Use Path Rewrite (ENABLE_PATH_REWRITE=true) When:

- Service **tidak support** base path configuration
- Service running di root (/) tapi ingin akses via subpath
- Service melakukan redirect internal yang perlu di-fix
- Multiple services, masing-masing running di root

**Contoh:**
- Portainer (Docker management)
- Grafana
- Jenkins
- Aplikasi legacy
- Third-party tools yang tidak bisa dikonfigurasi

### ❌ Don't Need Path Rewrite (ENABLE_PATH_REWRITE=false) When:

- Service **sudah handle** base path (configured dalam aplikasi)
- Service **sudah return** correct redirect dengan base path
- API Gateway (APIs biasanya handle full path)
- Modern frameworks dengan base path config

**Contoh:**
- Next.js dengan `basePath: '/app1'`
- Express.js dengan `app.use('/api', router)`
- Vue/React dengan configured base path

---

## 🔧 Configuration Examples

### Example 1: Multiple Apps (with rewrite)

**.env:**
```bash
ENABLE_PATH_REWRITE=true

# Portainer (tidak support base path)
PORTAINER_HOST=192.168.1.100:9000
PORTAINER_ROUTES=/portainer
PORTAINER_PRIORITY=1

# Grafana (tidak support base path)
GRAFANA_HOST=192.168.1.101:3000
GRAFANA_ROUTES=/grafana
GRAFANA_PRIORITY=2

# Jenkins (tidak support base path)
JENKINS_HOST=192.168.1.102:8080
JENKINS_ROUTES=/jenkins
JENKINS_PRIORITY=3
```

**Result:**
- `/portainer` → Portainer (with auto path strip & redirect fix)
- `/grafana` → Grafana (with auto path strip & redirect fix)
- `/jenkins` → Jenkins (with auto path strip & redirect fix)

---

### Example 2: API + Frontend (no rewrite needed)

**.env:**
```bash
ENABLE_PATH_REWRITE=false

# API (handles /api/* internally)
API_HOST=192.168.1.100:8080
API_ROUTES=/api
API_PRIORITY=1

# Frontend SPA (catch-all)
FRONTEND_HOST=192.168.1.101:3000
# No routes = default
FRONTEND_PRIORITY=999
```

**Result:**
- `/api/*` → API (full path forwarded)
- `/*` → Frontend (full path forwarded)

---

### Example 3: Mixed (some with rewrite, some without)

Untuk kasus mixed, bisa generate dua kali:

**Pendekatan 1: Manual Edit After Generate**

1. Generate dengan `ENABLE_PATH_REWRITE=true`
2. Edit `nginx.conf` untuk services yang tidak perlu rewrite
3. Remove `rewrite` dan `proxy_redirect` lines

**Pendekatan 2: Separate Instances**

Run dua gateway instances di port berbeda:
- Port 80: dengan path rewrite (untuk legacy apps)
- Port 8080: tanpa path rewrite (untuk modern apps)

---

## 🎓 Technical Details

### 1. Path Stripping

```nginx
rewrite ^/portainer(/|$)(.*) /$2 break;
```

**Explanation:**
- `^/portainer` - Match /portainer at start
- `(/|$)` - Followed by / or end of string
- `(.*)` - Capture rest of path
- `/$2` - Rewrite to just the captured part
- `break` - Stop rewrite processing

**Examples:**
- `/portainer/` → `/`
- `/portainer/auth/login` → `/auth/login`
- `/portainer/api/users` → `/api/users`

---

### 2. Redirect Rewriting

```nginx
proxy_redirect ~^(https?://[^/]+)(/.*)?$ $1/portainer$2;
proxy_redirect / /portainer/;
```

**Line 1 - Full URL Redirects:**
- Matches: `http://backend:4000/auth/login`
- Rewrites to: `http://localhost:3003/portainer/auth/login`

**Line 2 - Relative Redirects:**
- Matches: `/auth/login`
- Rewrites to: `/portainer/auth/login`

---

### 3. Backend Awareness Headers

```nginx
proxy_set_header X-Forwarded-Prefix /portainer;
proxy_set_header X-Script-Name /portainer;
```

Some frameworks can read these headers to generate correct URLs:
- Django: Uses `X-Forwarded-Prefix`
- Flask: Can use `X-Script-Name`
- FastAPI: Can read `X-Forwarded-Prefix`

---

## 🧪 Testing

### Test 1: Direct Access
```bash
curl -I http://localhost:3003/portainer/
# Should return 200 or redirect with correct Location
```

### Test 2: Redirect Handling
```bash
curl -I http://localhost:3003/portainer/ 2>&1 | grep Location
# Location should include /portainer prefix
```

### Test 3: Nested Paths
```bash
curl http://localhost:3003/portainer/api/status
# Should work if backend has /api/status endpoint
```

### Test 4: Static Assets
```bash
curl http://localhost:3003/portainer/css/app.css
# Assets should load correctly
```

---

## 🐛 Troubleshooting

### Issue: Assets (CSS/JS) tidak load

**Problem:** Asset paths dalam HTML masih `/css/app.css` bukan `/portainer/css/app.css`

**Solution:**
1. Beberapa app perlu konfigurasi base path di aplikasi juga
2. Cek dokumentasi service untuk base path config
3. Atau gunakan subdomain approach (lebih reliable)

---

### Issue: Redirect loop

**Problem:** Terus redirect ke diri sendiri

**Solution:**
1. Check nginx logs: `docker logs -f reverse-proxy-gateway`
2. Mungkin service dan nginx sama-sama rewrite path
3. Disable path rewrite: `ENABLE_PATH_REWRITE=false`
4. Configure base path di aplikasi instead

---

### Issue: POST requests tidak work

**Problem:** Form submission atau API POST fail

**Solution:**
1. Check `X-Forwarded-Prefix` header
2. Pastikan form action URLs relative bukan absolute
3. Check CORS settings di backend

---

## 💡 Best Practices

### 1. Prefer Base Path Configuration

Jika service support base path config, gunakan itu:
```javascript
// Better than path rewrite
module.exports = {
  basePath: '/portainer'
}
```

### 2. Test Thoroughly

Test semua features:
- [ ] Homepage load
- [ ] Navigation/links
- [ ] Redirects
- [ ] Static assets
- [ ] Form submissions
- [ ] API calls
- [ ] WebSocket (if any)

### 3. Use Subdomain for Complex Apps

Untuk aplikasi complex dengan banyak redirects:
```bash
# Easier
http://portainer.local/
http://grafana.local/

# Than
http://localhost/portainer/
http://localhost/grafana/
```

### 4. Document Your Configuration

Catat service mana yang perlu path rewrite:
```bash
# .env comments
# PORTAINER - needs path rewrite (no base path support)
PORTAINER_HOST=192.168.1.100:9000
PORTAINER_ROUTES=/portainer

# API - handles /api internally (no rewrite needed)
API_HOST=192.168.1.101:8080
API_ROUTES=/api
```

---

## 🎯 Summary

| Feature | Without Path Rewrite | With Path Rewrite |
|---------|---------------------|-------------------|
| Request Path | Full path forwarded | Base path stripped |
| Redirect Fix | No | Yes (automatic) |
| Backend Headers | Standard | + X-Forwarded-Prefix |
| Use Case | Modern apps | Legacy/third-party |
| Complexity | Simple | Automatic |

**Enable dengan:** `ENABLE_PATH_REWRITE=true` di `.env`

---

## 📚 Related Documentation

- [README-PATH-REWRITE.md](README-PATH-REWRITE.md) - Manual path rewriting
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Debug issues
- [EXAMPLES.md](EXAMPLES.md) - Real-world examples

---

**Feature ini membuat hidup developer jauh lebih mudah! 🎉**

No need manual nginx editing, no need worry tentang redirects - semuanya otomatis!

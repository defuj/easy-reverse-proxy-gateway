# Contoh Penggunaan 📚

## Contoh 1: Simple Setup (2 Apps)

```bash
# .env
SERVER_NAME=myapp.com
NGINX_PORT=80

# Frontend App (Homepage)
FRONTEND_HOST=192.168.1.100:3000
FRONTEND_ROUTES=/,/about,/contact
FRONTEND_PRIORITY=1

# Backend API
API_HOST=192.168.1.101:8080
API_ROUTES=/api
API_PRIORITY=2
```

**Hasil Routing:**
- `myapp.com/` → Frontend (192.168.1.100:3000)
- `myapp.com/about` → Frontend
- `myapp.com/api/users` → Backend API (192.168.1.101:8080)

---

## Contoh 2: E-commerce Platform (4 Apps)

```bash
# .env
SERVER_NAME=mystore.com
NGINX_PORT=80

# Landing Page
LANDING_HOST=192.168.1.100:5000
LANDING_ROUTES=/,/products,/about,/contact
LANDING_PRIORITY=1

# Customer Dashboard
CUSTOMER_HOST=192.168.1.101:3000
CUSTOMER_ROUTES=/dashboard,/orders,/profile
CUSTOMER_PRIORITY=2

# Admin Panel
ADMIN_HOST=192.168.1.102:3001
ADMIN_ROUTES=/admin
ADMIN_PRIORITY=3

# API Gateway
API_HOST=192.168.1.103:8080
API_ROUTES=/api,/graphql
API_PRIORITY=4
```

**Hasil Routing:**
- `mystore.com/` → Landing Page
- `mystore.com/products` → Landing Page
- `mystore.com/dashboard` → Customer Dashboard
- `mystore.com/admin` → Admin Panel
- `mystore.com/api/products` → API Gateway
- `mystore.com/other` → API Gateway (default catch-all)

---

## Contoh 3: Microservices Architecture

```bash
# .env
SERVER_NAME=api.myapp.com
NGINX_PORT=80

# User Service
USER_SERVICE_HOST=192.168.1.100:8001
USER_SERVICE_ROUTES=/users,/auth
USER_SERVICE_PRIORITY=1

# Product Service
PRODUCT_SERVICE_HOST=192.168.1.101:8002
PRODUCT_SERVICE_ROUTES=/products,/categories
PRODUCT_SERVICE_PRIORITY=2

# Order Service
ORDER_SERVICE_HOST=192.168.1.102:8003
ORDER_SERVICE_ROUTES=/orders,/cart
ORDER_SERVICE_PRIORITY=3

# Payment Service
PAYMENT_SERVICE_HOST=192.168.1.103:8004
PAYMENT_SERVICE_ROUTES=/payment,/checkout
PAYMENT_SERVICE_PRIORITY=4

# Notification Service (Catch-all)
NOTIFICATION_SERVICE_HOST=192.168.1.104:8005
# No routes - will handle everything else
NOTIFICATION_SERVICE_PRIORITY=999
```

---

## Contoh 4: Multi-tenant SaaS

```bash
# .env
SERVER_NAME=*.myapp.com
NGINX_PORT=80

# Marketing Site
MARKETING_HOST=192.168.1.100:3000
MARKETING_ROUTES=/,/pricing,/features,/demo
MARKETING_PRIORITY=1

# App Platform (semua tenant)
APP_HOST=192.168.1.101:8080
# No routes - catch all other requests
APP_PRIORITY=999
```

**Hasil Routing:**
- `myapp.com/` → Marketing Site
- `myapp.com/pricing` → Marketing Site
- `app.myapp.com/dashboard` → App Platform
- `tenant1.myapp.com/*` → App Platform

---

## Contoh 5: Development Setup (Local)

```bash
# .env
SERVER_NAME=localhost
NGINX_PORT=80

# Next.js Frontend
FRONTEND_HOST=localhost:3000
FRONTEND_ROUTES=/,/about,/contact
FRONTEND_PRIORITY=1

# Express API
API_HOST=localhost:3001
API_ROUTES=/api
API_PRIORITY=2

# Python ML Service
ML_SERVICE_HOST=localhost:5000
ML_SERVICE_ROUTES=/predict,/train
ML_SERVICE_PRIORITY=3

# Admin Panel (Vite)
ADMIN_HOST=localhost:5173
ADMIN_ROUTES=/admin
ADMIN_PRIORITY=4
```

---

## Contoh 6: Prefix Matching untuk API Versioning

```bash
# .env
SERVER_NAME=api.myapp.com

# API V1
API_V1_HOST=192.168.1.100:8001
API_V1_ROUTES=/v1
API_V1_PRIORITY=1

# API V2
API_V2_HOST=192.168.1.101:8002
API_V2_ROUTES=/v2
API_V2_PRIORITY=2

# Latest API (default)
API_LATEST_HOST=192.168.1.102:8003
# No routes specified
API_LATEST_PRIORITY=999
```

**Hasil Routing:**
- `api.myapp.com/v1/users` → API V1
- `api.myapp.com/v2/users` → API V2
- `api.myapp.com/users` → Latest API (default)

---

## Contoh 7: Static Assets + Dynamic App

```bash
# .env
SERVER_NAME=myapp.com

# CDN untuk static assets
CDN_HOST=192.168.1.100:8080
CDN_ROUTES=/static,/assets,/images,/css,/js
CDN_PRIORITY=1

# Dynamic Web App
APP_HOST=192.168.1.101:3000
# No routes - handle everything else
APP_PRIORITY=999
```

---

## Tips Penggunaan

### 1. Priority Numbers

```bash
# Landing/Marketing: 1-10
LANDING_PRIORITY=1

# User-facing apps: 11-50
CUSTOMER_APP_PRIORITY=20
MERCHANT_APP_PRIORITY=21

# APIs: 51-100
API_PRIORITY=51

# Admin/Internal: 101-200
ADMIN_PRIORITY=101

# Default/Catch-all: 900-999
DEFAULT_APP_PRIORITY=999
```

### 2. Route Patterns

```bash
# Exact match (homepage)
APP_ROUTES=/

# Multiple exact matches
APP_ROUTES=/about,/contact,/pricing

# Prefix match (will match /api/*)
APP_ROUTES=/api

# Mix exact and prefix
APP_ROUTES=/,/about,/api
```

### 3. Testing Configuration

```bash
# Generate dan lihat hasilnya
npm run generate
cat nginx.conf

# Test tanpa running
npm run validate

# Running dengan logs
npm run dev
```

### 4. Quick Updates

```bash
# Edit .env
nano .env

# Apply changes
npm run reload

# Or restart completely
npm restart
```

---

## Common Patterns

### SPA (Single Page Application)

```bash
FRONTEND_HOST=192.168.1.100:3000
# No routes - let frontend handle all routing
FRONTEND_PRIORITY=999
```

### API Gateway

```bash
API_HOST=192.168.1.100:8080
API_ROUTES=/api,/graphql,/rest,/webhook
API_PRIORITY=1
```

### Admin Panel

```bash
ADMIN_HOST=192.168.1.100:3001
ADMIN_ROUTES=/admin
ADMIN_PRIORITY=2
```

### Health Check Endpoint

```bash
HEALTH_HOST=192.168.1.100:8000
HEALTH_ROUTES=/health,/status,/ping
HEALTH_PRIORITY=1
```

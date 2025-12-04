# Reverse Proxy Gateway 🚀

Gateway nginx yang **mudah dikonfigurasi** untuk menghubungkan banyak service aplikasi melalui 1 host. Setiap service bisa berada di device dan IP yang berbeda.

**Tidak perlu edit nginx.conf!** Cukup konfigurasi via file `.env` saja!

> 📖 **Baru pertama kali?** Lihat [QUICKSTART.md](QUICKSTART.md) untuk panduan 5 menit!

## 🚀 Quick Start

### 1. Persiapan

```bash
# Install Node.js (untuk npm commands)
# Install Docker & Docker Compose
```

### 2. Setup Awal

Jalankan perintah setup:

```bash
npm run setup
```

Atau manual:

```bash
cp .env.example .env
```

### 3. Konfigurasi

Edit file `.env` dan sesuaikan dengan service Anda:

```bash
# Server Configuration
SERVER_NAME=localhost
NGINX_PORT=80

# Landing App
LANDING_APP_HOST=192.168.1.100:5004
LANDING_APP_ROUTES=/,/products,/pricing
LANDING_APP_PRIORITY=1

# Customer App
CUSTOMER_APP_HOST=192.168.1.101:5002
CUSTOMER_APP_ROUTES=/dashboard,/profile
CUSTOMER_APP_PRIORITY=2

# API Service
API_APP_HOST=192.168.1.102:8080
API_APP_ROUTES=/api,/graphql
API_APP_PRIORITY=3
```

### 4. Validasi (Opsional tapi Direkomendasikan)

```bash
npm run check
```

Akan mengecek:
- ✅ Format konfigurasi .env
- ✅ Koneksi ke setiap service
- ✅ Route conflicts
- ✅ Priority settings

### 5. Jalankan Gateway

```bash
# Development mode (auto-generate config + logs)
npm run dev

# Production mode (auto-generate config + background)
npm start
```

**nginx.conf akan di-generate otomatis!** 🎉

## 📋 Available Commands

```bash
# Setup & Configuration
npm run setup     # Initial setup (copy .env.example ke .env)
npm run check     # Validate .env dan test koneksi ke services
npm run generate  # Generate nginx.conf dari .env
npm run validate  # Validate .env + generate config

# Running Gateway
npm run dev       # Generate config + jalankan dengan logs (foreground)
npm start         # Generate config + jalankan di background
npm stop          # Stop gateway
npm restart       # Generate config + restart gateway

# Monitoring & Maintenance
npm run logs      # Lihat logs real-time
npm run reload    # Reload konfigurasi tanpa downtime
npm run test      # Test syntax nginx.conf
```

## 🔧 Menambah Service Baru

### 1. Tambahkan konfigurasi di `.env`

```bash
# Admin Panel
ADMIN_APP_HOST=192.168.1.103:3000
ADMIN_APP_ROUTES=/admin,/settings
ADMIN_APP_PRIORITY=4

# Payment Service
PAYMENT_APP_HOST=192.168.1.104:9000
PAYMENT_APP_ROUTES=/payment,/checkout
PAYMENT_APP_PRIORITY=5
```

### 2. Restart gateway

```bash
npm restart      # Auto-generate + restart
# atau
npm run reload   # Jika gateway sudah running
```

**Itu saja!** nginx.conf akan di-generate ulang otomatis! 🎉

## 📁 Struktur File

```
reverse-proxy-tool/
├── .env                   # Konfigurasi utama (edit ini!)
├── .env.example           # Contoh konfigurasi
├── generate-config.js     # Script generator nginx.conf
├── nginx.conf             # Auto-generated (jangan edit manual!)
├── nginx.conf.template    # Template backup (deprecated)
├── docker-compose.yml     # Docker compose setup
├── package.json           # NPM scripts
├── logs/                  # Nginx logs (auto-created)
└── README.md
```

## 📝 Format Konfigurasi .env

### Service Configuration

```bash
# Format dasar
NAMA_APP_HOST=IP_ADDRESS:PORT
NAMA_APP_ROUTES=route1,route2,route3
NAMA_APP_PRIORITY=number

# Contoh
LANDING_APP_HOST=192.168.1.100:5004
LANDING_APP_ROUTES=/,/products,/pricing
LANDING_APP_PRIORITY=1
```

### Penjelasan

- **HOST**: IP dan port service (wajib)
- **ROUTES**: Route yang akan ditangani service ini (opsional)
  - Pisahkan dengan koma, tanpa spasi
  - Contoh: `/api,/admin,/dashboard`
  - Jika kosong, akan jadi default catch-all
- **PRIORITY**: Urutan prioritas (opsional, default: 999)
  - Lower number = higher priority
  - Service dengan priority lebih tinggi akan di-cek lebih dulu

### Server Configuration

```bash
SERVER_NAME=localhost       # Domain atau IP server
NGINX_PORT=80              # Port nginx
WORKER_PROCESSES=auto      # Nginx worker processes
WORKER_CONNECTIONS=1024    # Max connections per worker
```

### 🔄 Path Rewrite Configuration

```bash
ENABLE_PATH_REWRITE=true   # Auto-fix redirects dan strip base path
```

**Kapan perlu enable:**
- ✅ Service running di root (/) tapi diakses via subpath (/app1, /app2)
- ✅ Service melakukan redirect yang perlu di-fix (misal: redirect `/auth/login` jadi `/app1/auth/login`)
- ✅ Legacy apps atau third-party tools yang tidak support base path

**Contoh:**
```bash
ENABLE_PATH_REWRITE=true

# Portainer running di / tapi diakses via /portainer
PORTAINER_HOST=192.168.1.100:9000
PORTAINER_ROUTES=/portainer
```

Result: Redirect otomatis ter-fix! `/auth/login` → `/portainer/auth/login` ✨

**Baca lengkap:** [PATH-REWRITE-FEATURE.md](PATH-REWRITE-FEATURE.md)

### 🌐 External HTTPS Services (NEW!)

Gateway **otomatis detect** dan support HTTPS untuk external services!

```bash
# Auto-detect HTTPS untuk domain external
FACEBOOK_HOST=facebook.com
FACEBOOK_ROUTES=/facebook

# Auto-detect HTTP untuk IP internal
API_HOST=192.168.1.100:8080
API_ROUTES=/api
```

**Auto-Detection:**
- ✅ External domains (facebook.com, api.github.com) → HTTPS
- ✅ Internal IPs (192.168.x.x:port) → HTTP
- ✅ Manual override: `SERVICE_PROTOCOL=https` atau `=http`

**Generated Config:**
- SSL/TLS settings otomatis
- SNI support
- Host header preservation

**Baca lengkap:** [EXTERNAL-HTTPS-SERVICES.md](EXTERNAL-HTTPS-SERVICES.md)

## ⚙️ Konfigurasi IP Service

Setiap service harus bisa diakses dari device gateway. Pastikan:

1. **Network**: Semua device dalam satu network atau bisa saling akses
2. **Firewall**: Port service tidak diblokir
3. **Service Running**: Service sudah berjalan di IP dan port yang ditentukan

### Contoh Test Koneksi

```bash
# Test dari gateway ke service
curl http://192.168.1.100:5004
curl http://192.168.1.101:5002
```

## 🔍 Troubleshooting

### Gateway tidak bisa akses service

```bash
# Cek koneksi dari container nginx
docker exec -it reverse-proxy-gateway sh
wget -O- http://192.168.1.100:5004
```

### Lihat error logs

```bash
npm run logs

# Atau langsung
docker-compose logs nginx
```

### Test konfigurasi

```bash
npm run test
```

## 💡 Tips

### Default / Catch-all App

Service tanpa `ROUTES` atau dengan priority paling rendah akan menangani semua request yang tidak match dengan route lain:

```bash
# Landing App - handle specific routes
LANDING_APP_HOST=192.168.1.100:5004
LANDING_APP_ROUTES=/products,/pricing
LANDING_APP_PRIORITY=1

# Customer App - handle semua route lainnya (default)
CUSTOMER_APP_HOST=192.168.1.101:5002
# Tidak perlu ROUTES
CUSTOMER_APP_PRIORITY=999
```

### Exact Match vs Prefix Match

```bash
# Exact match (=)
LANDING_APP_ROUTES=/,/about,/contact

# Prefix match
API_APP_ROUTES=/api,/graphql
# Akan match: /api/users, /api/products, /graphql/query
```

### Testing Tanpa Docker

```bash
# Generate config saja
npm run generate

# Cek hasilnya
cat nginx.conf
```

## 🆘 Troubleshooting

**Gateway tidak bisa diakses?**

Lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md) untuk:
- Connection reset / Can't be reached
- 502 Bad Gateway
- 504 Gateway Timeout
- Services di localhost
- Port conflicts
- Network issues

**Service return 404 atau redirect tidak benar?**

Lihat [README-PATH-REWRITE.md](README-PATH-REWRITE.md) untuk:
- Path rewriting manual
- Base path configuration
- Subdomain routing
- Multiple SPAs setup

**NEW! Auto Path Rewrite & Redirect Fix**

Lihat [PATH-REWRITE-FEATURE.md](PATH-REWRITE-FEATURE.md) untuk:
- ✨ Automatic path rewriting
- ✨ Automatic redirect fixing
- ✨ Enable dengan 1 setting: `ENABLE_PATH_REWRITE=true`
- No manual nginx editing needed!

**NEW! External HTTPS Services**

Lihat [EXTERNAL-HTTPS-SERVICES.md](EXTERNAL-HTTPS-SERVICES.md) untuk:
- 🌐 Proxy ke external HTTPS services (Facebook, GitHub API, etc.)
- 🔒 Auto SSL/TLS configuration
- 🎯 Auto protocol detection (HTTP vs HTTPS)
- Works out of the box!

## 📝 Notes

- Gateway berjalan di port 80 (HTTP) by default (bisa diganti via NGINX_PORT di .env)
- Logs tersimpan di folder `./logs`
- Konfigurasi bisa di-reload tanpa downtime
- Mendukung multiple device dengan IP berbeda
- **nginx.conf di-generate otomatis, jangan edit manual!**
- Path di ROUTES harus di-handle oleh service (atau perlu manual rewrite)

# Quick Start Guide ⚡

Panduan 5 menit untuk setup reverse proxy gateway!

## 🎯 Step-by-Step

### 1️⃣ Setup Environment (1 menit)

```bash
# Clone atau download project
cd reverse-proxy-tool

# Setup .env file
npm run setup
```

### 2️⃣ Konfigurasi Services (2 menit)

Edit file `.env` yang baru dibuat:

```bash
# Contoh: 2 services sederhana
SERVER_NAME=localhost
NGINX_PORT=80

# Frontend App
FRONTEND_HOST=192.168.1.100:3000
FRONTEND_ROUTES=/,/about,/contact
FRONTEND_PRIORITY=1

# Backend API
BACKEND_HOST=192.168.1.101:8080
BACKEND_ROUTES=/api
BACKEND_PRIORITY=2
```

**Tips:**
- Ganti IP dan PORT sesuai service Anda
- Pisahkan routes dengan koma (tanpa spasi)
- Priority: angka lebih kecil = lebih prioritas

### 3️⃣ Validate (1 menit)

```bash
npm run check
```

Akan mengecek:
- ✅ Format konfigurasi benar
- ✅ Services dapat diakses
- ⚠️ Warnings jika ada masalah

### 4️⃣ Jalankan! (1 menit)

```bash
# Development (with logs)
npm run dev

# Production (background)
npm start
```

**Done!** 🎉 Gateway sudah running!

---

## 🧪 Testing

### Test dari browser:

```
http://localhost/         → Frontend
http://localhost/about    → Frontend
http://localhost/api/users → Backend
```

### Test dari terminal:

```bash
curl http://localhost/
curl http://localhost/api/users
```

---

## 🔄 Update Konfigurasi

### Tambah Service Baru:

1. Edit `.env`:
   ```bash
   # Admin Panel
   ADMIN_HOST=192.168.1.102:3001
   ADMIN_ROUTES=/admin
   ADMIN_PRIORITY=3
   ```

2. Reload:
   ```bash
   npm run reload
   ```

### Update Routes:

1. Edit routes di `.env`
2. Reload: `npm run reload`

---

## 📊 Monitoring

```bash
# Lihat logs real-time
npm run logs

# Stop gateway
npm stop

# Restart
npm restart
```

---

## 🆘 Troubleshooting

### Gateway tidak start?

```bash
# Check syntax
npm run test

# Check services
npm run check
```

### Service tidak connect?

```bash
# Test manual
curl http://192.168.1.100:3000

# Check if service is running
ping 192.168.1.100
```

### Routes tidak work?

```bash
# Validate config
npm run validate

# Check generated config
cat nginx.conf
```

---

## 📚 Next Steps

- 📖 Baca [README.md](README.md) untuk penjelasan lengkap
- 💡 Lihat [EXAMPLES.md](EXAMPLES.md) untuk contoh use cases
- 🔧 Customize sesuai kebutuhan Anda

---

## 🎓 Konsep Penting

### Priority

```bash
LANDING_PRIORITY=1   # Dicek pertama
API_PRIORITY=2       # Dicek kedua
ADMIN_PRIORITY=3     # Dicek ketiga
DEFAULT_PRIORITY=999 # Catch-all (dicek terakhir)
```

### Routes

```bash
# Exact match
APP_ROUTES=/,/about,/contact

# Prefix match (will match /api/*)
API_ROUTES=/api

# No routes = catch-all (handle semua yang tidak match)
```

### Default App

Service tanpa `ROUTES` atau dengan `PRIORITY` paling tinggi (angka besar) akan handle semua request yang tidak match.

---

**Happy Gateway-ing! 🚀**

Butuh bantuan? Baca dokumentasi lengkap di [README.md](README.md)

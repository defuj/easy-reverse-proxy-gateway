# Changelog

## [2.0.0] - 2025-12-04

### ✨ Major Update - Auto-Generate Config

#### Added
- 🎉 **Auto-generate nginx.conf dari .env** - Tidak perlu edit nginx.conf manual lagi!
- 📝 **Format konfigurasi .env yang mudah**:
  - `NAMA_APP_HOST` - IP dan port service
  - `NAMA_APP_ROUTES` - Route yang ditangani service
  - `NAMA_APP_PRIORITY` - Urutan prioritas routing
- 🔧 **Script generator** (`generate-config.js`) - Generate config otomatis
- 📚 **Dokumentasi lengkap** dengan banyak contoh penggunaan
- ✅ **Validation** - Auto-validate sebelum generate

#### Changed
- 🔄 **npm run dev** - Sekarang auto-generate config sebelum start
- 🔄 **npm start** - Sekarang auto-generate config sebelum start
- 🔄 **npm restart** - Sekarang auto-generate config sebelum restart
- 📖 **README.md** - Update dengan penjelasan lengkap

#### Added Commands
- `npm run generate` - Generate nginx.conf dari .env
- `npm run validate` - Generate + validate config

### 🎯 Breaking Changes

- Konfigurasi sekarang menggunakan `.env` bukan edit `nginx.conf` manual
- Format konfigurasi berubah menjadi lebih sederhana

### 📦 Migration Guide

**Dari v1.x ke v2.x:**

1. Copy `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

2. Konversi konfigurasi lama ke format baru:
   ```bash
   # Lama (nginx.conf):
   upstream landing_app {
       server hayujualan-landing:5004;
   }
   
   # Baru (.env):
   LANDING_APP_HOST=192.168.1.100:5004
   LANDING_APP_ROUTES=/,/products,/pricing
   LANDING_APP_PRIORITY=1
   ```

3. Jalankan:
   ```bash
   npm run dev
   ```

---

## [1.0.0] - Initial Release

### Added
- ⚙️ Basic nginx reverse proxy configuration
- 🐳 Docker Compose setup
- 📦 NPM scripts untuk kontrol gateway
- 📝 Basic documentation

### Features
- Reverse proxy untuk multiple services
- Docker-based deployment
- Manual nginx.conf configuration

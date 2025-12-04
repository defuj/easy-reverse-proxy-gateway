# Troubleshooting Guide 🔧

## Problem: "This site can't be reached" atau Connection Reset

### Symptom:
- Gateway container berjalan (port 80 & 443 terbuka)
- Browser menunjukkan "This site can't be reached"
- `curl http://localhost/` error: Connection reset by peer

### Root Cause:
Nginx gateway tidak bisa connect ke backend services (upstream servers).

---

## 🔍 Diagnosis

### Step 1: Check Gateway Status

```bash
# Pastikan container running
docker ps | grep reverse-proxy

# Check nginx logs
npm run logs
```

### Step 2: Validate nginx.conf

```bash
# Test syntax
npm run test

# atau
docker exec reverse-proxy-gateway nginx -t
```

### Step 3: Check Backend Services

```bash
# Test koneksi ke services
npm run check

# Manual test dari host
curl http://192.168.1.100:3000  # Ganti dengan IP service Anda
ping 192.168.1.100
```

### Step 4: Test dari Dalam Container

```bash
# Masuk ke container
docker exec -it reverse-proxy-gateway sh

# Test koneksi ke service
wget -O- http://192.168.1.100:3000
# atau
ping 192.168.1.100

# Exit
exit
```

---

## ✅ Solutions

### Solution 1: Services Belum Running

**Problem:** Backend services belum jalan.

**Fix:**
```bash
# Start semua backend services terlebih dahulu
# Contoh:
cd ~/frontend-app && npm run dev
cd ~/backend-api && npm start
```

**Validate:**
```bash
npm run check  # Harus semua ✅
```

---

### Solution 2: Services di Localhost (Same Machine)

**Problem:** Services berjalan di localhost tapi gateway di Docker tidak bisa akses.

**Fix 1: Use host.docker.internal (Mac/Windows)**

Edit `.env`:
```bash
# Ganti localhost dengan host.docker.internal
FRONTEND_HOST=host.docker.internal:3000
API_HOST=host.docker.internal:8080
```

**Fix 2: Use Host Network Mode**

Edit `docker-compose.yml`, uncomment baris:
```yaml
network_mode: "host"
```

Lalu restart:
```bash
npm restart
```

**Fix 3: Use Your Machine's IP**

Cek IP komputer Anda:
```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

Edit `.env`:
```bash
# Ganti localhost dengan IP komputer
FRONTEND_HOST=192.168.1.50:3000  # Ganti dengan IP Anda
API_HOST=192.168.1.50:8080
```

---

### Solution 3: Services di Device Lain (Different IP)

**Problem:** Services di device berbeda tapi tidak bisa diakses.

**Check 1: Network Connectivity**
```bash
# Test dari host machine
ping 192.168.1.100
curl http://192.168.1.100:3000
```

**Check 2: Firewall**
```bash
# Pastikan port tidak diblokir firewall
# Di device yang menjalankan service:

# Linux (Ubuntu/Debian)
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload

# Mac
# System Preferences > Security & Privacy > Firewall
```

**Check 3: Service Binding**

Pastikan service listen di `0.0.0.0` bukan `127.0.0.1`:

```bash
# BAD - hanya localhost
app.listen(3000, '127.0.0.1')

# GOOD - semua network interface
app.listen(3000, '0.0.0.0')
```

---

### Solution 4: Port Conflict

**Problem:** Port 80 sudah digunakan aplikasi lain.

**Check:**
```bash
# Mac/Linux
sudo lsof -i :80

# Atau
netstat -an | grep :80
```

**Fix 1: Stop Aplikasi yang Pakai Port 80**
```bash
# Cari PID
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>
```

**Fix 2: Ganti Port Gateway**

Edit `.env`:
```bash
NGINX_PORT=8080  # Ganti ke port lain
```

Regenerate & restart:
```bash
npm restart
```

Akses di:
```
http://localhost:8080/
```

---

## 🧪 Testing Scenarios

### Test 1: Simple Echo Server (untuk testing)

Buat simple server untuk testing:

**test-server.js:**
```javascript
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from test server!\n');
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Test server running on port 3000');
});
```

Run:
```bash
node test-server.js
```

Update `.env`:
```bash
TEST_HOST=host.docker.internal:3000
TEST_ROUTES=/
TEST_PRIORITY=1
```

Test:
```bash
npm run generate
npm restart
curl http://localhost/
```

---

### Test 2: Multiple Services

Terminal 1:
```bash
# Service 1 - Port 3001
python3 -m http.server 3001
```

Terminal 2:
```bash
# Service 2 - Port 3002
python3 -m http.server 3002
```

Update `.env`:
```bash
SERVICE1_HOST=host.docker.internal:3001
SERVICE1_ROUTES=/service1
SERVICE1_PRIORITY=1

SERVICE2_HOST=host.docker.internal:3002
SERVICE2_ROUTES=/service2
SERVICE2_PRIORITY=2
```

Test:
```bash
npm restart
curl http://localhost/service1
curl http://localhost/service2
```

---

## 🔍 Common Issues

### Issue: "502 Bad Gateway"

**Meaning:** Gateway bisa jalan tapi backend service mati/tidak respond.

**Fix:**
1. Start backend service
2. Check service logs
3. Verify service port dengan `npm run check`

---

### Issue: "504 Gateway Timeout"

**Meaning:** Backend service lambat respond (> 120 detik).

**Fix:** Edit `generate-config.js`, cari `proxy_read_timeout` dan perbesar:
```javascript
proxy_read_timeout 300s;  // 5 menit
```

---

### Issue: "403 Forbidden"

**Meaning:** Backend service reject request dari nginx.

**Fix:** Check backend service configuration, pastikan allow requests dari semua IP atau nginx IP.

---

## 📊 Debug Checklist

```
□ Backend services running? (npm run check)
□ Port tidak conflict? (lsof -i :80)
□ Network connectivity OK? (ping IP)
□ Firewall allow ports?
□ Service bind ke 0.0.0.0?
□ .env config benar? (HOST format IP:PORT)
□ nginx.conf generated? (npm run generate)
□ Container running? (docker ps)
□ Nginx syntax OK? (npm run test)
```

---

## 🆘 Quick Debug Commands

```bash
# Full diagnostic
npm run check && npm run test && docker logs reverse-proxy-gateway

# Test from container
docker exec -it reverse-proxy-gateway sh
wget -O- http://192.168.1.100:3000
exit

# View all logs
docker logs -f reverse-proxy-gateway

# Restart everything
npm stop && npm start

# Nuclear option (fresh start)
npm stop
docker system prune -f
npm start
```

---

## 💡 Pro Tips

### Tip 1: Use .env.demo for Local Testing

```bash
cp .env.demo .env
# Edit dengan localhost services
npm run dev
```

### Tip 2: Debug Mode

Tambahkan logging di `nginx.conf` (temporary):
```nginx
error_log /var/log/nginx/error.log debug;
```

### Tip 3: Network Debugging

```bash
# Check Docker network
docker network inspect reverse-proxy-tool_gateway-network

# Check container IP
docker inspect reverse-proxy-gateway | grep IPAddress
```

---

## 📞 Still Need Help?

1. Run full diagnostic:
   ```bash
   npm run check
   ```

2. Share output dari:
   ```bash
   docker logs reverse-proxy-gateway
   cat .env
   npm run test
   ```

3. Verify services running:
   ```bash
   # List all services yang seharusnya running
   curl http://IP:PORT
   ```

---

## ✅ Success Indicators

Gateway working correctly kalau:

```bash
# 1. Check returns all OK
npm run check
# ✅ All services connectable

# 2. Test returns success
npm run test
# ✅ nginx syntax OK

# 3. Curl returns content
curl http://localhost/
# ✅ Gets response from backend

# 4. Logs show no errors
docker logs reverse-proxy-gateway
# ✅ No error messages
```

**Gateway siap digunakan!** 🎉

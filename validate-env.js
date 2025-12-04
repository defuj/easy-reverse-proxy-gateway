#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const net = require('net');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const envContent = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function extractAppConfigs(env) {
  const apps = {};

  Object.keys(env).forEach(key => {
    const hostMatch = key.match(/^(.+)_HOST$/);
    if (hostMatch) {
      const appName = hostMatch[1];
      const host = env[key];

      if (!apps[appName]) {
        apps[appName] = {
          name: appName,
          host: host,
          routes: [],
          priority: 999
        };
      } else {
        apps[appName].host = host;
      }
    }

    const routesMatch = key.match(/^(.+)_ROUTES$/);
    if (routesMatch) {
      const appName = routesMatch[1];
      const routes = env[key].split(',').map(r => r.trim()).filter(r => r);

      if (!apps[appName]) {
        apps[appName] = {
          name: appName,
          host: '',
          routes: routes,
          priority: 999
        };
      } else {
        apps[appName].routes = routes;
      }
    }

    const priorityMatch = key.match(/^(.+)_PRIORITY$/);
    if (priorityMatch) {
      const appName = priorityMatch[1];
      const priority = parseInt(env[key]) || 999;

      if (!apps[appName]) {
        apps[appName] = {
          name: appName,
          host: '',
          routes: [],
          priority: priority
        };
      } else {
        apps[appName].priority = priority;
      }
    }
  });

  return Object.values(apps).filter(app => app.host);
}

function testConnection(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    const onError = () => {
      socket.destroy();
      resolve(false);
    };

    socket.setTimeout(timeout);
    socket.once('error', onError);
    socket.once('timeout', onError);

    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

async function main() {
  console.log('🔍 Validating .env configuration...\n');

  const envPath = path.join(__dirname, '.env');
  const env = parseEnvFile(envPath);

  if (!env) {
    console.error('❌ File .env tidak ditemukan!');
    console.log('💡 Copy .env.example terlebih dahulu:');
    console.log('   cp .env.example .env\n');
    process.exit(1);
  }

  const apps = extractAppConfigs(env);

  if (apps.length === 0) {
    console.error('❌ Tidak ada konfigurasi aplikasi ditemukan!');
    console.log('💡 Tambahkan minimal satu app dengan format:');
    console.log('   NAMA_APP_HOST=192.168.1.100:3000\n');
    process.exit(1);
  }

  console.log(`✅ Ditemukan ${apps.length} aplikasi\n`);

  let hasError = false;
  const warnings = [];

  // Validate each app
  for (const app of apps) {
    console.log(`📦 ${app.name}`);
    
    // Validate host format
    const hostMatch = app.host.match(/^(.+):(\d+)$/);
    if (!hostMatch) {
      console.log(`   ❌ Format host salah: ${app.host}`);
      console.log(`      Format yang benar: IP:PORT (contoh: 192.168.1.100:3000)`);
      hasError = true;
      continue;
    }

    const [, hostname, port] = hostMatch;
    console.log(`   Host: ${hostname}:${port}`);
    console.log(`   Routes: ${app.routes.length > 0 ? app.routes.join(', ') : '(catch-all)'}`);
    console.log(`   Priority: ${app.priority}`);

    // Test connection
    process.stdout.write('   Testing connection... ');
    const isConnectable = await testConnection(hostname, parseInt(port));
    
    if (isConnectable) {
      console.log('✅ OK');
    } else {
      console.log('⚠️  Cannot connect');
      warnings.push(`${app.name}: Cannot connect to ${hostname}:${port}`);
    }

    console.log('');
  }

  // Check for route conflicts
  console.log('🔍 Checking route conflicts...');
  const routeMap = new Map();
  
  apps.forEach(app => {
    app.routes.forEach(route => {
      if (routeMap.has(route)) {
        const existing = routeMap.get(route);
        if (app.priority < existing.priority) {
          console.log(`   ℹ️  Route ${route}: ${app.name} (priority ${app.priority}) will override ${existing.name} (priority ${existing.priority})`);
        } else {
          console.log(`   ℹ️  Route ${route}: ${existing.name} (priority ${existing.priority}) will override ${app.name} (priority ${app.priority})`);
        }
      } else {
        routeMap.set(route, app);
      }
    });
  });

  // Check for default app
  const defaultApps = apps.filter(app => app.routes.length === 0);
  if (defaultApps.length === 0) {
    console.log('\n⚠️  Warning: Tidak ada default app (catch-all)');
    console.log('   App dengan priority terendah akan menjadi default');
  } else if (defaultApps.length > 1) {
    console.log('\n⚠️  Warning: Lebih dari satu default app');
    console.log('   App dengan priority terendah yang akan aktif');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasError) {
    console.log('❌ Validation FAILED - Ada error yang harus diperbaiki\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  Validation completed with WARNINGS:\n');
    warnings.forEach(w => console.log(`   • ${w}`));
    console.log('\n💡 Service mungkin belum running atau tidak accessible');
    console.log('   Pastikan service sudah berjalan sebelum start gateway\n');
  } else {
    console.log('✅ Validation PASSED - Semua konfigurasi valid!\n');
  }

  console.log('📝 Next steps:');
  console.log('   npm run dev      # Start gateway dengan logs');
  console.log('   npm start        # Start gateway di background');
  console.log('   npm run generate # Generate nginx.conf saja\n');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

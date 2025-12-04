#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fungsi untuk membaca file .env
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ File .env tidak ditemukan!');
    console.log('💡 Silakan buat file .env berdasarkan .env.example');
    process.exit(1);
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

// Fungsi untuk ekstrak konfigurasi app dari env
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

// Fungsi untuk generate upstream blocks
function generateUpstreams(apps) {
  return apps.map(app => {
    const upstreamName = app.name.toLowerCase().replace(/_/g, '_');
    return `    # ${app.name}
    upstream ${upstreamName} {
        server ${app.host};
    }`;
  }).join('\n\n');
}

// Fungsi untuk generate location blocks
function generateLocations(apps, env) {
  // Sort apps berdasarkan priority (lower number = higher priority)
  const sortedApps = [...apps].sort((a, b) => a.priority - b.priority);

  const locations = [];
  const pathRewrite = env.ENABLE_PATH_REWRITE === 'true';

  sortedApps.forEach(app => {
    const upstreamName = app.name.toLowerCase().replace(/_/g, '_');

    if (app.routes.length > 0) {
      app.routes.forEach(route => {
        const cleanRoute = route.startsWith('/') ? route : `/${route}`;
        // Only use exact match for root path '/'
        const isExact = cleanRoute === '/';
        
        if (isExact) {
          // Root path - exact match, no rewrite
          locations.push(`
        # ${app.name} - ${cleanRoute}
        location = ${cleanRoute} {
            proxy_pass http://${upstreamName};
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffers 16 512k;
            proxy_buffer_size 512k;
            proxy_busy_buffers_size 512k;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }`);
        } else {
          // Subpath - dengan trailing slash untuk proper matching
          const routeWithSlash = cleanRoute.endsWith('/') ? cleanRoute : `${cleanRoute}/`;
          
          if (pathRewrite) {
            // Path rewrite mode: strip base path dan rewrite redirect
            locations.push(`
        # ${app.name} - ${cleanRoute}
        location ${routeWithSlash} {
            # Strip base path (${cleanRoute})
            rewrite ^${cleanRoute}(/|$)(.*) /$2 break;
            
            proxy_pass http://${upstreamName};
            
            # Rewrite Location header untuk redirect
            proxy_redirect ~^(https?://[^/]+)(/.*)?$ $1${cleanRoute}$2;
            proxy_redirect / ${cleanRoute}/;
            
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Headers untuk backend tahu base path
            proxy_set_header X-Forwarded-Prefix ${cleanRoute};
            proxy_set_header X-Script-Name ${cleanRoute};
            
            proxy_buffers 16 512k;
            proxy_buffer_size 512k;
            proxy_busy_buffers_size 512k;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }`);
          } else {
            // No path rewrite - forward as-is (backend must handle subpath)
            locations.push(`
        # ${app.name} - ${cleanRoute}
        location ${routeWithSlash} {
            proxy_pass http://${upstreamName};
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffers 16 512k;
            proxy_buffer_size 512k;
            proxy_busy_buffers_size 512k;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }`);
          }
        }
      });
    }
  });

  // Find default app (lowest priority or first without specific routes)
  const defaultApp = sortedApps.find(app => app.routes.length === 0) || sortedApps[sortedApps.length - 1];
  
  if (defaultApp) {
    const upstreamName = defaultApp.name.toLowerCase().replace(/_/g, '_');
    locations.push(`
        # Default catch-all (${defaultApp.name})
        location / {
            proxy_pass http://${upstreamName};
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffers 16 512k;
            proxy_buffer_size 512k;
            proxy_busy_buffers_size 512k;
            proxy_read_timeout 120s;
            proxy_send_timeout 120s;
        }`);
  }

  return locations.join('\n');
}

// Fungsi untuk generate nginx.conf
function generateNginxConfig(apps, env) {
  const serverName = env.SERVER_NAME || 'localhost';
  const port = env.NGINX_PORT || '80';
  const workerProcesses = env.WORKER_PROCESSES || 'auto';
  const workerConnections = env.WORKER_CONNECTIONS || '1024';

  const upstreams = generateUpstreams(apps);
  const locations = generateLocations(apps, env);

  return `# Auto-generated nginx configuration
# Generated at: ${new Date().toISOString()}
# DO NOT EDIT THIS FILE MANUALLY - Edit .env instead and run: npm run generate

user nginx;
worker_processes ${workerProcesses};

error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections ${workerConnections};
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    # Global proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;

${upstreams}

    server {
        listen ${port};
        server_name ${serverName};
${locations}
    }
}
`;
}

// Main function
function main() {
  console.log('🔧 Generating nginx configuration...\n');

  const envPath = path.join(__dirname, '.env');
  const env = parseEnvFile(envPath);

  const apps = extractAppConfigs(env);

  if (apps.length === 0) {
    console.error('❌ Tidak ada konfigurasi aplikasi ditemukan di .env');
    console.log('💡 Pastikan Anda menambahkan minimal satu app dengan format:');
    console.log('   NAMA_APP_HOST=192.168.1.100:3000');
    console.log('   NAMA_APP_ROUTES=/api,/admin');
    process.exit(1);
  }

  const pathRewriteEnabled = env.ENABLE_PATH_REWRITE === 'true';
  
  console.log('📦 Aplikasi yang ditemukan:');
  apps.forEach(app => {
    console.log(`   • ${app.name}`);
    console.log(`     Host: ${app.host}`);
    console.log(`     Routes: ${app.routes.length > 0 ? app.routes.join(', ') : 'default (catch-all)'}`);
    console.log(`     Priority: ${app.priority}`);
  });
  
  console.log(`\n🔧 Path Rewrite: ${pathRewriteEnabled ? '✅ ENABLED (akan strip base path & fix redirects)' : '❌ DISABLED (backend harus handle full path)'}`);

  const nginxConfig = generateNginxConfig(apps, env);
  const outputPath = path.join(__dirname, 'nginx.conf');

  fs.writeFileSync(outputPath, nginxConfig);

  console.log(`\n✅ nginx.conf berhasil di-generate!`);
  console.log(`📄 File location: ${outputPath}\n`);
}

main();

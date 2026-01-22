# API Gateway - Kong

Single entry point untuk semua backend services menggunakan Kong Gateway (DB-less mode).

## Architecture

```
Frontend (Port 5173)
    ↓
Kong Gateway (Port 3000) ← Public Entry Point
    ├─> Auth Service (Port 3001) - Not running yet
    ├─> Product Service (Port 3002) - Not running yet
    └─> Transaction Service (Port 3003) - Not running yet
```

## Features

- ✅ **DB-less Mode** - No database required, using declarative YAML config
- ✅ **Routing & Proxy** - Forward request ke service yang tepat
- ✅ **Security Headers** - Auto-inject `X-INTERNAL-KEY` ke semua service
- ✅ **Request ID** - Correlation ID untuk tracing
- ✅ **Health Checks** - Monitor service availability
- ✅ **Logging** - Centralized access & error logs

## Prerequisites

- Docker & Docker Compose installed
- Ports available: 3000 (Gateway), 8001 (Admin API)

## Quick Start

### 1. Start Kong Gateway

```bash
cd services/api-gateway
docker-compose up -d
```

### 2. Verify Services Running

```bash
# Check containers
docker-compose ps

# Check Kong health
curl http://localhost:3000

# Check Kong Admin API
curl http://localhost:8001
```

### 3. Stop Gateway

```bash
docker-compose down
```

### 4. Clean Up (Remove Data)

```bash
docker-compose down -v
```

## API Routes

### Public Routes (No Authentication)

| Method | Endpoint | Target Service | Description |
|--------|----------|----------------|-------------|
| POST | `/api/auth/register` | Auth Service | User registration |
| POST | `/api/auth/login` | Auth Service | User login |
| GET | `/api/products` | Product Service | List all products |
| GET | `/api/products/:id` | Product Service | Get product detail |

### Protected Routes (Require JWT Token)

| Method | Endpoint | Target Service | Required Role | Description |
|--------|----------|----------------|---------------|-------------|
| POST | `/api/products` | Product Service | ADMIN | Create product |
| PUT | `/api/products/:id` | Product Service | ADMIN | Update product |
| DELETE | `/api/products/:id` | Product Service | ADMIN | Delete product |
| POST | `/api/transactions` | Transaction Service | PEMBELI | Create transaction |
| GET | `/api/transactions` | Transaction Service | PEMBELI/ADMIN | List transactions |
| GET | `/api/transactions/:id` | Transaction Service | PEMBELI/ADMIN | Get transaction detail |
| POST | `/api/transactions/pay` | Transaction Service | ADMIN | Mark transaction as paid |

## Security Headers

Kong akan otomatis inject header berikut ke setiap request yang diteruskan ke backend services:

- `X-INTERNAL-KEY: supersecretkey123` - Security key untuk validasi internal request
- `X-Request-ID: <uuid>` - Correlation ID untuk tracing

## Configuration Files

- `docker-compose.yml` - Docker orchestration
- `kong.yml` - Declarative Kong configuration (routes, services, plugins)
- `.env` - Environment variables

## Testing

### Test Public Endpoint

```bash
# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","role":"PEMBELI"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Test Protected Endpoint (with JWT)

```bash
# Get products
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <your-jwt-token>"

# Create product (Admin only)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Buku Cetakan Data Agregat Penduduk","price":10000}'
```

## Troubleshooting

### Kong tidak bisa connect ke backend services

**Problem:** Error `host.docker.internal` not found

**Solution:** 
- Linux: Add `--add-host=host.docker.internal:host-gateway` ke docker-compose
- Atau ubah `host.docker.internal` jadi IP address host

### Port 3000 already in use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Reset Kong database

```bash
docker-compose down -v
docker-compose up -d
```

## Next Steps

1. ✅ API Gateway sudah jalan
2. ⏳ Build Auth Service (feat/backend-services branch)
3. ⏳ Build Product Service
4. ⏳ Build Transaction Service
5. ⏳ Implement JWT verification di Kong
6. ⏳ Implement RBAC middleware

## Monitoring

### Kong Admin API

```bash
# List all services
curl http://localhost:8001/services

# List all routes
curl http://localhost:8001/routes

# List all plugins
curl http://localhost:8001/plugins

# Check Kong status
curl http://localhost:8001/status
```

### Logs

```bash
# Real-time logs
docker-compose logs -f kong

# Last 100 lines
docker-compose logs --tail=100 kong
```

## Environment Variables

Edit `.env` file untuk mengubah konfigurasi:

```env
INTERNAL_SECRET_KEY=supersecretkey123  # Ganti dengan key yang lebih aman
JWT_SECRET=your-jwt-secret-key-here    # Akan dipakai untuk JWT verification
```

⚠️ **IMPORTANT:** Jangan commit `.env` ke git! File ini sudah masuk `.gitignore`.

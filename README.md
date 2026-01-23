# Full Stack E-Commerce Microservices

Aplikasi e-commerce lengkap dengan arsitektur microservices. Frontend pakai React + TypeScript, backend pakai Node.js + Express dengan 3 microservices terpisah, plus Kong sebagai API Gateway.

## 📋 Daftar Isi

- [Arsitektur](#-arsitektur)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Dokumentasi API](#-dokumentasi-api)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

## 🏗️ Arsitektur

```                    ┌───────────────────┐
                       │  React Frontend   │
                       │    Port: 5173     │
                       └─────────┬─────────┘
                                 │
                                 ▼
                       ┌───────────────────┐
                       │   Kong Gateway    │
                       │    Port: 3000     │
                       └─────────┬─────────┘
                                 │
      ┌──────────────┬───────────┴───────────┬──────────────┐
      │              │                       │              │
      ▼              ▼                       ▼              ▼
┌────────────┐ ┌────────────┐          ┌────────────┐ ┌────────────┐
│    Auth    │ │    RBAC    │          │  Product   │ │Transaction │
│   Service  │ │   Service  │          │  Service   │ │  Service   │
│ Port: 3001 │ │ Port: 3004 │          │ Port: 3002 │ │ Port: 3003 │
└─────┬──────┘ └─────┬──────┘          └─────┬──────┘ └─────┬──────┘
      │              │                       │              │
      ▼              ▼                       ▼              ▼
┌────────────┐ ┌────────────┐          ┌────────────┐ ┌────────────┐
│   MySQL    │ │   MySQL    │          │   MySQL    │ │   MySQL    │
│  db_auth   │ │  db_auth   │          │ db_product │ │  db_trans  │
│ Port: 3307 │ │ Port: 3307 │          │ Port: 3308 │ │ Port: 3309 │
└────────────┘ └────────────┘          └────────────┘ └────────────┘
```

### Isolasi Microservices

- **Database Per Service**: Setiap service punya database MySQL sendiri-sendiri (ga share database)
- **Service-to-Service (S2S)**: Komunikasi antar service lewat HTTP dengan header `X-INTERNAL-KEY` untuk keamanan
- **API Gateway**: Kong jadi pintu masuk tunggal, handle routing dan security
- **Role-Based Access**: Ada 2 role user - ADMIN (bisa manage semua) dan PEMBELI (bisa checkout aja)

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (bundler)
- Tailwind CSS
- React Router DOM

### Backend Services
- Node.js 20 + Express.js
- TypeScript
- MySQL 8.0 (mysql2 driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- axios (HTTP client for S2S)

### Infrastructure
- Docker & Docker Compose
- Kong Gateway 3.5 (DB-less mode)
- YAML declarative configuration

## 📦 Prerequisites

Yang perlu diinstall dulu:

- **Docker** 20.10+ (wajib!)
- **Docker Compose** 2.0+ (wajib!)
- **Node.js** 20+ (kalau mau development lokal)
- **npm** atau **yarn** (kalau mau development lokal)

Cek apakah udah terinstall:
```bash
docker --version
docker-compose --version
node --version
npm --version
```

## 🚀 Quick Start

Ada 3 cara jalanin aplikasi ini, pilih yang paling cocok:

### Option 1: Full Docker (Paling Gampang! ⭐ Recommended)

Ini cara paling mudah - tinggal satu command semua jalan:

```bash
# Masuk ke folder services
cd services

# Jalankan semua (Kong + 3 Services + 3 MySQL)
docker-compose -f docker-compose.full.yml up --build

# Tunggu sampai semua container jalan
# Database migration otomatis dijalankan
```

**Setelah jalan, bisa akses:**
- 🌐 **Kong API Gateway**: http://localhost:3000 (pintu masuk utama)
- 🔐 **Auth Service**: http://localhost:3001
  - Swagger UI: http://localhost:3001/api-docs
- 📦 **Product Service**: http://localhost:3002
  - Swagger UI: http://localhost:3002/api-docs
- 💳 **Transaction Service**: http://localhost:3003
  - Swagger UI: http://localhost:3003/api-docs
- 🗄️ **MySQL Databases**: 
  - Auth DB: localhost:3307
  - Product DB: localhost:3308
  - Transaction DB: localhost:3309

**Test API langsung:**
```bash
# Cek health semua services
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Atau langsung ke E2E test
cd ..
./test-e2e.sh
```

---

### Option 2: Hybrid Mode (Backend Docker, Frontend Lokal)

Cocok kalau cuma mau develop frontend aja:

```bash
# Terminal 1: Start semua backend
cd services
docker-compose -f docker-compose.full.yml up --build

# Terminal 2: Start frontend (di folder lain)
cd frontend
npm install
npm run dev
```

Frontend akan jalan di http://localhost:5173

---

### Option 3: Development Lokal (Tanpa Docker)

Untuk development yang lebih fleksibel (bisa edit code service langsung):

**Step 1: Start MySQL Databases**
```bash
cd services
docker-compose up mysql-auth mysql-product mysql-transaction -d
```

**Step 2: Setup Auth Service**
```bash
cd auth-service
npm install
cp .env.example .env

# Edit .env - ganti ini:
# DB_HOST=localhost (karena MySQL di Docker, tapi service di luar)
# DB_PORT=3307
```

**Step 3: Run Migration**
```bash
npm run db:migrate
```

**Step 4: Start Service (Hot Reload)**
```bash
npm run dev
# Service jalan di port 3001
```

**Step 5: Ulangi untuk Product & Transaction Service**
```bash
# Product Service
cd ../product-service
npm install
cp .env.example .env
# Edit .env: DB_HOST=localhost, DB_PORT=3308
npm run db:migrate
npm run dev  # Port 3002

# Transaction Service
cd ../transaction-service
npm install
cp .env.example .env
# Edit .env: DB_HOST=localhost, DB_PORT=3309, PRODUCT_SERVICE_URL=http://localhost:3002
npm run db:migrate
npm run dev  # Port 3003
```

**Step 6: Start Kong Gateway**
```bash
cd ../api-gateway
docker-compose up -d
# Kong jalan di port 3000
```

**Step 7: (Opsional) Start Frontend**
```bash
cd ../../frontend
npm install
npm run dev
# Frontend jalan di port 5173
```

## 📚 Dokumentasi Services

Dokumentasi lengkap ada di [services/README.md](services/README.md). Berikut ringkasannya:

### 1. 🔐 Auth Service (Port 3001)

**Fungsi:** Registrasi user dan login (JWT authentication)

**Endpoints:**
| Method | Path | Deskripsi | Auth Required |
|--------|------|-----------|---------------|
| POST | `/api/auth/register` | Daftar user baru (ADMIN/PEMBELI) | ❌ No |
| POST | `/api/auth/login` | Login dan dapat JWT token | ❌ No |
| GET | `/health` | Health check service | ❌ No |

**Swagger UI:** 📖 http://localhost:3001/api-docs

**Database:** `db_auth` - Table: `users` (id, email, password, role, created_at)

**Environment Variables:**
```env
DB_HOST=mysql-auth
DB_PORT=3306
JWT_SECRET=your-jwt-secret-key-here
INTERNAL_SECRET_KEY=supersecretkey123
PORT=3001
```

---

### 2. 📦 Product Service (Port 3002)

**Fungsi:** CRUD management produk

**Endpoints:**
| Method | Path | Deskripsi | Auth Required |
|--------|------|-----------|---------------|
| GET | `/api/products` | List semua produk | ❌ Public |
| GET | `/api/products/:id` | Detail produk by ID | ✅ Internal Key |
| POST | `/api/products` | Buat produk baru | ✅ Internal Key + Admin |
| PUT | `/api/products/:id` | Update produk | ✅ Internal Key + Admin |
| DELETE | `/api/products/:id` | Hapus produk | ✅ Internal Key + Admin |
| GET | `/health` | Health check service | ❌ No |

**Swagger UI:** 📖 http://localhost:3002/api-docs

**Database:** `db_product` - Table: `products` (id, name, price, created_at, updated_at)

**Catatan:** 
- Endpoint GET `/api/products` adalah PUBLIC (bisa diakses siapa aja)
- Endpoint lainnya butuh `X-INTERNAL-KEY` header (Kong auto-inject)

---

### 3. 💳 Transaction Service (Port 3003)

**Fungsi:** Checkout dan payment processing

**Endpoints:**
| Method | Path | Deskripsi | Auth Required |
|--------|------|-----------|---------------|
| POST | `/api/transactions` | Buat transaksi (checkout) | ✅ JWT (User) |
| GET | `/api/transactions` | List transaksi user | ✅ JWT (User) |
| GET | `/api/transactions/:id` | Detail transaksi | ✅ JWT (User) |
| POST | `/api/transactions/pay` | Proses pembayaran | ✅ JWT (Admin) |
| GET | `/health` | Health check service | ❌ No |

**Swagger UI:** 📖 http://localhost:3003/api-docs

**Database:** `db_transaction` 
- Table: `transactions` (id, kode_billing, user_id, total_amount, status, created_at, expired_at)
- Table: `transaction_items` (id, transaction_id, product_id, product_name, price_per_item, quantity)

**Fitur Khusus:**
- 🎫 Generate kode billing otomatis: `TRX-xxxx`
- ⏰ Transaksi expire dalam 24 jam
- 📸 Snapshot harga produk (harga ga berubah meski produk diupdate)
- 🔗 S2S call ke Product Service untuk validasi

---

### 4. 🌐 Kong API Gateway (Port 3000)

**Fungsi:** Pintu masuk tunggal ke semua backend services

**Kong Admin API:** http://localhost:8001

**Routes Available via Kong:**
| Kong Route | Forwarded To | Internal Key? |
|------------|--------------|---------------|
| POST `/api/auth/register` | Auth Service | ❌ |
| POST `/api/auth/login` | Auth Service | ❌ |
| GET `/api/products` | Product Service | ❌ |
| POST `/api/products` | Product Service | ✅ Auto-inject |
| PUT `/api/products/:id` | Product Service | ✅ Auto-inject |
| DELETE `/api/products/:id` | Product Service | ✅ Auto-inject |
| POST `/api/transactions` | Transaction Service | ✅ Auto-inject |
| GET `/api/transactions` | Transaction Service | ✅ Auto-inject |
| POST `/api/transactions/pay` | Transaction Service | ✅ Auto-inject |

**Catatan:** Kong auto-inject `X-INTERNAL-KEY: supersecretkey123` ke routes yang butuh internal authentication.

## 📖 Dokumentasi API

### Swagger UI (Interactive API Docs) ⭐

Cara paling gampang eksplorasi API adalah lewat Swagger UI. Buka di browser:

- **Auth Service:** http://localhost:3001/api-docs
- **Product Service:** http://localhost:3002/api-docs
- **Transaction Service:** http://localhost:3003/api-docs

Di Swagger UI kamu bisa:
- ✅ Lihat semua endpoint yang tersedia
- ✅ Lihat request body & response format
- ✅ Test langsung dari browser (Try it out!)
- ✅ Download OpenAPI spec (YAML)

### File OpenAPI Spec (YAML)

Kalau mau import ke Postman atau tools lain:
- [services/auth-service/swagger.yaml](services/auth-service/swagger.yaml)
- [services/product-service/swagger.yaml](services/product-service/swagger.yaml)
- [services/transaction-service/swagger.yaml](services/transaction-service/swagger.yaml)

## Recent Notes (2026-01-23)

- Added RBAC service (internal user management) running on port `3004`. RBAC internal endpoints require the `X-INTERNAL-KEY` header to match the environment `INTERNAL_SECRET_KEY` (set in docker-compose). See [services/rbac-service](services/rbac-service) for details.
- RBAC now normalizes `status` values server-side (accepts `"ACTIVE"`/`"INACTIVE"`, booleans or numbers) to prevent SQL errors; frontend `PUT /users/:id` was updated to send numeric `status` (1 = active, 0 = inactive).
- If you modify the Kong declarative config (`services/api-gateway/kong.yml`), remember Kong is running in DB-less mode: update the file and restart the Kong container so changes take effect:

```bash
# from repository root
cd services
docker-compose -f docker-compose.full.yml up -d --build kong
```

- Avoid editing Kong plugin entities at runtime when Kong is DB-less; prefer editing `services/api-gateway/kong.yml` and restarting the container.

### Test Manual via curl

Semua request ke API **harus lewat Kong Gateway** di port 3000:

#### 1. Register Admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "role": "ADMIN"
  }'

# Response:
# {"message":"User registered successfully","userId":1}
```

#### 2. Login Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'

# Response:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{...}}
# Save token as ADMIN_TOKEN
```

#### 3. Create Product (Admin Only)
```bash
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Pemadanan Data dan Dokumen Kependudukan",
    "price": 5000
  }'

# Response:
# {"message":"Product created successfully","productId":1}
```

#### 4. Get All Products (Public)
```bash
curl http://localhost:3000/api/products

# Response:
# [{"id":1,"name":"Pemadanan Data dan Dokumen Kependudukan","price":"5000.00",...}]
```

#### 5. Register User (Pembeli)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "user123",
    "role": "PEMBELI"
  }'
```

#### 6. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "user123"
  }'

# Save token as USER_TOKEN
```

#### 7. Create Transaction (Checkout)
```bash
USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "items": [
      {"productId": 1, "qty": 2}
    ]
  }'

# Response:
# {
#   "message": "Transaction created successfully",
#   "transaction": {
#     "id": 1,
#     "kode_billing": "TRX-3730",
#     "total_amount": 30000000,
#     "status": "BELUM_DIBAYAR",
#     "expired_at": "2026-01-23T09:19:53.447Z"
#   }
# }
```

#### 8. Get User Transactions
```bash
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $USER_TOKEN"

# Response:
# [{"id":1,"kode_billing":"TRX-3730","total_amount":"30000000.00","status":"BELUM_DIBAYAR",...}]
```

#### 9. Payment (Admin Only)
```bash
curl -X POST http://localhost:3000/api/transactions/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "kode_billing": "TRX-3730"
  }'

# Response:
# {"message":"Payment successful","kode_billing":"TRX-3730"}
```

#### 10. Verify Payment
```bash
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $USER_TOKEN"

# Response shows status: "SUDAH_DIBAYAR"
```

## 🧪 Testing

### Full E2E Test Script

```bash
#!/bin/bash

echo "=== E2E Testing ==="

# 1. Register Admin
echo "1. Registering admin..."
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","role":"ADMIN"}'

# 2. Login Admin
echo -e "\n2. Login admin..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')
echo "Admin Token: $ADMIN_TOKEN"

# 3. Create Product
echo -e "\n3. Creating product..."
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Verifikasi Data Kependudukan Berbasis Web","price":3500}'

# 4. Register User
echo -e "\n4. Registering user..."
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"user123","role":"PEMBELI"}'

# 5. Login User
echo -e "\n5. Login user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"user123"}')
USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.token')
echo "User Token: $USER_TOKEN"

# 6. Checkout
echo -e "\n6. Creating transaction..."
TRX_RESPONSE=$(curl -s -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"items":[{"productId":1,"qty":2}]}')
KODE_BILLING=$(echo $TRX_RESPONSE | jq -r '.transaction.kode_billing')
echo "Billing Code: $KODE_BILLING"

# 7. Payment
echo -e "\n7. Processing payment..."
curl -X POST http://localhost:3000/api/transactions/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"kode_billing\":\"$KODE_BILLING\"}"

# 8. Verify
echo -e "\n8. Verifying transaction..."
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $USER_TOKEN"

echo -e "\n\n=== Test Complete ==="
```

Simpan sebagai `test-e2e.sh` dan jalankan:
```bash
chmod +x test-e2e.sh
./test-e2e.sh
```

## 🐛 Troubleshooting

### Container Issues

**Problem**: Container tidak start atau unhealthy
```bash
# Check container status
docker-compose -f docker-compose.full.yml ps

# Check logs
docker-compose -f docker-compose.full.yml logs kong
docker-compose -f docker-compose.full.yml logs auth-service
docker-compose -f docker-compose.full.yml logs mysql-auth

# Restart specific service
docker-compose -f docker-compose.full.yml restart kong

# Rebuild without cache
docker-compose -f docker-compose.full.yml up --build --force-recreate
```

### Database Connection Errors

**Problem**: `ECONNREFUSED` or `ER_ACCESS_DENIED`

```bash
# Check MySQL is healthy
docker-compose -f docker-compose.full.yml ps mysql-auth

# Connect to MySQL manually
docker exec -it mysql-auth mysql -uroot -prootpassword db_auth

# Check tables
SHOW TABLES;

# Re-run migration
docker-compose -f docker-compose.full.yml exec auth-service npm run migrate
```

### Kong Gateway Issues

**Problem**: Routes tidak berfungsi atau 404

```bash
# Check Kong health
curl http://localhost:8001/status

# List routes
curl http://localhost:8001/routes

# List services
curl http://localhost:8001/services

# Check Kong logs
docker-compose -f docker-compose.full.yml logs kong

# Reload Kong config
docker-compose -f docker-compose.full.yml restart kong
```

### Service Communication Errors

**Problem**: `X-INTERNAL-KEY` missing atau S2S call failed

```bash
# Test direct to service (bypass Kong)
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Test with internal key
curl http://localhost:3002/api/products/1 \
  -H "X-INTERNAL-KEY: supersecretkey123"

# Check Docker network
docker network inspect services_app-network
```

### JWT Token Issues

**Problem**: `Invalid token` atau `jwt malformed`

```bash
# Decode JWT (online tool: jwt.io)
# Check expiration: token valid 24 jam

# Generate new token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Port Already in Use

**Problem**: `port is already allocated`

```bash
# Find process using port
lsof -i :3000
# or
sudo netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.full.yml
```

## 🔐 Security Notes

- **JWT Secret**: Ganti `JWT_SECRET` di production dengan random string kuat
- **Internal Key**: Ganti `INTERNAL_SECRET_KEY` dengan UUID atau random string
- **MySQL Password**: Ganti `MYSQL_ROOT_PASSWORD` di production
- **CORS**: Configure CORS di production untuk whitelist frontend domain
- **HTTPS**: Gunakan HTTPS di production (Kong SSL/TLS termination)
- **Rate Limiting**: Tambahkan Kong rate-limit plugin untuk anti-abuse

## 📝 Development Notes

### Adding New Service

1. Create service folder di `services/`
2. Tambahkan Dockerfile
3. Update `docker-compose.full.yml`
4. Update `kong.yml` dengan routes baru
5. Create Swagger documentation

### Database Migrations

Migration otomatis run saat container start. Untuk manual migration:

```bash
docker-compose -f docker-compose.full.yml exec auth-service npm run migrate
docker-compose -f docker-compose.full.yml exec product-service npm run migrate
docker-compose -f docker-compose.full.yml exec transaction-service npm run migrate
```

### Environment Variables

Semua `.env` files sudah disupport. Untuk production:
- Copy `.env.example` ke `.env`
- Update values sesuai environment
- **JANGAN commit .env files ke git**

## 📄 License

MIT License - Free to use for personal and commercial projects

## 👥 Contributors

- Initial development by [Your Team Name]

## 📞 Support

Untuk issues dan questions:
- GitHub Issues: [link-to-issues]
- Email: support@yourapp.com
- Slack: [link-to-slack]

---

**Last Updated**: January 22, 2026  
**Version**: 1.0.0

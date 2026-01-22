# Backend Microservices

Ini adalah backend dari aplikasi e-commerce kita yang dibangun dengan arsitektur microservices. Ada 3 service utama (Auth, Product, Transaction) plus 1 API Gateway (Kong) sebagai pintu masuk tunggal.

## 🏗️ Arsitektur

```
Kong Gateway (Port 3000) ← Pintu Masuk Tunggal
    │
    ├─> Auth Service (3001)        → MySQL db_auth (3307)
    ├─> Product Service (3002)     → MySQL db_product (3308)
    └─> Transaction Service (3003) → MySQL db_transaction (3309)
```

**Prinsip Design:**
- Setiap service punya database sendiri (database isolation)
- Service berkomunikasi via HTTP dengan header `X-INTERNAL-KEY` untuk keamanan
- Kong Gateway handle routing, security, dan sebagai API gateway

## 📦 Daftar Services

### 1. Auth Service (Port 3001)

**Fungsi:** Handle registrasi user dan login (JWT authentication)

**Database:** `db_auth` di MySQL port 3307

**Endpoints:**
- `POST /api/auth/register` - Daftar user baru (ADMIN atau PEMBELI)
- `POST /api/auth/login` - Login dan dapat JWT token
- `GET /health` - Health check

**Swagger UI:** http://localhost:3001/api-docs

---

### 2. Product Service (Port 3002)

**Fungsi:** Kelola data produk (CRUD operations)

**Database:** `db_product` di MySQL port 3308

**Endpoints:**
- `GET /api/products` - Lihat semua produk (PUBLIC, ga perlu auth)
- `GET /api/products/:id` - Ambil detail produk by ID (INTERNAL only)
- `POST /api/products` - Bikin produk baru (ADMIN only + internal key)
- `PUT /api/products/:id` - Update produk (ADMIN only + internal key)
- `DELETE /api/products/:id` - Hapus produk (ADMIN only + internal key)
- `GET /health` - Health check

**Swagger UI:** http://localhost:3002/api-docs

---

### 3. Transaction Service (Port 3003)

**Fungsi:** Handle checkout dan pembayaran

**Database:** `db_transaction` di MySQL port 3309

**Endpoints:**
- `POST /api/transactions` - Buat transaksi baru / checkout (USER dengan JWT)
- `GET /api/transactions` - Lihat semua transaksi user (USER dengan JWT)
- `GET /api/transactions/:id` - Detail transaksi by ID (USER dengan JWT)
- `POST /api/transactions/pay` - Proses pembayaran (ADMIN only dengan JWT)
- `GET /health` - Health check

**Fitur Khusus:**
- Generate kode billing otomatis (format: `TRX-xxxx`)
- Transaksi expire dalam 24 jam
- Snapshot harga produk (harga tetap meski produk berubah)
- Komunikasi S2S ke Product Service untuk validasi produk

**Swagger UI:** http://localhost:3003/api-docs

---

### 4. Kong API Gateway (Port 3000)

**Fungsi:** Single entry point untuk semua request dari frontend/client

**Key Features:**
- Route semua request `/api/*` ke service yang sesuai
- Auto-inject header `X-INTERNAL-KEY` ke protected endpoints
- Preserve full path (strip_path: false)
- Service discovery via Docker network

**Admin API:** http://localhost:8001

**Routes yang Available:**
- `POST /api/auth/register` → Auth Service
- `POST /api/auth/login` → Auth Service
- `GET /api/products` → Product Service
- `POST /api/products` → Product Service (dengan internal key)
- `POST /api/transactions` → Transaction Service (dengan internal key)
- `POST /api/transactions/pay` → Transaction Service (dengan internal key)
- Dan lain-lain...

## 🚀 Cara Jalankan

### Option 1: Semua dalam Docker (Paling Gampang)

Jalankan semua service sekaligus dengan Docker Compose:

```bash
cd services
docker-compose -f docker-compose.full.yml up --build
```

Tunggu sampai semua container jalan. Database migration otomatis dijalankan.

**Services yang tersedia:**
- Kong Gateway: http://localhost:3000
- Auth Service: http://localhost:3001 (Swagger: http://localhost:3001/api-docs)
- Product Service: http://localhost:3002 (Swagger: http://localhost:3002/api-docs)
- Transaction Service: http://localhost:3003 (Swagger: http://localhost:3003/api-docs)

---

### Option 2: Development Lokal (Buat Development)

Kalau mau develop service tertentu tanpa Docker:

**1. Start MySQL databases dulu:**
```bash
cd services
docker-compose up mysql-auth mysql-product mysql-transaction -d
```

**2. Install dependencies untuk service yang mau di-develop:**
```bash
cd auth-service
npm install
```

**3. Setup environment variables:**
```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
# DB_HOST=localhost (karena jalan di luar Docker)
# DB_PORT=3307 (untuk auth), 3308 (product), 3309 (transaction)
```

**4. Jalankan migration:**
```bash
npm run db:migrate
```

**5. Start service dalam development mode:**
```bash
npm run dev
```

Service akan jalan dengan hot-reload (auto restart kalau ada perubahan code).

**6. Ulangi step 2-5 untuk service lain yang mau di-develop.**

**7. Start Kong Gateway:**
```bash
cd api-gateway
docker-compose up -d
```

---

### Option 3: Hybrid (Backend di Docker, Frontend Lokal)

Ini cocok kalau cuma mau develop frontend:

```bash
# Start semua backend services
cd services
docker-compose -f docker-compose.full.yml up --build

# Di terminal lain, start frontend
cd ../frontend
npm install
npm run dev
```

## 🧪 Testing

### Test Manual via curl

**Register Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","role":"ADMIN"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

Simpan token yang didapat, lalu:

**Create Product:**
```bash
TOKEN="paste-token-disini"

curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Laptop ASUS ROG","price":15000000,"stock":10}'
```

### Test Otomatis dengan Script

Ada test script lengkap di root folder:

```bash
cd ..
./test-e2e.sh
```

Script ini akan otomatis test full flow: register → login → create product → checkout → payment

## 🛠️ Development Tips

### Lihat Logs Container

```bash
# Semua logs
docker-compose -f docker-compose.full.yml logs -f

# Logs service tertentu
docker-compose -f docker-compose.full.yml logs -f auth-service
docker-compose -f docker-compose.full.yml logs -f kong
```

### Restart Service Tertentu

```bash
docker-compose -f docker-compose.full.yml restart auth-service
```

### Rebuild Service yang Udah Berubah

```bash
docker-compose -f docker-compose.full.yml up -d --build auth-service
```

### Akses MySQL Database

```bash
# Auth database
docker exec -it mysql-auth mysql -uroot -prootpassword db_auth

# Product database
docker exec -it mysql-product mysql -uroot -prootpassword db_product

# Transaction database
docker exec -it mysql-transaction mysql -uroot -prootpassword db_transaction
```

### Jalankan Migration Manual

```bash
docker-compose -f docker-compose.full.yml exec auth-service npm run db:migrate
docker-compose -f docker-compose.full.yml exec product-service npm run db:migrate
docker-compose -f docker-compose.full.yml exec transaction-service npm run db:migrate
```

## 📚 Dokumentasi API Lengkap

Setiap service punya Swagger UI yang bisa dibuka di browser:

- **Auth Service:** http://localhost:3001/api-docs
- **Product Service:** http://localhost:3002/api-docs
- **Transaction Service:** http://localhost:3003/api-docs

Di situ ada dokumentasi lengkap semua endpoint, request body, response, dan bisa langsung test dari browser!

Alternatif, bisa juga liat file YAML-nya:
- `auth-service/swagger.yaml`
- `product-service/swagger.yaml`
- `transaction-service/swagger.yaml`

## 🔧 Troubleshooting

**Service restart terus-terusan:**
- Cek logs: `docker-compose -f docker-compose.full.yml logs [service-name]`
- Biasanya karena database belum ready atau environment variable salah

**Kong bilang "Invalid response from upstream":**
- Pastikan service yang dituju udah jalan
- Test langsung ke service (bypass Kong): `curl http://localhost:3001/health`

**Database connection error:**
- Pastikan MySQL container udah healthy: `docker-compose -f docker-compose.full.yml ps`
- Tunggu beberapa detik sampai healthcheck pass

**Port udah dipakai:**
```bash
# Cek port yang dipakai
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

## 📁 Struktur Folder

```
services/
├── api-gateway/          # Kong Gateway config
│   ├── docker-compose.yml
│   └── kong.yml         # Declarative config
│
├── auth-service/        # Authentication service
│   ├── src/
│   ├── swagger.yaml
│   ├── Dockerfile
│   └── package.json
│
├── product-service/     # Product management
│   ├── src/
│   ├── swagger.yaml
│   ├── Dockerfile
│   └── package.json
│
├── transaction-service/ # Transaction & payment
│   ├── src/
│   ├── swagger.yaml
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      # MySQL databases only
└── docker-compose.full.yml # All services + databases
```

## 🔐 Environment Variables

Setiap service butuh file `.env`. Contoh ada di `.env.example`.

**Auth Service (.env):**
```env
DB_HOST=mysql-auth          # atau localhost kalau jalan di luar Docker
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=db_auth
DB_PORT=3306                # internal Docker port
JWT_SECRET=your-secret-key
INTERNAL_SECRET_KEY=supersecretkey123
PORT=3001
```

**Product Service (.env):**
```env
DB_HOST=mysql-product
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=db_product
DB_PORT=3306
INTERNAL_SECRET_KEY=supersecretkey123
PORT=3002
```

**Transaction Service (.env):**
```env
DB_HOST=mysql-transaction
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=db_transaction
DB_PORT=3306
INTERNAL_SECRET_KEY=supersecretkey123
PRODUCT_SERVICE_URL=http://product-service:3002  # atau http://localhost:3002
PORT=3003
```

---

**Catatan:** Untuk dokumentasi lebih lengkap termasuk cara jalankan dengan frontend, lihat [README.md di root folder](../README.md)
```

Wait for all MySQL containers to be healthy (~10 seconds).

### 2. Run Database Migrations

```bash
# Auth Service
cd auth-service
npm install
npm run db:migrate

# Product Service
cd ../product-service
npm install
npm run db:migrate

# Transaction Service
cd ../transaction-service
npm install
npm run db:migrate
```

### 3. Start Services

```bash
# Terminal 1 - Auth Service
cd auth-service
npm run dev

# Terminal 2 - Product Service
cd product-service
npm run dev

# Terminal 3 - Transaction Service
cd transaction-service
npm run dev

# Terminal 4 - API Gateway
cd api-gateway
docker-compose up -d
```

## Testing

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

Copy the JWT token from response.

### 3. Create Product (Admin)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Laptop ASUS ROG",
    "price": 15000000,
    "stock": 10
  }'
```

### 4. Get Products

```bash
curl http://localhost:3000/api/products
```

### 5. Create Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {"productId": 1, "qty": 2}
    ]
  }'
```

### 6. Pay Transaction (Admin)

```bash
curl -X POST http://localhost:3000/api/transactions/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "kode_billing": "TRX-1234"
  }'
```

## Environment Variables

Each service has `.env` file with:

**Auth Service:**
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3307
JWT_SECRET=your-jwt-secret-key-here
INTERNAL_SECRET_KEY=supersecretkey123
```

**Product Service:**
```env
PORT=3002
DB_HOST=localhost
DB_PORT=3308
INTERNAL_SECRET_KEY=supersecretkey123
```

**Transaction Service:**
```env
PORT=3003
DB_HOST=localhost
DB_PORT=3309
PRODUCT_SERVICE_URL=http://localhost:3002
INTERNAL_SECRET_KEY=supersecretkey123
```

## Security

All internal endpoints (protected routes) require:
- `X-INTERNAL-KEY` header (injected by Kong)
- Some endpoints also need JWT token (verified by Kong)

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MySQL 8.0
- **ORM:** mysql2 (raw queries)
- **Dev Tool:** tsx (watch mode)

## Database Schema

### db_auth.users
- id (INT, PK)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- role (ENUM: ADMIN, PEMBELI)
- created_at (TIMESTAMP)

### db_product.products
- id (INT, PK)
- name (VARCHAR, UNIQUE)
- price (DECIMAL)
- stock (INT)
- created_at, updated_at (TIMESTAMP)

### db_transaction.transactions
- id (INT, PK)
- kode_billing (VARCHAR, UNIQUE)
- user_id (INT)
- total_amount (DECIMAL)
- status (ENUM: BELUM_DIBAYAR, SUDAH_DIBAYAR, EXPIRED)
- created_at, expired_at (TIMESTAMP)

### db_transaction.transaction_items
- id (INT, PK)
- transaction_id (INT, FK)
- product_id (INT)
- product_name (VARCHAR, snapshot)
- price_per_item (DECIMAL, snapshot)
- quantity (INT)

## Troubleshooting

### MySQL Connection Failed

```bash
# Check if MySQL containers are running
docker-compose ps

# Check logs
docker-compose logs mysql-auth
docker-compose logs mysql-product
docker-compose logs mysql-transaction
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001  # or 3002, 3003

# Kill process
sudo kill -9 <PID>
```

### Reset Database

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-run migrations
npm run db:migrate
```

## Next Steps

1. ✅ Backend services running
2. ⏳ Implement JWT verification di Kong Gateway
3. ⏳ Implement RBAC middleware
4. ⏳ Connect frontend ke API Gateway
5. ⏳ Add unit tests
6. ⏳ Add Docker Compose orchestration untuk semua services

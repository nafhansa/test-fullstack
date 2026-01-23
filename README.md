# 🛒 Aplikasi E-Commerce Microservices

Aplikasi e-commerce lengkap dengan arsitektur microservices yang modern. Frontend dibuat dengan React + TypeScript, backend menggunakan Node.js + Express dengan 3 microservices terpisah, dan Kong sebagai API Gateway.

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Arsitektur Sistem](#️-arsitektur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Persiapan Awal](#-persiapan-awal)
- [Cara Menjalankan](#-cara-menjalankan)
- [Panduan Testing](#-panduan-testing)
- [Dokumentasi API](#-dokumentasi-api)
- [Tips & Troubleshooting](#-tips--troubleshooting)

---

## 🎯 Tentang Aplikasi

Ini adalah aplikasi e-commerce full-stack yang dibangun dengan prinsip microservices. Setiap bagian aplikasi (Auth, Produk, Transaksi) berjalan sebagai service terpisah yang saling berkomunikasi.

**Fitur Utama:**
- ✅ Registrasi & Login User (JWT Authentication)
- ✅ Manajemen User dengan Role (Admin & Pembeli)
- ✅ CRUD Produk
- ✅ Keranjang Belanja
- ✅ Checkout & Pembayaran
- ✅ History Transaksi

---

## 🏗️ Arsitektur Sistem

```
┌───────────────────┐
│  React Frontend   │  ← Tampilan Web
│    Port: 5173     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Kong Gateway    │  ← Pintu Masuk Tunggal
│    Port: 3000     │
└─────────┬─────────┘
          │
    ┌─────┴─────┬─────────┬─────────┐
    │           │         │         │
    ▼           ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Auth  │ │  RBAC  │ │Product │ │ Trans  │
│ :3001  │ │ :3004  │ │ :3002  │ │ :3003  │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│MySQL   │ │MySQL   │ │MySQL   │ │MySQL   │
│db_auth │ │db_auth │ │db_prod │ │db_trans│
│ :3307  │ │ :3307  │ │ :3308  │ │ :3309  │
└────────┘ └────────┘ └────────┘ └────────┘
```

**Penjelasan:**
- **Frontend React**: Tampilan web yang diakses user
- **Kong Gateway**: Pintu masuk tunggal ke semua backend
- **Auth Service**: Handle login & registrasi
- **RBAC Service**: Manajemen user & role
- **Product Service**: CRUD produk
- **Transaction Service**: Checkout & pembayaran
- **MySQL Database**: Setiap service punya database sendiri

---

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** - Library UI
- **TypeScript** - Type safety
- **Vite** - Build tool yang cepat
- **Tailwind CSS** - Styling
- **React Router** - Navigasi halaman
- **TanStack Query** - Data fetching & caching

### Backend
- **Node.js 20** - Runtime JavaScript
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MySQL 8** - Database
- **bcryptjs** - Hash password
- **jsonwebtoken** - Authentication
- **axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Kong Gateway 3.5** - API Gateway

---

## 📦 Persiapan Awal

Sebelum mulai, pastikan sudah install:

### Yang Wajib Ada
- **Docker** (versi 20.10+)
- **Docker Compose** (versi 2.0+)

### Yang Opsional (untuk development)
- **Node.js** (versi 20+)
- **npm** atau **yarn**

### Cara Cek Instalasi
```bash
docker --version
docker-compose --version
node --version  # opsional
npm --version   # opsional
```

Kalau ada yang belum terinstall:
- **Docker**: Download di https://www.docker.com/get-started
- **Node.js**: Download di https://nodejs.org

---

## 🚀 Cara Menjalankan

Ada 3 cara menjalankan aplikasi ini. Pilih yang paling cocok:

### 🌟 Cara 1: Full Docker (PALING MUDAH - Recommended!)

Ini cara paling gampang - cukup satu command dan semua jalan!

```bash
# 1. Masuk ke folder services
cd services

# 2. Jalankan semua (Kong + 4 Services + 3 MySQL)
docker-compose -f docker-compose.full.yml up --build

# 3. Tunggu sampai semua container jalan (sekitar 1-2 menit)
# Lihat log sampai muncul "running on port..."
```

**Setelah semua jalan, bisa akses:**
- 🌐 **API Gateway**: http://localhost:3000
- 🔐 **Auth Service**: http://localhost:3001
  - Swagger: http://localhost:3001/api-docs
- 👥 **RBAC Service**: http://localhost:3004
  - Swagger: http://localhost:3004/api-docs
- 📦 **Product Service**: http://localhost:3002
  - Swagger: http://localhost:3002/api-docs
- 💳 **Transaction Service**: http://localhost:3003
  - Swagger: http://localhost:3003/api-docs

**Test API langsung:**
```bash
# Cek semua service aktif
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health

# Atau langsung test lengkap
cd ..
chmod +x test.sh
./test.sh
```

**Mematikan:**
```bash
# Matikan semua service
docker-compose -f docker-compose.full.yml down

# Matikan dan hapus data
docker-compose -f docker-compose.full.yml down -v
```

---

### 🔧 Cara 2: Backend Docker + Frontend Lokal

Cocok kalau cuma mau develop frontend:

```bash
# Terminal 1: Start semua backend
cd services
docker-compose -f docker-compose.full.yml up --build

# Terminal 2: Start frontend
cd frontend
npm install
npm run dev
```

Frontend akan jalan di http://localhost:5173

---

### 💻 Cara 3: Development Penuh (Tanpa Docker)

Untuk development yang lebih fleksibel:

**1. Start MySQL Databases**
```bash
cd services
docker-compose up mysql-auth mysql-product mysql-transaction -d
```

**2. Setup & Run Auth Service**
```bash
cd auth-service
npm install
cp .env.example .env

# Edit .env:
# DB_HOST=localhost
# DB_PORT=3307

npm run db:migrate
npm run dev  # Jalan di port 3001
```

**3. Setup & Run Product Service**
```bash
cd ../product-service
npm install
cp .env.example .env

# Edit .env:
# DB_HOST=localhost
# DB_PORT=3308

npm run db:migrate
npm run dev  # Jalan di port 3002
```

**4. Setup & Run Transaction Service**
```bash
cd ../transaction-service
npm install
cp .env.example .env

# Edit .env:
# DB_HOST=localhost
# DB_PORT=3309
# PRODUCT_SERVICE_URL=http://localhost:3002

npm run db:migrate
npm run dev  # Jalan di port 3003
```

**5. Setup & Run RBAC Service**
```bash
cd ../rbac-service
npm install
cp .env.example .env

# Edit .env:
# AUTH_DB_HOST=localhost
# (RBAC pakai database yang sama dengan Auth)

npm run dev  # Jalan di port 3004
```

**6. Start Kong Gateway**
```bash
cd ../api-gateway
docker-compose up -d
```

**7. (Opsional) Start Frontend**
```bash
cd ../../frontend
npm install
npm run dev  # Jalan di port 5173
```

---

## 🧪 Panduan Testing

### Test Otomatis dengan Script

Cara paling mudah untuk test semua API:

```bash
# Dari root folder
chmod +x test.sh
./test.sh
```

Script ini akan otomatis test:
1. ✅ Auth Service (Register, Login, Get Me, Refresh Token)
2. ✅ RBAC Service (List Users, Create, Update, Delete)
3. ✅ Product Service (List, Create, Update, Delete)
4. ✅ Cart Service (Add to Cart, Get Cart)
5. ✅ Transaction Service (Checkout, History, Payment)

**Output:**
```
🧪 COMPLETE MICROSERVICES API TEST SUITE 🧪
...
TEST SUMMARY
Total Tests:  25
Passed:       25
Failed:       0

✅ ALL TESTS PASSED! (100%)
```

### Test Manual dengan curl

#### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "PEMBELI"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

Simpan `token` yang didapat!

#### 3. Lihat Semua Produk (Public)
```bash
curl http://localhost:3000/api/products
```

#### 4. Tambah Produk (Admin only)
```bash
TOKEN="paste-token-disini"

curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Produk Baru",
    "price": 50000
  }'
```

#### 5. Tambah ke Keranjang
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productId": 1,
    "qty": 2
  }'
```

#### 6. Checkout
```bash
curl -X POST http://localhost:3000/api/transactions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Dokumentasi API

### Swagger UI (Interactive Docs) ⭐

Cara paling mudah explore API adalah lewat Swagger UI:

- **Auth Service**: http://localhost:3001/api-docs
- **RBAC Service**: http://localhost:3004/api-docs
- **Product Service**: http://localhost:3002/api-docs
- **Transaction Service**: http://localhost:3003/api-docs

Di Swagger UI kamu bisa:
- ✅ Lihat semua endpoint
- ✅ Lihat format request & response
- ✅ Test langsung dari browser
- ✅ Download spec YAML

### Endpoint Utama

#### 🔐 Auth Service (Port 3001)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Daftar user baru | ❌ |
| POST | `/api/auth/login` | Login & dapat token | ❌ |
| GET | `/api/auth/me` | Info user login | ✅ JWT |
| POST | `/api/auth/refresh-token` | Refresh JWT token | ✅ |

#### 👥 RBAC Service (Port 3004)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/users` | List semua user | ✅ Admin |
| POST | `/api/users` | Buat user baru | ✅ Admin |
| PUT | `/api/users/:id` | Update user | ✅ Admin |
| DELETE | `/api/users/:id` | Hapus user | ✅ Admin |

#### 📦 Product Service (Port 3002)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/products` | List produk | ❌ Public |
| GET | `/api/products/:id` | Detail produk | ✅ |
| POST | `/api/products` | Buat produk | ✅ Admin |
| PUT | `/api/products/:id` | Update produk | ✅ Admin |
| DELETE | `/api/products/:id` | Hapus produk | ✅ Admin |

#### 💳 Transaction Service (Port 3003)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/cart/add` | Tambah ke cart | ✅ User |
| GET | `/api/cart` | Lihat cart | ✅ User |
| POST | `/api/transactions/checkout` | Checkout | ✅ User |
| GET | `/api/transactions/history` | History | ✅ User |
| POST | `/api/transactions/pay` | Bayar | ✅ Admin |

---

## 🔧 Tips & Troubleshooting

### Container Tidak Jalan

**Problem**: Container restart terus-terusan

```bash
# Lihat logs
docker-compose -f docker-compose.full.yml logs -f kong
docker-compose -f docker-compose.full.yml logs -f auth-service

# Restart service tertentu
docker-compose -f docker-compose.full.yml restart kong

# Rebuild dari awal
docker-compose -f docker-compose.full.yml up --build --force-recreate
```

### Database Connection Error

**Problem**: `ECONNREFUSED` atau `ER_ACCESS_DENIED`

```bash
# Cek MySQL healthy
docker-compose -f docker-compose.full.yml ps

# Masuk ke MySQL
docker exec -it mysql-auth mysql -uroot -prootpassword db_auth

# Lihat tabel
SHOW TABLES;

# Run migration ulang
docker-compose -f docker-compose.full.yml exec auth-service npm run db:migrate
```

### Kong Gateway 404 Error

**Problem**: Semua request ke Gateway return 404

```bash
# Cek Kong status
curl http://localhost:8001/status

# Lihat routes
curl http://localhost:8001/routes

# Restart Kong
docker-compose -f docker-compose.full.yml restart kong
```

### Port Sudah Dipakai

**Problem**: `port is already allocated`

```bash
# Cari process yang pakai port
lsof -i :3000

# Matikan process
kill -9 <PID>

# Atau ganti port di docker-compose.full.yml
```

### Test Script Gagal

**Problem**: test.sh return banyak error

```bash
# Install jq kalau belum ada
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # Mac

# Pastikan semua service jalan
docker-compose -f docker-compose.full.yml ps

# Tunggu semua service healthy (30 detik)
```

### Frontend Tidak Bisa Connect

**Problem**: Frontend error saat fetch data

- Pastikan Kong Gateway jalan di port 3000
- Cek CORS di Kong config (`kong.yml`)
- Cek file `.env` di frontend (API_URL)

---

## 🔐 Security Notes

### Untuk Production:

1. **Ganti Semua Secret Key**
   ```env
   JWT_SECRET=<random-string-panjang-32-karakter>
   INTERNAL_SECRET_KEY=<uuid-atau-random-string>
   MYSQL_ROOT_PASSWORD=<password-yang-kuat>
   ```

2. **Enable HTTPS**
   - Gunakan Kong SSL/TLS termination
   - Atau pakai reverse proxy (Nginx/Traefik)

3. **CORS Configuration**
   - Whitelist domain frontend production
   - Jangan pakai wildcard `*`

4. **Rate Limiting**
   - Tambah Kong rate-limit plugin
   - Protect dari abuse & DDoS

5. **Environment Variables**
   - Jangan commit `.env` ke git
   - Gunakan secret management (Vault, etc)

---

## 📁 Struktur Folder

```
.
├── services/
│   ├── api-gateway/         # Kong Gateway
│   │   ├── docker-compose.yml
│   │   └── kong.yml
│   │
│   ├── auth-service/        # Auth & JWT
│   │   ├── src/
│   │   ├── swagger.yaml
│   │   └── Dockerfile
│   │
│   ├── rbac-service/        # User Management
│   │   ├── src/
│   │   ├── swagger.yaml
│   │   └── Dockerfile
│   │
│   ├── product-service/     # Product CRUD
│   │   ├── src/
│   │   ├── swagger.yaml
│   │   └── Dockerfile
│   │
│   ├── transaction-service/ # Checkout & Payment
│   │   ├── src/
│   │   ├── swagger.yaml
│   │   └── Dockerfile
│   │
│   └── docker-compose.full.yml  # Run semua
│
├── frontend/                # React App
│   ├── src/
│   ├── public/
│   └── package.json
│
├── test.sh                  # Test script
└── README.md               # You are here!
```

---

## 💡 Tips Development

### Lihat Logs Real-time
```bash
# Semua logs
docker-compose -f docker-compose.full.yml logs -f

# Logs service tertentu
docker-compose -f docker-compose.full.yml logs -f auth-service
```

### Restart Service Tertentu
```bash
docker-compose -f docker-compose.full.yml restart auth-service
```

### Rebuild Service yang Berubah
```bash
docker-compose -f docker-compose.full.yml up -d --build auth-service
```

### Akses Database Langsung
```bash
# Auth DB
docker exec -it mysql-auth mysql -uroot -prootpassword db_auth

# Product DB
docker exec -it mysql-product mysql -uroot -prootpassword db_product

# Transaction DB
docker exec -it mysql-transaction mysql -uroot -prootpassword db_transaction
```

---

## 🎓 Belajar Lebih Lanjut

- **Microservices**: https://microservices.io
- **Kong Gateway**: https://docs.konghq.com
- **Docker**: https://docs.docker.com
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org

---

## 📞 Support & Kontribusi

Ada pertanyaan atau menemukan bug?
- **Issues**: Buat issue di GitHub
- **Kontribusi**: Fork, edit, dan kirim Pull Request

---

## 📄 License

MIT License - Bebas dipakai untuk project pribadi maupun komersial

---

**Dibuat dengan ❤️ menggunakan TypeScript, React, Node.js, dan Docker**

*Last Updated: 23 Januari 2026*
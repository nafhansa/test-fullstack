# SPECIFICATION & ARCHITECTURE DOCUMENTATION

**Project:** E-Commerce Microservices (Test Programmer Rev2)  
**Status:** Draft / On-Progress

---

## 1. Arsitektur Sistem (High Level)

Sistem wajib menerapkan **Microservices Pattern** dengan aturan ketat:

- **Single Entry Point:** Frontend hanya boleh mengakses API Gateway.
- **Database Isolation:** Setiap service memiliki database sendiri. Dilarang JOIN antar database service.
- **Internal Communication:** Service bicara dengan service lain (S2S) via HTTP Request (Axios/Fetch), bukan via database.

### Peta Port Service

| Service Name     | Port | Type    | Database Name    | Access Level  |
|------------------|------|---------|------------------|---------------|
| Frontend         | 5173 | UI      | -                | Public        |
| API Gateway      | 3000 | Proxy   | -                | Public Entry  |
| Auth Service     | 3001 | Service | db_auth          | Private       |
| Product Service  | 3002 | Service | db_product       | Private       |
| Trx Service      | 3003 | Service | db_transaction   | Private       |

---

## 2. Security & Headers (CRITICAL!)

Ini adalah poin yang sering membuat gagal. Implementasi keamanan wajib:

### A. Public Request (Frontend → Gateway)

Setiap request ke endpoint yang diproteksi (kecuali login/register/product-list) wajib membawa header:

```http
Authorization: Bearer <token_jwt>
```

### B. Internal Request (Gateway → Service / Service → Service)

Untuk mencegah bypass, setiap Service (Auth/Product/Trx) **WAJIB** mengecek header rahasia. Jika header ini tidak ada, request harus ditolak (403 Forbidden).

```http
X-INTERNAL-KEY: <secret_defined_in_env>
```

Value `X-INTERNAL-KEY` simpan di `.env` (misal: `supersecretkey123`).

---

## 3. Detail Module & API Specification

### A. Modul Auth Service (Port 3001)

**Tugas:** Handle registrasi, login, dan generate JWT.  
**Database:** `db_auth` → Table `users`

#### Schema Table `users`:

- `id` (INT, PK, Auto Inc)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed with Bcrypt)
- `role` (ENUM: 'ADMIN', 'PEMBELI')
- `created_at` (TIMESTAMP)

#### API Contracts (Internal Routes):

**1. POST /auth/register**
- Body: `{ "email": "a@b.com", "password": "123", "role": "PEMBELI" }`
- Logic: Hash password sebelum simpan.

**2. POST /auth/login**
- Body: `{ "email": "a@b.com", "password": "123" }`
- Response: `{ "token": "eyJhbG..." }`
- JWT Payload Wajib: `{ "id": 1, "role": "PEMBELI", "email": "..." }`

---

### B. Modul Product Service (Port 3002)

**Tugas:** Master Data Produk.  
**Database:** `db_product` → Table `products`

#### Schema Table `products`:

- `id` (INT, PK)
- `name` (VARCHAR, Unique)
- `price` (DECIMAL, Min: 0)
- `stock` (INT, Min: 0)

#### API Contracts (Internal Routes):

**1. GET /products** (Public)

**2. GET /products/:id** (Internal Use for Transaction Service)
- **Penting:** Endpoint ini akan ditembak oleh Transaction Service buat validasi harga.

**3. POST /products** (Admin Only)
- Body: `{ "name": "Sepatu", "price": 50000, "stock": 10 }`

**4. PUT /products/:id** (Admin Only)

**5. DELETE /products/:id** (Admin Only)

---

### C. Modul Transaction Service (Port 3003)

**Tugas:** Handle Checkout & Status Pembayaran.  
**Database:** `db_transaction`

#### Schema Table `transactions`:

- `id` (PK)
- `kode_billing` (VARCHAR, Unique, ex: TRX-9821)
- `user_id` (INT)
- `total_amount` (DECIMAL)
- `status` (ENUM: 'BELUM_DIBAYAR', 'SUDAH_DIBAYAR', 'EXPIRED')
- `created_at`
- `expired_at` (Logic: created_at + 24 jam)

#### Schema Table `transaction_items`:

- `id` (PK)
- `transaction_id` (FK)
- `product_id` (INT)
- `product_name` (VARCHAR) → Snapshot nama saat beli
- `price_per_item` (DECIMAL) → Snapshot harga saat beli (PENTING!)
- `quantity` (INT)

#### Logic Checkout (The "Kill Switch" Question):

**Endpoint:** POST /transactions

1. Frontend kirim payload: `{ "items": [ { "productId": 1, "qty": 2 } ] }`
2. **DILARANG** kirim harga dari Frontend.
3. Backend Transaction Service melakukan loop items:
   - Request ke Product Service (`GET /products/1`) pakai Axios + Header `X-INTERNAL-KEY`.
   - Ambil harga dari response Product Service.
   - Kalikan `price * qty`.
4. Jumlahkan total.
5. Simpan ke DB `transactions` dan `transaction_items`.

#### Logic Pembayaran (Simulasi):

**Endpoint:** POST /transactions/pay (Admin Only)
- Ubah status jadi `SUDAH_DIBAYAR`.

---

### D. API Gateway (Port 3000)

**Tugas:** Router & Security Gatekeeper.

#### Middleware Wajib di Gateway:

**1. AuthMiddleware:**
- Cek Header `Authorization`.
- Verify JWT Token.
- Jika valid, decode token dan inject `user_id` & `role` ke header request yang diteruskan ke service.
- Misal: Header `X-USER-ID: 1` dan `X-USER-ROLE: PEMBELI` dikirim ke service tujuan.

**2. RBACMiddleware:**
- Cek apakah user punya role yang diizinkan untuk akses endpoint tertentu (misal: POST product hanya Admin).

**3. ProxyMiddleware:**
- Forward request ke service yang sesuai.
- Inject Header: `X-INTERNAL-KEY: <secret>` sebelum diteruskan.

---

## 4. Alur Pengerjaan (Step-by-Step)

Gunakan checklist ini untuk memastikan tidak ada yang terlewat.

### Phase 1: Preparation (Done)

- [x] Setup Monorepo & Git
- [x] Setup Frontend Boilerplate (React + TS + Tailwind)
- [ ] Buat file `.env` di setiap folder service.

### Phase 2: Services Development (Backend)

#### Auth Service:
- [ ] Init Express & DB Connection.
- [ ] Create POST /register & POST /login.
- [ ] Implement bcrypt & JWT sign.

#### API Gateway (Basic):
- [ ] Setup Proxy ke Auth Service.
- [ ] Test Login dari Frontend → Gateway → Auth Service.

#### Product Service:
- [ ] Init Express & DB.
- [ ] Implement CRUD.
- [ ] **PENTING:** Validasi header `X-INTERNAL-KEY`.

#### Transaction Service (Complex):
- [ ] Init Express & DB.
- [ ] Implement Logic "Call Product Service" (S2S Communication).
- [ ] Implement Generate Kode Billing.

### Phase 3: Integration (Frontend)

- [ ] Halaman Login (Hit Gateway).
- [ ] Halaman Dashboard Produk (Public).
- [ ] Halaman Add Product (Admin Only check).
- [ ] Halaman Cart & Checkout (Pembeli Only).

---

## 5. Aturan Main Frontend

- Jangan pernah hardcode URL service (`http://localhost:3001` dsb). Semua request **HARUS** ke `http://localhost:3000` (Gateway).
- Simpan Token JWT di `localStorage` setelah login.
- Jika Gateway balikin 401 (Unauthorized), redirect user ke halaman Login.
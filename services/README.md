# Backend Services

Microservices architecture dengan 3 service utama + API Gateway.

## Architecture

```
Kong Gateway (3000)
    ├─> Auth Service (3001)        → MySQL (3307)
    ├─> Product Service (3002)     → MySQL (3308)
    └─> Transaction Service (3003) → MySQL (3309)
```

## Services

### 1. Auth Service (Port 3001)
- **Database:** db_auth (MySQL port 3307)
- **Endpoints:**
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login with JWT

### 2. Product Service (Port 3002)
- **Database:** db_product (MySQL port 3308)
- **Endpoints:**
  - `GET /products` - List all products (public)
  - `GET /products/:id` - Get product detail (internal)
  - `POST /products` - Create product (internal, admin)
  - `PUT /products/:id` - Update product (internal, admin)
  - `DELETE /products/:id` - Delete product (internal, admin)

### 3. Transaction Service (Port 3003)
- **Database:** db_transaction (MySQL port 3309)
- **Endpoints:**
  - `POST /transactions` - Create checkout (internal)
  - `GET /transactions` - List transactions (internal)
  - `GET /transactions/:id` - Get transaction detail (internal)
  - `POST /transactions/pay` - Mark as paid (internal, admin)

### 4. API Gateway (Port 3000)
- Kong Gateway dengan declarative config
- Routes semua request ke service yang tepat
- Inject X-INTERNAL-KEY header

## Quick Start

### 1. Start MySQL Databases

```bash
cd services
docker-compose up -d
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

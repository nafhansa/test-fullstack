import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'mysql-transaction',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  multipleStatements: true,
};

const AUTH_DB_CONFIG = {
  host: process.env.AUTH_DB_HOST || 'mysql-auth',
  port: 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.AUTH_DB_NAME || 'db_auth',
};

async function migrate() {
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    const dbName = process.env.DB_NAME || 'db_transaction';

    console.log(`🚀 Starting Migration for ${dbName}...`);
    
    // 1. Create DB & Tables
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);

    console.log('Creating transactions tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        kode_billing VARCHAR(50) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('BELUM_DIBAYAR', 'SUDAH_DIBAYAR', 'EXPIRED') DEFAULT 'BELUM_DIBAYAR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expired_at TIMESTAMP NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        transaction_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price_per_item DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      )
    `);

    // --- SEEDING LOGIC ---
    console.log('🌱 Checking if seeding is needed...');
    
    const [rows]: any = await connection.query('SELECT COUNT(*) as count FROM transactions');
    const count = rows[0].count;

    if (count > 0) {
      console.log('✅ Data already exists. Skipping seed.');
    } else {
      console.log('Empty table detected. Starting auto-seed...');
      
      let authConnection;
      try {
        authConnection = await mysql.createConnection(AUTH_DB_CONFIG);
        const [users]: any = await authConnection.query(
          "SELECT id, email, name FROM users WHERE role = 'PEMBELI'"
        );
        
        if (!users || users.length === 0) {
          console.warn('⚠️ No PEMBELI users found in Auth DB. Skipping transaction seed.');
        } else {
          const statuses = ['BELUM_DIBAYAR', 'SUDAH_DIBAYAR', 'EXPIRED'];

          for (const user of users) {
            for (const status of statuses) {
              const now = new Date();
              let created_at = new Date(now);
              let expired_at = new Date(now);
              
              if (status === 'BELUM_DIBAYAR') {
                expired_at.setHours(created_at.getHours() + 24);
              } else if (status === 'SUDAH_DIBAYAR') {
                created_at.setDate(created_at.getDate() - 7);
                expired_at.setDate(created_at.getDate() + 1); 
              } else if (status === 'EXPIRED') {
                created_at.setDate(created_at.getDate() - 5);
                expired_at.setDate(created_at.getDate() + 2);
              }

              const kode_billing = `BILL-${user.id}-${status.substring(0,3)}-${Math.floor(Math.random() * 10000)}`;
              const total_amount = status === 'SUDAH_DIBAYAR' ? 100000 : 50000;

              const [res]: any = await connection.query(
                `INSERT INTO transactions (kode_billing, user_id, total_amount, status, created_at, expired_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [kode_billing, user.id, total_amount, status, created_at, expired_at]
              );

              await connection.query(
                `INSERT INTO transaction_items (transaction_id, product_id, product_name, price_per_item, quantity)
                 VALUES (?, 105, 'Auto Seed Product', ?, 1)`,
                [res.insertId, total_amount]
              );
            }
          }
          console.log(`✅ Seeded transactions for ${users.length} users.`);
        }
      } catch (authError) {
        // --- PERBAIKAN DI SINI ---
        // Kita cast authError sebagai 'any' agar properti .message bisa diakses
        const msg = (authError as any).message; 
        console.error('⚠️ Could not connect to Auth DB for seeding. Ensure mysql-auth is ready.', msg);
      } finally {
        if (authConnection) await authConnection.end();
      }
    }

    console.log('✅ Migration & Seeding completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
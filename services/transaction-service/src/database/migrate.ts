import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
  });

  try {
    console.log('Creating database...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'db_transaction'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'db_transaction'}`);

    console.log('Creating transactions table...');
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

    console.log('Creating transaction_items table...');
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

    console.log('✅ Database migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();

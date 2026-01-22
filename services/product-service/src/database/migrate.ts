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
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'db_product'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'db_product'}`);

    console.log('Creating products table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed default products
    console.log('Seeding default products...');
    const [existingProducts]: any = await connection.query('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      await connection.query(`
        INSERT INTO products (name, price) VALUES
        ('Pemadanan Data dan Dokumen Kependudukan', 5000),
        ('Verifikasi Data Kependudukan Berbasis Web', 3500),
        ('Buku Cetakan Data Agregat Penduduk', 10000)
      `);
      
      console.log('✅ Default products created: 3 products');
    } else {
      console.log('ℹ️  Products already exist, skipping seed');
    }

    console.log('✅ Database migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();

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
    console.log('🚀 Starting Auth Database Migration...');
    
    const dbName = process.env.DB_NAME || 'db_auth';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);

    // ===== STEP 1: Drop old tables (jika ada) =====
    console.log('🗑️  Dropping old tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS users_role');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // ===== STEP 2: Create users table =====
    console.log('📦 Creating users table...');
    await connection.query(`
      CREATE TABLE users (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ===== STEP 3: Create users_role table =====
    console.log('📦 Creating users_role table...');
    await connection.query(`
      CREATE TABLE users_role (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_role (user_id, role),
        INDEX idx_user_id (user_id),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ===== STEP 4: Seed default users =====
    console.log('🌱 Seeding default users...');
    const bcrypt = require('bcryptjs');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Insert Admin User
    const [adminResult]: any = await connection.query(
      `INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@test.com', adminPassword, true]
    );
    await connection.query(
      `INSERT INTO users_role (user_id, role) VALUES (?, ?)`,
      [adminResult.insertId, 'ADMIN']
    );

    // Insert Pembeli 1
    const [user1Result]: any = await connection.query(
      `INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)`,
      ['John Doe', 'user@test.com', userPassword, true]
    );
    await connection.query(
      `INSERT INTO users_role (user_id, role) VALUES (?, ?)`,
      [user1Result.insertId, 'PEMBELI']
    );

    // Insert Pembeli 2
    const [user2Result]: any = await connection.query(
      `INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)`,
      ['Jane Smith', 'jane@test.com', userPassword, true]
    );
    await connection.query(
      `INSERT INTO users_role (user_id, role) VALUES (?, ?)`,
      [user2Result.insertId, 'PEMBELI']
    );

    console.log('✅ Default users created:');
    console.log('   - admin@test.com (password: admin123) - ADMIN');
    console.log('   - user@test.com (password: user123) - PEMBELI');
    console.log('   - jane@test.com (password: user123) - PEMBELI');

    console.log('✅ Auth Database Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate();
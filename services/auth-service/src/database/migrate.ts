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
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'db_auth'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'db_auth'}`);

    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'PEMBELI') NOT NULL DEFAULT 'PEMBELI',
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default users
    console.log('Seeding default users...');
    const bcrypt = require('bcryptjs');
    
    // Check if users already exist
    const [existingUsers]: any = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const userPassword = await bcrypt.hash('user123', 10);
      
      await connection.query(`
        INSERT INTO users (name, username, email, password, role, status) VALUES
        ('Admin User', 'admin', 'admin@test.com', ?, 'ADMIN', 'ACTIVE'),
        ('John Doe', 'johndoe', 'user@test.com', ?, 'PEMBELI', 'ACTIVE'),
        ('Jane Smith', 'janesmith', 'jane@test.com', ?, 'PEMBELI', 'ACTIVE')
      `, [adminPassword, userPassword, userPassword]);
      
      console.log('✅ Default users created: admin@test.com, user@test.com, jane@test.com');
    } else {
      console.log('ℹ️  Users already exist, skipping seed');
    }

    console.log('✅ Database migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrate();

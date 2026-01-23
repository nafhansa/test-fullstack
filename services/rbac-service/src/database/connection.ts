import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.AUTH_DB_HOST || 'mysql-auth',
  port: parseInt(process.env.AUTH_DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.AUTH_DB_NAME || 'db_auth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
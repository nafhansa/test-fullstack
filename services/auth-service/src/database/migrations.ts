import pool from './connection';

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Check and add name column
    const [nameColumn]: any = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'name'
    `);
    if (nameColumn.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL AFTER id');
      console.log('✅ Added name column');
    }

    // Check and add username column
    const [usernameColumn]: any = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'username'
    `);
    if (usernameColumn.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER name');
      await pool.query('CREATE UNIQUE INDEX idx_username ON users(username)');
      console.log('✅ Added username column with unique index');
    }

    // Check and add status column
    const [statusColumn]: any = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'status'
    `);
    if (statusColumn.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' AFTER role");
      console.log('✅ Added status column');
    }

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

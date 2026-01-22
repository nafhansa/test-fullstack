import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  status: boolean;
  created_at: Date;
}

interface UserWithRole extends User {
  role: string;
}

// ===== GET /users - List all users =====
export async function getUsers(req: Request, res: Response) {
  try {
    const [users] = await pool.query<UserWithRole[]>(
      `SELECT u.id, u.name, u.email, u.status, u.created_at, ur.role
       FROM users u
       LEFT JOIN users_role ur ON u.id = ur.user_id
       ORDER BY u.created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// ===== POST /add_users - Create new user =====
export async function addUser(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { name, email, password, role = 'PEMBELI', status = true } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }

    if (!['ADMIN', 'PEMBELI'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be ADMIN or PEMBELI' 
      });
    }

    await connection.beginTransaction();

    // Check if email exists
    const [existingUsers] = await connection.query<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, status]
    );

    const userId = userResult.insertId;

    // Insert role
    await connection.query(
      'INSERT INTO users_role (user_id, role) VALUES (?, ?)',
      [userId, role]
    );

    await connection.commit();

    res.status(201).json({
      message: 'User created successfully',
      userId: userId,
      role: role
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    connection.release();
  }
}

// ===== PUT /update_users/:id - Update user =====
export async function updateUser(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;

    // Check if user exists
    const [existingUsers] = await connection.query<User[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await connection.beginTransaction();

    // Build update query for users table
    const userUpdates: string[] = [];
    const userValues: any[] = [];

    if (name !== undefined) {
      userUpdates.push('name = ?');
      userValues.push(name);
    }
    if (email !== undefined) {
      userUpdates.push('email = ?');
      userValues.push(email);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userUpdates.push('password = ?');
      userValues.push(hashedPassword);
    }
    if (status !== undefined) {
      userUpdates.push('status = ?');
      userValues.push(status);
    }

    // Update users table if there are changes
    if (userUpdates.length > 0) {
      userValues.push(id);
      await connection.query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userValues
      );
    }

    // Update role if provided
    if (role !== undefined) {
      if (!['ADMIN', 'PEMBELI'].includes(role)) {
        await connection.rollback();
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Delete old role
      await connection.query('DELETE FROM users_role WHERE user_id = ?', [id]);
      
      // Insert new role
      await connection.query(
        'INSERT INTO users_role (user_id, role) VALUES (?, ?)',
        [id, role]
      );
    }

    await connection.commit();

    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Update user error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    connection.release();
  }
}

// ===== DELETE /delete_users/:id - Delete user =====
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUsers] = await pool.query<User[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will delete role)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
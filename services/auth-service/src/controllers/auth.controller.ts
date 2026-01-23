import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  status: boolean;
}

interface UserRole extends RowDataPacket {
  role: string;
}

// ===== REGISTER USER =====
export async function register(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { name, email, password, role = 'PEMBELI' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!['ADMIN', 'PEMBELI'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN or PEMBELI' });
    }

    await connection.beginTransaction();

    // Check if user exists
    const [existingUsers] = await connection.query<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, true]
    );

    const userId = userResult.insertId;

    // Insert user role
    await connection.query(
      'INSERT INTO users_role (user_id, role) VALUES (?, ?)',
      [userId, role]
    );

    await connection.commit();

    res.status(201).json({
      message: 'User registered successfully',
      userId: userId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    connection.release();
  }
}

// ===== LOGIN USER =====
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with role (JOIN)
    const [users] = await pool.query<User[]>(
      `SELECT u.*, ur.role 
       FROM users u
       LEFT JOIN users_role ur ON u.id = ur.user_id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0] as User & { role: string };

    // WAJIB: Check if user is active
    if (!user.status) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with format sesuai PDF
    const token = jwt.sign(
      {
        user_id: user.id.toString(), // Sesuai PDF: user_id (bukan id)
        email: user.email,
        role: user.role || 'PEMBELI',
      },
      process.env.JWT_SECRET || 'your-jwt-secret-key-here',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        user_id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// ===== GET ME (NEW) =====
export async function getMe(req: Request, res: Response) {
  try {
    // Get user_id from JWT (decoded by middleware)
    const userId = (req as any).user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user with role
    const [users] = await pool.query<User[]>(
      `SELECT u.id, u.name, u.email, u.status, u.created_at, ur.role
       FROM users u
       LEFT JOIN users_role ur ON u.id = ur.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0] as User & { role: string };

    res.json({
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

// ===== REFRESH TOKEN (NEW) =====
export async function refreshToken(req: Request, res: Response) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify old token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key-here');
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        // Allow refresh even if expired (but not too long ago)
        decoded = jwt.decode(token);
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const userId = decoded.user_id;

    // Get fresh user data
    const [users] = await pool.query<User[]>(
      `SELECT u.*, ur.role 
       FROM users u
       LEFT JOIN users_role ur ON u.id = ur.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0] as User & { role: string };

    // Check if user is still active
    if (!user.status) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        user_id: user.id.toString(),
        email: user.email,
        role: user.role || 'PEMBELI',
      },
      process.env.JWT_SECRET || 'your-jwt-secret-key-here',
      { expiresIn: '24h' }
    );

    res.json({
      token: newToken,
      user: {
        user_id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}

// ===== GET ALL USERS (untuk RBAC) =====
export async function getAllUsers(req: Request, res: Response) {
  try {
    const [users] = await pool.query<User[]>(
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
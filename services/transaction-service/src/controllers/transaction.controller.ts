import { Request, Response } from 'express';
import axios from 'axios';
import pool from '../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Transaction extends RowDataPacket {
  id: number;
  kode_billing: string;
  user_id: number;
  total_amount: number;
  status: 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR' | 'EXPIRED';
  created_at: Date;
  expired_at: Date;
}

interface TransactionItem extends RowDataPacket {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  price_per_item: number;
  quantity: number;
}

function generateBillingCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${randomNum}`;
}

export async function createTransaction(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { items } = req.body;
    
    // Get user ID from JWT token in Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    let userId: number;
    
    try {
      const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = decoded.id;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    await connection.beginTransaction();

    let totalAmount = 0;
    const itemsData: Array<{
      productId: number;
      productName: string;
      price: number;
      quantity: number;
    }> = [];

    // Fetch product details from Product Service
    for (const item of items) {
      const { productId, qty } = item;

      if (!productId || !qty || qty <= 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Invalid item format. Required: {productId, qty}' 
        });
      }

      try {
        // Call Product Service with internal key
        const response = await axios.get(
          `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`,
          {
            headers: {
              'X-INTERNAL-KEY': process.env.INTERNAL_SECRET_KEY
            }
          }
        );

        const product = response.data;

        // Calculate subtotal
        const subtotal = product.price * qty;
        totalAmount += subtotal;

        itemsData.push({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: qty
        });
      } catch (error: any) {
        await connection.rollback();
        console.error('Product fetch error:', error.response?.data || error.message);
        return res.status(404).json({ 
          error: `Product with ID ${productId} not found` 
        });
      }
    }

    // Generate billing code
    const kodeBilling = generateBillingCode();

    // Calculate expiration (24 hours from now)
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + 24);

    // Insert transaction
    const [transactionResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO transactions (kode_billing, user_id, total_amount, status, expired_at) 
       VALUES (?, ?, ?, 'BELUM_DIBAYAR', ?)`,
      [kodeBilling, userId, totalAmount, expiredAt]
    );

    const transactionId = transactionResult.insertId;

    // Insert transaction items
    for (const item of itemsData) {
      await connection.query(
        `INSERT INTO transaction_items (transaction_id, product_id, product_name, price_per_item, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, item.productId, item.productName, item.price, item.quantity]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: {
        id: transactionId,
        kode_billing: kodeBilling,
        total_amount: totalAmount,
        status: 'BELUM_DIBAYAR',
        expired_at: expiredAt
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    connection.release();
  }
}

export async function getAllTransactions(req: Request, res: Response) {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers['authorization'];
    let userId: number | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = decoded.id;
      } catch (error) {
        // If token invalid, continue without userId filter
      }
    }

    // Build query based on user role
    let query = 'SELECT * FROM transactions';
    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';

    const [transactions] = await pool.query<Transaction[]>(query, params);

    // Get items for each transaction
    const transactionsWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const [items] = await pool.query<TransactionItem[]>(
          'SELECT * FROM transaction_items WHERE transaction_id = ?',
          [transaction.id]
        );
        
        return {
          ...transaction,
          items
        };
      })
    );

    res.json(transactionsWithItems);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

export async function getTransactionById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [transactions] = await pool.query<Transaction[]>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Get transaction items
    const [items] = await pool.query<TransactionItem[]>(
      'SELECT * FROM transaction_items WHERE transaction_id = ?',
      [id]
    );

    res.json({
      ...transaction,
      items
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
}

export async function payTransaction(req: Request, res: Response) {
  try {
    const { kode_billing } = req.body;

    if (!kode_billing) {
      return res.status(400).json({ error: 'Kode billing is required' });
    }

    const [transactions] = await pool.query<Transaction[]>(
      'SELECT * FROM transactions WHERE kode_billing = ?',
      [kode_billing]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    if (transaction.status === 'SUDAH_DIBAYAR') {
      return res.status(400).json({ error: 'Transaction already paid' });
    }

    if (transaction.status === 'EXPIRED') {
      return res.status(400).json({ error: 'Transaction has expired' });
    }

    // Check if expired
    if (new Date() > new Date(transaction.expired_at)) {
      await pool.query(
        'UPDATE transactions SET status = "EXPIRED" WHERE id = ?',
        [transaction.id]
      );
      return res.status(400).json({ error: 'Transaction has expired' });
    }

    // Update status to paid
    await pool.query(
      'UPDATE transactions SET status = "SUDAH_DIBAYAR" WHERE id = ?',
      [transaction.id]
    );

    res.json({
      message: 'Payment successful',
      kode_billing: transaction.kode_billing
    });
  } catch (error) {
    console.error('Pay transaction error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
}

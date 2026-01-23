// services/transaction-service/src/controllers/transaction.controller.ts
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

interface CartItem extends RowDataPacket {
  id: number;
  user_id: number;
  produk_id: number;
  product_name: string;
  harga: number;
  quantity: number;
}

function generateBillingCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${randomNum}`;
}

function getUserIdFromToken(req: Request): number | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return decoded.user_id || decoded.id;
  } catch (error) {
    return null;
  }
}

// ===== CART FUNCTIONS (BARU - Sesuai PDF) ===== ✅

export async function addToCart(req: Request, res: Response) {
  try {
    const { productId, qty = 1 } = req.body;
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    if (!productId || qty <= 0) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const response = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`,
      {
        headers: {
          'X-INTERNAL-KEY': process.env.INTERNAL_SECRET_KEY
        }
      }
    );

    const product = response.data;

    const [existing] = await pool.query<CartItem[]>(
      'SELECT * FROM keranjang WHERE user_id = ? AND produk_id = ? AND transaksi_id IS NULL',
      [userId, productId]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE keranjang SET quantity = quantity + ? WHERE id = ?',
        [qty, existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO keranjang (user_id, produk_id, product_name, harga, quantity) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, product.id, product.name, product.price, qty]
      );
    }

    res.status(201).json({
      message: 'Product added to cart',
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: qty
      }
    });
  } catch (error: any) {
    console.error('Add to cart error:', error);
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to add to cart' });
  }
}

export async function getCart(req: Request, res: Response) {
  try {
    const userId = req.params.user_id 
      ? parseInt(req.params.user_id) 
      : getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const [cartItems] = await pool.query<CartItem[]>(
      `SELECT * FROM keranjang 
       WHERE user_id = ? AND transaksi_id IS NULL 
       ORDER BY created_at DESC`,
      [userId]
    );

    const total = cartItems.reduce((sum, item) => sum + (item.harga * item.quantity), 0);

    res.json({
      items: cartItems,
      total_amount: total,
      item_count: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

// ===== TRANSACTION FUNCTIONS (Existing - Updated) =====

export async function createTransaction(req: Request, res: Response) {
  const connection = await pool.getConnection();
  
  try {
    const { items } = req.body;
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    let itemsData: Array<{
      productId: number;
      productName: string;
      price: number;
      quantity: number;
    }> = [];

    let totalAmount = 0;

    await connection.beginTransaction();

    // OPSI 1: Checkout dari keranjang
    if (!items || items.length === 0) {
      const [cartItems] = await connection.query<CartItem[]>(
        'SELECT * FROM keranjang WHERE user_id = ? AND transaksi_id IS NULL',
        [userId]
      );

      if (cartItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Cart is empty' });
      }

      itemsData = cartItems.map(item => ({
        productId: item.produk_id,
        productName: item.product_name,
        price: item.harga,
        quantity: item.quantity
      }));

      totalAmount = cartItems.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
    } 
    // OPSI 2: Direct checkout
    else {
      for (const item of items) {
        const { productId, qty } = item;

        if (!productId || !qty || qty <= 0) {
          await connection.rollback();
          return res.status(400).json({ 
            error: 'Invalid item format. Required: {productId, qty}' 
          });
        }

        try {
          const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/api/products/${productId}`,
            {
              headers: {
                'X-INTERNAL-KEY': process.env.INTERNAL_SECRET_KEY
              }
            }
          );

          const product = response.data;
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
          return res.status(404).json({ 
            error: `Product with ID ${productId} not found` 
          });
        }
      }
    }

    // Generate billing code
    const kodeBilling = generateBillingCode();

    // Calculate expiration (24 hours)
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

    // Clear cart if checkout from cart
    if (!items || items.length === 0) {
      await connection.query(
        'UPDATE keranjang SET transaksi_id = ? WHERE user_id = ? AND transaksi_id IS NULL',
        [transactionId, userId]
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
    const userId = getUserIdFromToken(req);
    
    let query = 'SELECT * FROM transactions';
    const params: any[] = [];
    
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';

    const [transactions] = await pool.query<Transaction[]>(query, params);

    const transactionsWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const [items] = await pool.query(
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

    const [items] = await pool.query(
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
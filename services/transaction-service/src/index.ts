import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionRoutes from './routes/transaction.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'transaction-service', timestamp: new Date() });
});

// Routes
app.use('/transactions', transactionRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`💳 Transaction Service running on port ${PORT}`);
});

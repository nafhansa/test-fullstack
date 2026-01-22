import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/product.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'product-service', timestamp: new Date() });
});

// Routes
app.use('/products', productRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`📦 Product Service running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-INTERNAL-KEY']
}));
app.use(express.json());

// Swagger Documentation
const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8')
) as object;
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
});

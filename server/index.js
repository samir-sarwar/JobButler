import 'dotenv/config';

// Validate required environment variables early
const requiredEnvVars = ['JWT_SECRET', 'LLM_API_KEY'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    console.error('Copy server/.env.example to server/.env and fill in the values.');
    process.exit(1);
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import experienceRoutes from './routes/experiences.js';
import tailorRoutes from './routes/tailor.js';
import uploadRoutes from './routes/upload.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// CORS configuration (must come before helmet so preflight requests aren't blocked)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Stricter rate limit for AI-powered endpoints
const tailorLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 tailor requests per minute
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many resume generation requests. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.post('/api/tailor', tailorLimiter);

// Rate limit for upload/parsing (AI-intensive)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 uploads per minute
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many upload requests. Please wait a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/upload', uploadLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/tailor', tailorRoutes);
app.use('/api/upload', uploadRoutes);

// Sessions route (reuses tailor routes but under /sessions path)
import { verifyToken } from './middleware/auth.js';
import { getSessions } from './controllers/tailor.js';
import { validateSessionsQuery } from './middleware/validate.js';
app.get('/api/sessions', verifyToken, validateSessionsQuery, getSessions);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JobButler API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';

import globalErrorHandler from './middleware/errorMiddleware.js';
import AppError from './utils/appError.js';
import authRouter from './routes/authRoutes.js';
import complaintRouter from './routes/complaintRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import publicRouter from './routes/publicRoutes.js';
import supervisorRouter from './routes/supervisorRoutes.js';
import fieldRouter from './routes/fieldRoutes.js';
import researchRouter from './routes/researchRoutes.js';
import { uploadDir } from './config/paths.js';

// The Express app without a database connection or a listening port, so tests can
// mount it with supertest. server.js adds both.
export const createApp = () => {
  fs.mkdirSync(uploadDir(), { recursive: true });

  const app = express();

  // Behind one reverse proxy in deployment; set TRUST_PROXY so rate limits see the client IP.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  // Enable CORS
  app.use(cors());

  // Serve uploads folder statically. Photos are stored without metadata
  // (middleware/uploadMiddleware.js, stripImageMetadata).
  app.use('/uploads', express.static(uploadDir(), { dotfiles: 'deny', index: false }));

  // Parse incoming requests
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Request Logger in Development
  if (!['production', 'test'].includes(process.env.NODE_ENV)) {
    app.use(morgan('dev'));
  }

  // Basic Health Check Route
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy and running.',
    });
  });

  // Mounting Routes
  app.use('/api/auth', authRouter);
  app.use('/api/complaints', complaintRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/supervisor', supervisorRouter);
  app.use('/api/field', fieldRouter);
  app.use('/api/research', researchRouter);

  // Fallback for Undefined API Routes
  app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // Global Error Handler Middleware
  app.use(globalErrorHandler);

  return app;
};

export default createApp;

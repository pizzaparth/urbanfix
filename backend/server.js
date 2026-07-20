import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';

import connectDB from './config/db.js';
import globalErrorHandler from './middleware/errorMiddleware.js';
import AppError from './utils/appError.js';
import authRouter from './routes/authRoutes.js';
import complaintRouter from './routes/complaintRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import publicRouter from './routes/publicRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Ensure uploads directory exists for file uploads
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const app = express();

// Enable CORS
app.use(cors());

// Serve uploads folder statically
app.use('/uploads', express.static('uploads'));

// Parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger in Development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy and running.'
  });
});

// Mounting Routes
app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);

// Fallback for Undefined API Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections outside Express context
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

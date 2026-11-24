import dotenv from 'dotenv';

import { assertRequiredEnv } from './config/env.js';
import connectDB from './config/db.js';
import { createApp } from './app.js';
import { startExpiryJob } from './services/expiryJob.js';

// Load environment variables
dotenv.config();

// Refuse to start without the secrets (config/env.js), before touching the database.
try {
  assertRequiredEnv();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// Connect to Database
connectDB();

const app = createApp();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

startExpiryJob();

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

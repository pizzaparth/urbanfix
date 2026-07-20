const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Mongoose cast errors, duplicate keys, and validation errors gracefully
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // 1. Mongoose bad ObjectId Cast Error
  if (err.name === 'CastError') {
    error.message = `Invalid value for path ${err.path}: ${err.value}`;
    error.statusCode = 400;
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : '';
    error.message = `Duplicate field value: ${value}. Please use another value.`;
    error.statusCode = 400;
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    error.message = `Invalid input data: ${errors.join('. ')}`;
    error.statusCode = 400;
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again.';
    error.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    error.message = 'Your token has expired. Please log in again.';
    error.statusCode = 401;
  }

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: err,
      stack: error.stack
    });
  } else {
    // Production Mode
    if (err.isOperational || error.statusCode !== 500) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } else {
      // Logging server-side programming/unknown errors
      console.error('ERROR 💥:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on our end.'
      });
    }
  }
};

export default globalErrorHandler;

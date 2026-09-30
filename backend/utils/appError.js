class AppError extends Error {
  // `code` is an optional machine-readable tag (e.g. RESEARCH_ACCESS_EXPIRED)
  // so the app can show the right screen instead of a generic 401 message.
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (code) this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

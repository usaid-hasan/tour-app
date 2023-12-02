export default class AppError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static handleCastErrorDB(err) {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new this(400, message);
  }

  static handleMongoServerErrorDB(err) {
    const MONGO_DUPLICATE_KEY_CODE = 11000;
    let message;

    if (err.code === MONGO_DUPLICATE_KEY_CODE) {
      message = `Please use different ${Object.keys(err.keyValue)[0]}`;
    }
    return new this(400, message);
  }

  static handleValidationErrorDB(err) {
    const message = Object.values(err.errors).reduce(
      (prev, curr) => `${prev} ${curr.message}.\n`,
      'Invalid input data:\n',
    );
    return new this(400, message);
  }

  static handleInvalidTokenError() {
    return new this(401, 'Invalid token! Please login again.');
  }

  static handleExpiredTokenError() {
    return new this(401, 'Expired token! Please login again.');
  }
}

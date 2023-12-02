import { env } from 'node:process';
import AppError from '#utils/app-error.js';

/***************************************************************************/
/**
 * A global error handler
 */

export default function globalErrorHandler(err, req, res, next) {
  let error = { ...err };

  error.message = err.message;
  error.statusCode ||= 500;
  error.status ||= 'error';

  if (err.name === 'MongoServerError') error = AppError.handleMongoServerErrorDB(error);
  if (err.name === 'CastError') error = AppError.handleCastErrorDB(error);
  if (err.name === 'ValidationError') error = AppError.handleValidationErrorDB(error);
  if (err.name === 'JWTExpired') error = AppError.handleExpiredTokenError();
  if (err.name === 'JWSInvalid') error = AppError.handleInvalidTokenError();
  if (err.name === 'JWSSignatureVerificationFailed') error = AppError.handleInvalidTokenError();

  if (env.NODE_ENV === 'production') handleProductionError(error, req, res);
  else handleDevelopmentError(error, req, res);
}

function handleDevelopmentError(err, req, res) {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      requestedAt: req.requestedAt,
      error: err,
      stack: err.stack,
      data: null,
    });
  } else {
    res.status(err.statusCode).render('pages/error', {
      title: 'Something went wrong',
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
    });
  }
}

function handleProductionError(err, req, res) {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const status = err.isOperational ? err.status : 'error';
  const message = err.isOperational ? err.message : 'Encountered an error! Please try again later.';

  if (req.originalUrl.startsWith('/api')) {
    res.status(statusCode).json({
      status,
      message,
      requestedAt: req.requestedAt,
      data: null,
    });
  } else {
    res.status(statusCode).render('pages/error', {
      title: 'Something went wrong',
      statusCode,
      message,
    });
  }
}

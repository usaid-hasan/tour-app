import { env } from 'node:process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { authHandler, bookingHandler, errorHandler } from '#handlers';
import { bookingRouter, reviewRouter, tourRouter, userRouter, viewRouter } from '#routes';
import AppError from '#utils/app-error.js';

const app = express();

/* Set the x-forwarded-* header when the app is behind a proxy */
app.set('trust proxy', env.ADAPTABLE_TRUST_PROXY_DEPTH);

/* Set the template engine to nunjucks extension */
app.set('view engine', 'njk');

/* Log the request to the console (only in development mode) */
if (env.NODE_ENV === 'development') app.use(morgan('dev'));

/* Limit the number of API calls to 25/min */
app.use('/api', rateLimit({
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: () => ({
    status: 'fail',
    message: 'Too many requests!! You can only make 25 requests every minute.',
  }),
}));

/* Use public folder for serving static files */
app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), '..', 'public')));

/* Set the cors policy */
app.use(cors());

/* Enable preflight cors */
app.options('*', cors());

/* Set security policy headers */
app.use(helmet.contentSecurityPolicy({
  directives: {
    'default-src': ["'self'", '*.stripe.com'],
    'script-src': ["'self'", "'unsafe-inline'", '*.unpkg.com', '*.stripe.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'fonts.gstatic.com'],
    'img-src': ['*', 'blob:'],
    'media-src': ['*'],
    'upgrade-insecure-requests': env.NODE_ENV === 'production' ? [] : null,
  },
}));

/* Webhook for stripe 'checkout.session.completed' event */
app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingHandler.webhookCheckout);

/* Creates the 'body' object on the request */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

/* Creates the 'cookie' object on the request */
app.use(cookieParser());

/* Sanitize the data */
app.use(mongoSanitize());

/* Compresses the response before sending */
app.use(compression());

/* Creates a 'requestedAt' field on the request object with request time */
app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

app.use(authHandler.isLoggedIn);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(404, `Can't find the requested path "${req.originalUrl}"`));
});

app.use(errorHandler);

export default app;

import { asyncMiddlewareWrapper } from '#utils/helpers.js';
import * as authMiddleware from './auth.js';
import * as bookingMiddleware from './booking.js';
import * as reviewMiddleware from './review.js';
import * as tourMiddleware from './tour.js';
import * as userMiddleware from './user.js';
import * as viewMiddleware from './view.js';

export { default as errorHandler } from './error.js';
export const authHandler = asyncMiddlewareWrapper(authMiddleware);
export const bookingHandler = asyncMiddlewareWrapper(bookingMiddleware);
export const reviewHandler = asyncMiddlewareWrapper(reviewMiddleware);
export const tourHandler = asyncMiddlewareWrapper(tourMiddleware);
export const userHandler = asyncMiddlewareWrapper(userMiddleware);
export const viewHandler = asyncMiddlewareWrapper(viewMiddleware);

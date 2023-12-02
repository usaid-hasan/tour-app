import { Router } from 'express';
import { authHandler, bookingHandler } from '#handlers';

const router = new Router({ mergeParams: true });

router.use(authHandler.protect);

router.get('/checkout-session/:id', bookingHandler.getCheckoutSession);

router.use(authHandler.restrictTo('admin'));

router.get('/', bookingHandler.getAllBookings);
router.get('/:id', bookingHandler.getBooking);

export default router;

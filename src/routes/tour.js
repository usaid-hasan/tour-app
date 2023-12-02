import { Router } from 'express';
import { authHandler, tourHandler } from '#handlers';
import reviewRouter from './review.js';
import bookingRouter from './booking.js';

const router = new Router();

router.get('/monthly-plan/:year', tourHandler.getMonthlyPlan);
router.get('/tours-within/:distance/center/:latlng/unit/:unit', tourHandler.getToursWithin);
router.get('/distances/:latlng/unit/:unit', tourHandler.getToursDistance);
router.get('/top-3-tours', tourHandler.getTopThree, tourHandler.getAllTours);
router.get('/tour-stats', tourHandler.getAvgRatings);
router.get('/tour-start-dates', tourHandler.getTourDates);

router
  .route('/')
  .get(tourHandler.getAllTours)
  .post(
    authHandler.protect,
    authHandler.restrictTo('admin', 'lead-guide'),
    tourHandler.createTour,
  );

router
  .route('/:id')
  .get(tourHandler.getTour)
  .patch(
    authHandler.protect,
    authHandler.restrictTo('admin', 'lead-guide'),
    tourHandler.updateTour,
  )
  .delete(
    authHandler.protect,
    authHandler.restrictTo('admin', 'lead-guide'),
    tourHandler.deleteTour,
  );

router.use('/:tour/reviews', reviewRouter);
router.use('/:tour/bookings', bookingRouter);

export default router;

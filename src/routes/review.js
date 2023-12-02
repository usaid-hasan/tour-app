import { Router } from 'express';
import { authHandler, reviewHandler } from '#handlers';

// For getting reviews for a specific tour use mergeParams
const router = new Router({ mergeParams: true });

router
  .route('/')
  .get(reviewHandler.getAllReviews)
  .post(
    authHandler.protect,
    authHandler.restrictTo('user'),
    reviewHandler.setTourAndUserId,
    reviewHandler.createReview,
  );

router
  .route('/:id')
  .get(reviewHandler.getReview)
  .patch(
    authHandler.protect,
    authHandler.restrictTo('user', 'admin'),
    reviewHandler.verifyUserForReview,
    reviewHandler.updateReview,
  )
  .delete(
    authHandler.protect,
    authHandler.restrictTo('user', 'admin'),
    reviewHandler.verifyUserForReview,
    reviewHandler.deleteReview,
  );

export default router;

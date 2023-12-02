import { Tour, Review } from '#models';
import AppError from '#utils/app-error.js';
import QueryProcessor from '#utils/query-processor.js';

/***************************************************************************/
/**
 * Set the tour and user id on the request body.
 */

export async function setTourAndUserId(req, res, next) {
  if (!req.body.tour && !req.params.tour) {
    return next(new AppError(400, 'You must provide a tour id with a review.'));
  }

  req.body.tour ||= req.params.tour;

  await Tour.exists({ _id: req.body.tour })
    .orFail(new AppError(400, 'No such tour exist. Please provide a valid tour id.'));

  req.body.user = req.user.id;
  return next();
}

/***************************************************************************/
/**
 * Check if the review being updated is made by the same user except for admin.
 */

export async function verifyUserForReview(req, res, next) {
  if (req.user.role === 'admin') return next();

  await Review.exists({ _id: req.params.id, user: req.user.id })
    .orFail(new AppError(403, 'Review does not exist or you do not have the permission to modify it.'));

  return next();
}

/***************************************************************************/
/**
 * Get all the reviews.
 */

export async function getAllReviews(req, res) {
  const getSecretTour = req.user ? req.user.role !== 'user' : false;
  const getInactiveUser = req.user ? req.user.role === 'admin' : false;

  // To get reviews from a specific tour
  const { tour } = req.params;
  const queryProcessor = new QueryProcessor(Review.find(tour ? { tour } : {}), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const query = queryProcessor.query
    .populate([
      { path: 'user', select: 'name photo', options: { getInactiveUser } },
      { path: 'tour', select: 'name', options: { getSecretTour } },
    ]);

  const reviews = await query;

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: reviews.length,
    data: { reviews },
  });
}

/***************************************************************************/
/**
 * Get a single review.
 */

export async function getReview(req, res, next) {
  const getSecretTour = req.user ? req.user.role !== 'user' : false;
  const getInactiveUser = req.user ? req.user.role === 'admin' : false;

  const query = Review.findById(req.params.id)
    .populate([
      { path: 'user', select: 'name photo', options: { getInactiveUser } },
      { path: 'tour', select: 'name', options: { getSecretTour } },
    ]);

  const review = await query;

  if (!review) return next(new AppError(404, 'No review with this ID exists'));

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    data: { review },
  });
}

/***************************************************************************/
/**
 * Create a new review.
 */

export async function createReview(req, res, next) {
  const review = await Review.create(req.body);
  if (!review) return next(new AppError(400, 'Bad Request'));

  return res.status(201).json({
    status: 'success',
    message: 'Your feedback is appreciated',
    requestedAt: req.requestedAt,
    data: { review },
  });
}

/***************************************************************************/
/**
 * Update a review.
 */

export async function updateReview(req, res, next) {
  const review = await Review.findById(req.params.id)
    .populate([
      { path: 'user', select: 'name photo', options: { getInactiveUser: false } },
      { path: 'tour', select: 'name', options: { getSecretTour: false } },
    ]);

  if (!review) return next(new AppError(404, 'No review with this ID exists'));

  review.review = req.body.review || review.review;
  review.rating = req.body.rating || review.rating;

  await review.save();

  return res.status(200).json({
    status: 'success',
    message: 'Your review has been updated successfully',
    requestedAt: req.requestedAt,
    data: { review },
  });
}

/***************************************************************************/
/**
 * Delete a review.
 */

export async function deleteReview(req, res, next) {
  const review = await Review.findById(req.params.id)
    .populate([
      { path: 'user', select: 'name photo', options: { getInactiveUser: false } },
      { path: 'tour', select: 'name', options: { getSecretTour: false } },
    ]);

  if (!review) return next(new AppError(404, 'No review with this ID exists'));

  await review.deleteOne();

  return res.status(200).json({
    status: 'success',
    message: 'Your review has been deleted',
    requestedAt: req.requestedAt,
    data: null,
  });
}

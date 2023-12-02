/* eslint-disable no-invalid-this, no-param-reassign */
import { Schema, model } from 'mongoose';
import AppError from '#utils/app-error.js';
import Tour from './tour.js';

const reviewSchema = new Schema({
  review: {
    type: String,
    trim: true,
    minlength: [3, "'review' must have atleast 3 characters"],
    maxlength: [320, "'review' must have not more than 320 characters"],
    required: [true, 'A review can not be empty'],
  },
  rating: {
    type: Number,
    min: [1, "'rating' must be above 1. Value given {VALUE}"],
    max: [5, "'rating' must be below 5. Value given {VALUE}"],
    required: [true, 'A review must have a rating'],
    set: (val) => Math.round(val),
  },
  tour: {
    type: Schema.ObjectId,
    ref: 'Tour',
    immutable: true,
    required: [true, 'A review must belong to a tour'],
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    immutable: true,
    required: [true, 'A review must belong to a user'],
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => { delete ret._id; },
  },
  statics: {
    // Calculate the number of reviews and avg rating on a given tour
    async calculateAvgRating(tour) {
      const stats = await this.aggregate([
        { $match: { tour } },
        {
          $group: {
            _id: null,
            numReviews: { $count: {} },
            avgRating: { $avg: '$rating' },
          },
        },
      ]);

      if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tour, {
          ratingsAverage: stats[0].avgRating,
          ratingsQuantity: stats[0].numReviews,
        });
      } else {
        await Tour.findByIdAndUpdate(tour, {
          ratingsAverage: 4.5,
          ratingsQuantity: 0,
        });
      }
    },
  },
});

/* ******* Indexes ******* */

/* Prevents a user from making more than one review */
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/* ******* Document Middleware ******* */

reviewSchema.post(/save|findOneAndUpdate/, function preventMoreThanOneReview(err, doc, next) {
  if (err.code === 11000) return next(new AppError(400, 'You can review each tour only once.'));
  return next();
});

/**
 * Updates the ratings avg and number on tour every time a review
 * is updated or deleted on that tour.
 */
reviewSchema.post(
  /save|findOneAnd|deleteOne/,
  { document: true, query: false },
  async function updateTourRatings(doc, next) {
    await doc?.constructor.calculateAvgRating(doc.tour._id);
    next();
  },
);

/* ******* Query Middleware ******* */

/* Filter the reviews which contain null values for tour and user */
reviewSchema.pre('find', function filterReviews(next) {
  this.transform((reviews) => {
    reviews = reviews.filter((review) => review.tour !== null && review.user !== null);
    if (!this.locals) return reviews;

    return reviews.map((review) => {
      review = review.toJSON();

      if (!this.locals.includes('tour')) delete review.tour;
      if (!this.locals.includes('user')) delete review.user;
      return review;
    });
  });
  next();
});

/* Hide the review if it contains null values */
reviewSchema.post('findOne', function hideReviews(review, next) {
  if (!review || review.tour === null || review.user === null) {
    return next(new AppError(404, 'No document with this ID exists'));
  }
  return next();
});

export default model('Review', reviewSchema);

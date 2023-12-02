import { Tour } from '#models';
import AppError from '#utils/app-error.js';
import QueryProcessor from '#utils/query-processor.js';

/***************************************************************************/
/**
 * Get all tours.
 */

export async function getAllTours(req, res) {
  const getSecretTour = req.user ? req.user.role !== 'user' : false;

  const queryProcessor = new QueryProcessor(Tour.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const tours = await queryProcessor.query.setOptions({ getSecretTour })
    .populate([{ path: 'guides', select: 'name photo', match: { active: true } }]);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: tours.length,
    data: { tours },
  });
}

/***************************************************************************/
/**
 * Get a single tour.
 */

export async function getTour(req, res, next) {
  const getSecretTour = req.user ? req.user.role !== 'user' : false;

  const tour = await Tour.findById(req.params.id)
    .setOptions({ getSecretTour })
    .populate([
      { path: 'guides', select: 'name photo', match: { active: true } },
      { path: 'reviews', select: 'review rating user', populate: { path: 'user', select: 'name photo' } },
    ]);

  if (!tour) return next(new AppError(404, 'No tour with this ID exists'));

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    data: { tour },
  });
}

/***************************************************************************/
/**
 * Create a new tour.
 */

export async function createTour(req, res, next) {
  const tour = await Tour.create(req.body);
  if (!tour) return next(new AppError(400, 'Bad Request'));

  return res.status(201).json({
    status: 'success',
    message: 'The tour is successfully created',
    requestedAt: req.requestedAt,
    data: { tour },
  });
}

/***************************************************************************/
/**
 * Update a tour.
 */

export async function updateTour(req, res, next) {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body)
    .setOptions({
      new: true,
      runValidators: true,
      getSecretTour: true,
    });

  if (!tour) return next(new AppError(404, 'No tour with this ID exists'));

  return res.status(200).json({
    status: 'success',
    message: 'The tour is successfully updated',
    requestedAt: req.requestedAt,
    data: { tour },
  });
}

/***************************************************************************/
/**
 * Deactivate a tour.
 */

export async function deleteTour(req, res, next) {
  const tour = await Tour.findByIdAndUpdate(req.params.id, { active: false })
    .setOptions({ getSecretTour: true });

  if (!tour) return next(new AppError(404, 'No tour with this ID exists'));

  return res.status(200).json({
    status: 'success',
    message: 'The tour is successfully deleted',
    requestedAt: req.requestedAt,
    data: null,
  });
}

/***************************************************************************/
/**
 * Get top three tours based on ratings.
 */
export function getTopThree(req, res, next) {
  req.query = { limit: '3', sort: '-ratingsAverage,price' };
  return next();
}

/***************************************************************************/
/**
 * Calculate average of all the ratingsAverage.
 */

export async function getAvgRatings(req, res) {
  const stats = await Tour.aggregate([
    {
      $group: {
        _id: 'Stats for all tours',
        allTours: { $count: {} },
        allReviews: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
  ]);

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    data: { stats },
  });
}

/***************************************************************************/
/**
 * Get tours for each date.
 */

export async function getTourDates(req, res) {
  const tours = await Tour.aggregate([
    { $unwind: '$startDates' },
    { $sort: { startDates: 1 } },
    { $project: { name: 1, startDates: 1 } },
  ]);

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: tours.length,
    data: { tours },
  });
}

/***************************************************************************/
/**
 * Get tours for each month in a given year.
 */

export async function getMonthlyPlan(req, res) {
  const { year } = req.params;
  const yearStart = new Date(year);
  const yearEnd = new Date(String(Number(year) + 1));

  const monthlyPlan = await Tour.aggregate([
    { $unwind: '$startDates' },
    { $match: { startDates: { $gte: yearStart, $lt: yearEnd } } },
    {
      $group: {
        _id: { $dateToString: { format: '%m-%Y', date: '$startDates' } },
        numTours: { $count: {} },
        tours: { $push: '$name' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: monthlyPlan.length,
    data: { monthlyPlan },
  });
}

/***************************************************************************/
/**
 * Get tours startLocation within a given location radius.
 */

export async function getToursWithin(req, res, next) {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',').map((n) => Number(n));

  // || lat < -90 || lat > 90 || lng < -180 || lng > 180)
  if (!lat || !lng) return next(new AppError(400, 'Please provide valid coordinates for your location'));

  const radius = (unit === 'mi') ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: tours.length,
    data: { tours },
  });
}

/***************************************************************************/
/**
 * Get the distance of each tour location from a given location.
 */

export async function getToursDistance(req, res, next) {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',').map((n) => Number(n));

  if (!lat || !lng) return next(new AppError(400, 'Please provide valid coordinates for your location'));

  const multiplier = (unit === 'mi') ? 0.000621371 : 0.001;
  const distance = (unit === 'mi') ? 'miles' : 'kilometers';

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: distance,
        distanceMultiplier: multiplier,
        query: { active: { $ne: false }, secretTour: false },
      },
    },
    {
      $project: {
        name: 1,
        yourLocation: [lat, lng],
        startLocation: '$startLocation.coordinates',
        [distance]: 1,
      },
    },
  ]);

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: tours.length,
    data: { tours },
  });
}

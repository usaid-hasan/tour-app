import { env } from 'node:process';
import { Tour, Booking, Review } from '#models';
import AppError from '#utils/app-error.js';

/***************************************************************************/
/**
 * Check the request query for any alert notification.
 */

export function renderAlert(req, res, next) {
  const { alert } = req.query;
  if (!alert) return next();

  switch (alert) {
    case 'booking':
      res.locals.alert = {
        type: 'success',
        time: 8,
        message: "Your booking was successful. If your booking doesn't show up immediately, come back later",
      };
      break;
    default:
      break;
  }
  return next();
}

/***************************************************************************/
/**
 * Render home page.
 */

export async function renderHomePage(req, res) {
  const tours = await Tour.find().sort('-ratingsAverage').limit(3);
  return res.status(200).render('pages/home', {
    title: 'Home',
    tours,
  });
}

/***************************************************************************/
/**
 * Render all tours page.
 */

export async function renderAllToursPage(req, res) {
  const tours = await Tour.find().sort('-ratingsAverage');

  return res.status(200).render('pages/all-tours', {
    title: 'All our tours',
    tours,
  });
}

/***************************************************************************/
/**
 * Render tour page based on the provided slug.
 */

export async function renderTourPage(req, res, next) {
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate([
      { path: 'guides', select: 'name photo role', match: { active: true } },
      {
        path: 'reviews',
        select: 'review rating user',
        populate: { path: 'user', select: 'name photo' },
        options: { sort: { createdAt: -1 } },
      },
    ]);

  if (!tour) return next(new AppError(404, 'No such tour exists'));

  const canPostReview = !tour.reviews.some((review) => review.user.id === req.user?.id);

  return res.status(200).render('pages/tour', {
    title: tour.name,
    tour,
    mapUrl: env.MAP_URL,
    mapAttr: env.MAP_ATTRIBUTION,
    canPostReview,
  });
}

/***************************************************************************/
/**
 * Render signin page.
 */

export function renderSigninPage(req, res) {
  res.status(200).render('pages/login', { title: 'Log in to your account' });
}

/***************************************************************************/
/**
 * Render signup page.
 */

export function renderSignupPage(req, res) {
  res.status(200).render('pages/signup', { title: 'Create your account' });
}

/***************************************************************************/
/**
 * Render forgot password page.
 */

export function renderForgotPasswordPage(req, res) {
  res.status(200).render('pages/forgot', { title: 'Your email address' });
}

/***************************************************************************/
/**
 * Render reset password page.
 */

export function renderResetPasswordPage(req, res) {
  res.status(200).render('pages/reset', { title: 'Reset your password' });
}

/***************************************************************************/
/**
 * Render account dashboard page.
 */

export function renderAccountPage(req, res) {
  res.status(200).render('pages/account', {
    title: 'Manage account settings',
    account: true,
    sidebar: true,
  });
}

/***************************************************************************/
/**
 * Render security settings page.
 */

export function renderSecurityPage(req, res) {
  res.status(200).render('pages/security', {
    title: 'Manage account security',
    security: true,
    sidebar: true,
  });
}

/***************************************************************************/
/**
 * Render bookings page.
 */

export async function renderBookingsPage(req, res) {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIds = bookings.map((el) => el.tour._id);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  return res.status(200).render('pages/bookings', {
    title: 'Your bookings',
    tours,
    myBookings: true,
    sidebar: true,
  });
}

/***************************************************************************/
/**
 * Render reviews page.
 */

export async function renderReviewsPage(req, res) {
  const reviews = await Review.find({ user: req.user.id })
    .populate([
      { path: 'user', select: 'name photo' },
      { path: 'tour', select: 'name slug' },
    ]);

  return res.status(200).render('pages/reviews', {
    title: 'Your reviews',
    reviews,
    myReviews: true,
    sidebar: true,
  });
}

/* eslint-disable camelcase */
import { env } from 'node:process';
import Stripe from 'stripe';
import { Tour, User, Booking } from '#models';
import AppError from '#utils/app-error.js';
import QueryProcessor from '#utils/query-processor.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

/***************************************************************************/
/**
 * Create a new stripe checkout session and sends it in response.
 */

export async function getCheckoutSession(req, res, next) {
  const tour = await Tour.findById(req.params.id);
  if (!tour) return next(new AppError(404, 'No such tour exists'));

  const session = await stripe.checkout.sessions.create({
    success_url: `${req.protocol}://${req.get('host')}/bookings?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    mode: 'payment',
    client_reference_id: req.params.id,
    customer_email: req.user.email,
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          unit_amount: (tour.priceDiscount ?? tour.price) * 100,
          currency: env.CURRENCY_CODE,
          product_data: {
            name: tour.name,
            description: tour.summary,
            images: [
              env.NODE_ENV === 'production' ? `${env.ASSET_DIR_TOUR}${tour.imageCover}-960.webp` : env.STRIPE_PHOTO,
            ],
          },
        },
      },
    ],
  });

  return res.status(200).json({
    status: 'success',
    message: 'You will shortly be directed to your payment checkout',
    requestedAt: req.requestedAt,
    data: { session },
  });
}

/***************************************************************************/
/**
 * Webhook used by stripe to send confirmation of payment. Creates a booking.
 */

export async function webhookCheckout(req, res) {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.amount_total / 100;

    await Booking.create({ tour, user, price });
  }

  res.status(200).json({ recieved: true });
}

/***************************************************************************/
/**
 * Get all bookings.
 */

export async function getAllBookings(req, res) {
  // To get bookings from a specific tour
  const { tour } = req.params;
  const queryProcessor = new QueryProcessor(Booking.find(tour ? { tour } : {}), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const query = queryProcessor.query
    .populate([
      { path: 'user', select: 'name photo', options: { getInactiveUser: true } },
      { path: 'tour', select: 'name', options: { getSecretTour: true } },
    ]);

  const bookings = await query;

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: bookings.length,
    data: { bookings },
  });
}

/***************************************************************************/
/**
 * Get a single booking.
 */

export async function getBooking(req, res, next) {
  const query = Booking.findById(req.params.id)
    .populate([
      { path: 'user', select: 'name photo', options: { getInactiveUser: true } },
      { path: 'tour', select: 'name', options: { getSecretTour: true } },
    ]);

  const booking = await query;

  if (!booking) return next(new AppError(404, 'No booking with this ID exists'));

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    data: { booking },
  });
}

/* eslint-disable no-invalid-this, no-param-reassign */
import { Schema, model } from 'mongoose';
import slugify from 'slugify';
import User from './user.js';

const locationPointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
  description: String,
  address: String,
  day: Number,
}, { _id: false });

const tourSchema = new Schema({
  name: {
    type: String,
    required: [true, "A tour must have a 'name'"],
    unique: true,
    trim: true,
  },
  slug: String,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  duration: {
    type: Number,
    min: [1, "'duration' of tour must be atleast 1 day. Value given '{VALUE}'"],
    required: [true, "A tour must have a 'duration'"],
  },
  price: {
    type: Number,
    min: [0, "'price' can not be less than 0. Value given '{VALUE}'"],
    required: [true, "A tour must have a 'price'"],
  },
  priceDiscount: {
    type: Number,
    min: [0, "'priceDiscount' can not be less than 0. Value given '{VALUE}'"],
    validate: {
      // 'this' points to the current document only when creating a new doc not for updating.
      validator(val) { return val < this.get('price'); },
      message: "'priceDiscount' should be less than price. Value given '{VALUE}'",
    },
  },
  maxGroupSize: {
    type: Number,
    min: [1, "'maxGroupSize' can not be less than 1. Value given '{VALUE}'"],
    required: [true, "A tour must have a 'maxGroupSIze'"],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    transform: (val) => Number(val.toFixed(1)),
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  summary: {
    type: String,
    trim: true,
    required: [true, "A tour must have a 'summary'"],
  },
  description: {
    type: String,
    trim: true,
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ut tincidunt dolor, scelerisque tempor est.\nVestibulum turpis nulla, aliquet dolor nec, porta tincidunt odio.',
  },
  imageCover: {
    type: String,
    default: 'tour-default.jpg',
  },
  images: {
    type: [String],
    default: Array(3).fill('tour-default.jpg'),
    validate: {
      validator(val) { return val.length <= 3; },
      message: "'images' exceeds the limit of 3",
    },
  },
  startDates: [Date],
  startLocation: { type: locationPointSchema },
  locations: [{ type: locationPointSchema }],
  guides: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  secretTour: {
    type: Boolean,
    default: false,
    select: false,
  },
}, {
  virtuals: {
    reviews: {
      options: {
        ref: 'Review',
        foreignField: 'tour',
        localField: '_id',
      },
    },
  },
  selectPopulatedPaths: false,
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => { delete ret._id; },
  },
});

/* ******* Indexes ******* */

tourSchema.index({ slug: 1 });
// Compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
// Geospatial index
tourSchema.index({ startLocation: '2dsphere' });

/* ******* Document Middleware ******* */

tourSchema.pre('save', function slugifyTourName(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function setRatingsOnNewTour(next) {
  if (!this.isNew) return next();
  this.ratingsAverage = 4.5;
  this.ratingsQuantity = 0;
  return next();
});

tourSchema.pre('save', async function filterNullGuides(next) {
  const guidesPromises = this.guides.map(async (guideId) => await User.findById(guideId));
  this.guides = (await Promise.all(guidesPromises)).filter((nullValue) => nullValue);
  next();
});

/* ******* Query Middleware ******* */

tourSchema.pre(/find/, function filterSecretTours(next) {
  if (this.options.getSecretTour) return next();
  this.find({ secretTour: false });
  return next();
});

tourSchema.pre(/find/, function filterInactiveTours(next) {
  this.find({ active: { $ne: false } });
  next();
});

/* ******* Aggregate Middleware ******* */

/**
 * Add a '$match' stage at the start of aggregate pipeline only if '$geoNear'
 * is not at the start, which creates problems with $geoNear as it needs to be
 * the first stage not $match.
 */
tourSchema.pre('aggregate', function shiftMatchOperator(next) {
  if (Object.keys(this.pipeline()[0]).includes('$geoNear')) return next();

  this.pipeline().unshift({ $match: { secretTour: { $ne: true }, active: { $ne: false } } });
  return next();
});

export default model('Tour', tourSchema);

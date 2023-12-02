/* eslint-disable no-param-reassign */
import { Schema, model } from 'mongoose';

const bookingSchema = new Schema({
  tour: {
    type: Schema.ObjectId,
    ref: 'Tour',
    immutable: true,
    required: [true, 'A booking must have a tour'],
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    immutable: true,
    required: [true, 'A booking must have a user'],
  },
  price: {
    type: Number,
    min: [0, 'Price can not be less than 0'],
    required: [true, 'A booking must have a price'],
  },
  paid: {
    type: Boolean,
    default: true,
    immutable: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  selectPopulatedPaths: false,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => { delete ret._id; },
  },
});

export default model('Booking', bookingSchema);

/* eslint-disable no-invalid-this, no-param-reassign, no-undefined */
import { Schema, model } from 'mongoose';
import validator from 'validator';
import ms from 'ms';
import { passwordHash, resetTokenHash } from '#utils/helpers.js';

const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    minlength: [3, "'name' must have atleast 3 characters"],
    required: [true, 'Please provide a username'],
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, 'Please provide a valid email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  photo: {
    type: String,
    default: 'default',
  },
  password: {
    type: String,
    minlength: [8, 'Password must be 8 characters long'],
    select: false,
    required: [true, 'Please provide a password'],
  },
  lastPasswordChangedAt: {
    type: Number,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetTokenExpiresAt: {
    type: Number,
    select: false,
  },
}, {
  methods: {
    async createPasswordResetToken(resetToken) {
      this.passwordResetToken = resetTokenHash(resetToken);
      this.passwordResetTokenExpiresAt = Date.now() + ms('10m');

      return await this.save({ validateBeforeSave: false });
    },
  },
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => { delete ret._id; },
  },
});

/* ******* Document Middleware ******* */

userSchema.pre('save', async function convertPasswordToHash(next) {
  if (!this.isModified('password')) return next();
  this.password = await passwordHash(this.password);
  return next();
});

userSchema.post('save', function removePasswordField(user, next) {
  user.password = undefined;
  return next();
});

/* ******* Query Middleware ******* */

userSchema.pre(/^find(?!OneAndDelete)/, function filterInactiveUsers(next) {
  if (this.options.getInactiveUser) return next();
  this.find({ active: true });
  return next();
});

export default model('User', userSchema);

/* eslint-disable no-undefined */
import { env } from 'node:process';
import { setTimeout } from 'node:timers/promises';
import { User } from '#models';
import AppError from '#utils/app-error.js';
import Email from '#utils/email.js';
import logger from '#utils/logger.js';
import {
  createJwtToken,
  verifyJwtToken,
  setJwtCookieOnRes,
  unsetJwtCookieOnRes,
  filterObject,
  passwordMatch,
  createResetToken,
  resetTokenHash,
} from '#utils/helpers.js';

/***************************************************************************/
/**
 * Check if a valid token exists. If it does the user belonging to the token
 * is populated on the req object which can be accessed by the protected routes
 * down the middleware stack.
 * If token doesn't exists or is invalid the error is stored on res.locals.
 * If the request ends on a protected route(authHandler.protect), this error
 * is thrown.
 */

export async function isLoggedIn(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer') ?
    req.headers.authorization.split(' ')[1]
    :
    req.cookies.jwt;

  if (!token) {
    res.locals.err = new AppError(401, 'You are not logged in. Please login to get access.');
    return next();
  }

  let decoded;
  try {
    decoded = await verifyJwtToken(token);
  } catch (err) {
    res.locals.err = err;
    return next();
  }

  const user = await User.findById(decoded.id).select('+lastPasswordChangedAt');
  if (!user) {
    res.locals.err = new AppError(401, 'The user belonging to this token no longer exists');
    return next();
  }

  // Check if the user has recently changed his password
  if (user.lastPasswordChangedAt && (user.lastPasswordChangedAt > (decoded.iat * 1000))) {
    res.locals.err = new AppError(401, 'Password change detected. Please login again.');
    return next();
  }

  // eslint-disable-next-line require-atomic-updates
  req.user = user;
  res.locals.user = user;
  res.locals.stripeKey = env.STRIPE_PUBLIC_KEY;
  return next();
}

/***************************************************************************/
/**
 * Check if a user is logged-in else throw the error stored in res.locals.err.
 * To be used on protected routes.
 */

export function protect(req, res, next) {
  if (!req.user) return next(res.locals.err);
  return next();
}

/***************************************************************************/
/**
 * Check if the user has authorization for the resource.
 */

export function restrictTo(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) return next();
    return next(new AppError(403, 'You do not have permission for this request'));
  };
}

/***************************************************************************/
/**
 * Verify login info (email and password) and return a token on success.
 */

export async function login(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError(400, 'Please provide the email and password'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !await passwordMatch(password, user.password)) {
    return next(new AppError(401, 'Incorrect email or password'));
  }

  const token = await createJwtToken(user.id);
  setJwtCookieOnRes(res, token);

  return res.status(200).json({
    status: 'success',
    message: 'You are logged in successfully',
    requestedAt: req.requestedAt,
    data: { token },
  });
}

/***************************************************************************/
/**
 * Logout the user by clearing the jwt cookie.
 */

export function logout(req, res) {
  unsetJwtCookieOnRes(res);

  return res.status(200).json({
    status: 'success',
    message: 'You are logged out successfully',
    requestedAt: req.requestedAt,
    data: null,
  });
}

/***************************************************************************/
/**
 * Create a new user from the data in request and return a login token..
 */

export async function signup(req, res, next) {
  const filteredBody = filterObject(req.body, 'name', 'email', 'password');
  const user = await User.create(filteredBody);
  if (!user) return next(new AppError(400, 'Bad Request'));

  const token = await createJwtToken(user.id);
  setJwtCookieOnRes(res, token);

  const dashboardUrl = `${req.protocol}://${req.get('host')}/account`;
  await new Email(user).sendWelcome(dashboardUrl).catch((err) => logger.error(err));

  return res.status(201).json({
    status: 'success',
    message: 'You have successfully created your account! Check your email for any queries.',
    requestedAt: req.requestedAt,
    data: { user, token },
  });
}

/***************************************************************************/
/**
 * Send an email with password reset token to the provided email address.
 */

export async function forgotPassword(req, res, next) {
  const { email } = req.body;
  if (!email) return next(new AppError(400, 'Please provide an email'));

  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetTokenExpiresAt');

  if (!user || (user.passwordResetToken && user.passwordResetTokenExpiresAt > Date.now())) {
    await setTimeout(Number(env.EMAIL_TIMEOUT));
    return res.status(200).json({
      status: 'success',
      message: 'Your reset token is sent to email. Token is valid for only (10) minutes.',
      requestedAt: req.requestedAt,
      data: null,
    });
  }

  const resetToken = await createResetToken();

  try {
    const url = `${req.protocol}://${req.get('host')}/reset-password/#${resetToken}`,
          apiUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

    const [{ messageId }] = await Promise.all([
      new Email(user).sendPasswordResetToken(url, apiUrl),
      setTimeout(Number(env.EMAIL_TIMEOUT)),
    ]);
    if (!messageId) throw new Error();
  } catch (err) {
    logger.error(err);
    return next(new AppError(500, 'Problem sending the email! Try again later.'));
  }

  await user.createPasswordResetToken(resetToken);

  return res.status(200).json({
    status: 'success',
    message: 'Your reset token is sent to email. Token is valid for only (10) minutes.',
    requestedAt: req.requestedAt,
    data: null,
  });
}

/***************************************************************************/
/**
 * Reset a password by using the reset token.
 */

export async function resetPassword(req, res, next) {
  const user = await User.findOne({
    passwordResetToken: resetTokenHash(req.params.token),
    passwordResetTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) return next(new AppError(400, 'Token is invalid or has expired'));

  const { password } = req.body;

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  user.lastPasswordChangedAt = Date.now();
  await user.save();

  const token = await createJwtToken(user.id);
  setJwtCookieOnRes(res, token);

  return res.status(200).json({
    status: 'success',
    message: 'Your password has been reset successfully',
    requestedAt: req.requestedAt,
    data: { token },
  });
}

/***************************************************************************/
/**
 * Update a user password.
 */

export async function updatePassword(req, res, next) {
  const user = await User.findById(req.user.id).select('+password');

  const { oldPassword, password } = req.body;
  if (!oldPassword) return next(new AppError(400, 'Please provide your old password'));

  if (!await passwordMatch(oldPassword, user.password)) {
    return next(new AppError(401, 'Incorrect password'));
  }

  user.password = password;
  user.lastPasswordChangedAt = Date.now();
  await user.save();

  const token = await createJwtToken(user.id);
  setJwtCookieOnRes(res, token);

  return res.status(200).json({
    status: 'success',
    message: 'Your password has been changed successfully',
    requestedAt: req.requestedAt,
    data: { token },
  });
}

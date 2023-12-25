import { env } from 'node:process';
import { createHash, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import ms from 'ms';
import bcrypt from 'bcrypt';

const randomBytesAsync = promisify(randomBytes);
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

/***************************************************************************/

/**
 * Recieves an async middleware function without a try-catch block to which
 * it attaches a catch handler and then returns it.
 * In case of promise rejection or throwing exception the catch handler
 * passes the exception object to the "next" parameter which triggers the
 * global error handler.
 * @param {function} fn - Async middleware function
 * @returns Function returned with a catch handler attached
 */
export const catchAsync = (fn) => Object.defineProperty((req, res, next) => { fn(req, res, next).catch(next); }, 'name', { value: fn.name });

/***************************************************************************/

/**
 * Recieves an object or an imported module containing middleware functions.
 * It returns a new object in which the async functions are wrapped with
 * catch handler. Normal functions are returned as is.
 * @param {Object} obj - Object or module containing middleware functions
 * @returns Object containing the same functions wrapped with catchAsync
 */
export function asyncMiddlewareWrapper(obj) {
  const newObj = {};
  for (const [name, fn] of Object.entries(obj)) {
    if (fn.constructor.name === 'AsyncFunction') {
      newObj[name] = catchAsync(fn);
    } else {
      newObj[name] = fn;
    }
  }
  return newObj;
}

/***************************************************************************/

/**
 * Creates a new object by filtering out the fields from the given object.
 * Returns the new object.
 * @param {Object} obj - An object with the fields that need to be filtered out
 * @param  {...string} fields - Fields to be filtered out
 * @returns The new filtered object
 */
export const filterObject = (obj, ...fields) => {
  const newObj = {};

  Object.keys(obj).forEach((field) => {
    if (fields.includes(field)) newObj[field] = obj[field];
  });

  return newObj;
};

/***************************************************************************/

/**
 * Creates a signed jwt token using the given id and secret.
 * @param {string} id MongoDb ObjectId or any unique id
 * @returns A signed jwt token string
 */
export async function createJwtToken(id) {
  const token = await new SignJWT({ id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(env.JWT_EXPIRY)
    .setIssuedAt(Date.now() + 1000)
    .sign(JWT_SECRET);

  return token;
}

/***************************************************************************/

/**
 * Verifies the token with the secret and returns the payload.
 * @param {string} token A jwt token string
 * @returns Payload decoded from the token
 */
export async function verifyJwtToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

/***************************************************************************/

/**
 * Sets the Cookie header with the jwt token on response object.
 * @param {Response} res Express response object
 * @param {string} token Jwt token string
 */
export function setJwtCookieOnRes(res, token) {
  res.cookie('jwt', token, {
    maxAge: ms(env.JWT_EXPIRY),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
}

/***************************************************************************/

/**
 * Clears the previously set cookie
 * @param {Response} res Express response object
 */
export function unsetJwtCookieOnRes(res) {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
}

/***************************************************************************/

/**
 * Compare the password and its hash
 * @param {string} password Normal password string
 * @param {string} hash Password hashed
 * @returns Result of comparing the password and hash
 */
export async function passwordMatch(password, hash) {
  return await bcrypt.compare(password, hash);
}

/***************************************************************************/

/**
 * Hash a given password
 * @param {string} password Normal password string
 * @returns Password string hashed
 */
export async function passwordHash(password) {
  const ROUNDS = 10;
  return await bcrypt.hash(password, ROUNDS);
}

/***************************************************************************/

/**
 * Hash a reset token with sha256
 * @param {string} resetToken
 * @returns Reset token hashed with sha256
 */
export function resetTokenHash(resetToken) {
  return createHash('sha256').update(resetToken).digest('hex');
}

/***************************************************************************/

/**
 * Creates and returns a reset token of random characters
 * @returns A string of random characters
 */
export async function createResetToken() {
  const SIZE = 32;
  return (await randomBytesAsync(SIZE)).toString('hex');
}

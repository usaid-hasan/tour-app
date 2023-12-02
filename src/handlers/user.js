/* eslint-disable camelcase */
import { env } from 'node:process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cloudinary from 'cloudinary';
import sharp from 'sharp';
import multer from 'multer';
import { User } from '#models';
import AppError from '#utils/app-error.js';
import QueryProcessor from '#utils/query-processor.js';
import { filterObject, unsetJwtCookieOnRes } from '#utils/helpers.js';

/***************************************************************************/
/**
 * Get all users.
 */

export async function getAllUsers(req, res) {
  const getInactiveUser = req.user ? req.user.role === 'admin' : false;

  const queryProcessor = new QueryProcessor(User.find(), req.query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const users = await queryProcessor.query.setOptions({ getInactiveUser });

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    results: users.length,
    data: { users },
  });
}

/***************************************************************************/
/**
 * Get a single user.
 */

export async function getUser(req, res, next) {
  const getInactiveUser = req.user && req.user.role === 'admin';

  const user = await User.findById(req.params.id).setOptions({ getInactiveUser });

  if (!user) return next(new AppError(404, 'No user with this ID exists'));

  return res.status(200).json({
    status: 'success',
    requestedAt: req.requestedAt,
    data: { user },
  });
}

/***************************************************************************/
/**
 * Get current user
 */

export function getMe(req, res, next) {
  req.params.id = req.user.id;
  next();
}

/***************************************************************************/
/**
 * Update user name, email and photo.
 */

export async function updateProfile(req, res, next) {
  if (req.body.password) {
    return next(new AppError(400, 'To update password please use /updatePassword'));
  }

  const filteredBody = filterObject(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    status: 'success',
    message: 'Your profile has been updated successfully',
    requestedAt: req.requestedAt,
    data: { user },
  });
}

/***************************************************************************/
/**
 * Deactivate a user account.
 */

export async function deleteProfile(req, res) {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  unsetJwtCookieOnRes(res);

  return res.status(200).json({
    status: 'success',
    message: 'Your account has been closed successfully',
    requestedAt: req.requestedAt,
    data: null,
  });
}

/***************************************************************************/
/**
 * Parse a multipart request containing an image file.
 */

export const getPhoto = multer({
  storage: multer.memoryStorage(),
  fileSize: 5000000,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError(400, 'Only images allowed'), false);
  },
}).single('photo');

/***************************************************************************/
/**
 * Resize and upload a user photo.
 */

export async function uploadPhoto(req, res, next) {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}`;

  const sharpObj = sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('webp')
    .webp({ quality: 90 });

  if (env.NODE_ENV === 'production') {
    const data = await sharpObj.toBuffer();
    try {
      await new Promise((resolve) => {
        cloudinary.v2.uploader.upload_stream({
          folder: env.CLOUDINARY_UPLOAD_DIR,
          public_id: req.file.filename,
          resource_type: 'image',
        }, (err, up) => resolve(up)).end(data);
      });
    } catch (err) {
      return next(new AppError(500, 'Problem uploading the photo! Try again later.'));
    }
  } else {
    const filePath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../public/',
      env.ASSET_DIR_USER,
      `${req.file.filename}.webp`,
    );

    await sharpObj.toFile(filePath);
  }
  return next();
}

import { Router } from 'express';
import { authHandler, userHandler } from '#handlers';

const router = new Router();

router.post('/signup', authHandler.signup);
router.post('/login', authHandler.login);
router.get('/logout', authHandler.logout);

router.post('/forgot-password', authHandler.forgotPassword);
router.patch('/reset-password/:token', authHandler.resetPassword);

router.use(authHandler.protect);

router.get('/me', userHandler.getMe, userHandler.getUser);
router.patch('/update-profile', userHandler.getPhoto, userHandler.uploadPhoto, userHandler.updateProfile);
router.patch('/update-password', authHandler.updatePassword);
router.delete('/delete-profile', userHandler.deleteProfile);

router.use(authHandler.restrictTo('admin'));

router.get('/', userHandler.getAllUsers);
router.get('/:id', userHandler.getUser);

export default router;

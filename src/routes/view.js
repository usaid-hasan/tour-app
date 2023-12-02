import { Router } from 'express';
import { authHandler, viewHandler } from '#handlers';

const router = new Router();

router.use(viewHandler.renderAlert);

router.get('/', viewHandler.renderHomePage);
router.get('/all-tours', viewHandler.renderAllToursPage);
router.get('/tour/:slug', viewHandler.renderTourPage);

router.get('/login', viewHandler.renderSigninPage);
router.get('/signup', viewHandler.renderSignupPage);
router.get('/forgot-password', viewHandler.renderForgotPasswordPage);
router.get('/reset-password', viewHandler.renderResetPasswordPage);

router.get('/account', authHandler.protect, viewHandler.renderAccountPage);
router.get('/security', authHandler.protect, viewHandler.renderSecurityPage);
router.get('/bookings', authHandler.protect, viewHandler.renderBookingsPage);
router.get('/reviews', authHandler.protect, viewHandler.renderReviewsPage);

export default router;

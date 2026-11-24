import express from 'express';
import { register, verifyOtp, resendOtp, login, setPassword, me } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { otpPerIp, otpPerEmail, loginPerIp } from '../middleware/rateLimits.js';

const router = express.Router();

router.post('/register', otpPerIp, otpPerEmail, register);
router.post('/verify-otp', loginPerIp, verifyOtp);
router.post('/resend-otp', otpPerIp, otpPerEmail, resendOtp);
router.post('/login', loginPerIp, login);
router.post('/set-password', setPassword);
router.get('/me', protect, me);

export default router;

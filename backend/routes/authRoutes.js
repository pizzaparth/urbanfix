import express from 'express';
import { register, verifyOtp, resendOtp, login, setPassword, me } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/set-password', setPassword);
router.get('/me', protect, me);

export default router;

import express from 'express';
import { apply, getDashboard, runQuery, exportData, getMe } from '../controllers/researchController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — no account is needed to apply.
router.post('/apply', apply);

router.use(protect);
router.get('/me', restrictTo('researcher'), getMe);
router.get('/dashboard', restrictTo('researcher', 'admin'), getDashboard);
router.get('/query', restrictTo('researcher', 'admin'), runQuery);
router.get('/export', restrictTo('researcher', 'admin'), exportData);

export default router;

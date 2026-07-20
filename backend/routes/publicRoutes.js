import express from 'express';
import { getPublicStats, getPublicComplaints } from '../controllers/publicController.js';

const router = express.Router();

router.get('/stats', getPublicStats);
router.get('/complaints', getPublicComplaints);

export default router;

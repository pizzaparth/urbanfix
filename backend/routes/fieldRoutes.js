import express from 'express';
import { getTasks, getTask, startTask, submitProof, getStats } from '../controllers/fieldController.js';
import { applyLeave, myLeave } from '../controllers/leaveController.js';
import { checkIn, checkOut, myAttendance } from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload, handleUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('field'));

router.get('/tasks', getTasks);
router.get('/tasks/:id', getTask);
router.patch('/tasks/:id/start', startTask);
router.post('/tasks/:id/proof', upload.array('images', 3), handleUploadErrors, submitProof);
router.get('/stats', getStats);

router.get('/leave', myLeave);
router.post('/leave', applyLeave);

router.get('/attendance', myAttendance);
router.post('/attendance/check-in', checkIn);
router.post('/attendance/check-out', checkOut);

export default router;

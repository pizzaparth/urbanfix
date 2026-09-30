import express from 'express';
import {
  getQueue, getComplaint, acceptComplaint, rejectComplaint, assignComplaint,
  closeComplaint, reworkComplaint, getFieldStaff, getStats,
} from '../controllers/supervisorController.js';
import { listPendingLeave, decideLeave, applyLeave, myLeave } from '../controllers/leaveController.js';
import { checkIn, checkOut, myAttendance } from '../controllers/attendanceController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// A supervisor's own leave and attendance (their leave is approved by an admin).
// Supervisor-only: an admin has no shifts to record.
router.get('/my-leave', restrictTo('supervisor'), myLeave);
router.post('/my-leave', restrictTo('supervisor'), applyLeave);
router.get('/attendance', restrictTo('supervisor'), myAttendance);
router.post('/attendance/check-in', restrictTo('supervisor'), checkIn);
router.post('/attendance/check-out', restrictTo('supervisor'), checkOut);

router.use(restrictTo('supervisor', 'admin'));

router.get('/queue', getQueue);
router.get('/complaints/:id', getComplaint);
router.patch('/complaints/:id/accept', acceptComplaint);
router.patch('/complaints/:id/reject', rejectComplaint);
router.patch('/complaints/:id/assign', assignComplaint);
router.patch('/complaints/:id/close', closeComplaint);
router.patch('/complaints/:id/rework', reworkComplaint);
router.get('/field-staff', getFieldStaff);
router.get('/stats', getStats);
router.get('/leave', listPendingLeave);
router.patch('/leave/:id', decideLeave);

export default router;

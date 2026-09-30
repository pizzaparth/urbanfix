import express from 'express';
import { getAdminStats, getAllComplaints, updateComplaintStatus, getActivityHeatmap } from '../controllers/adminController.js';
import {
  listUsers, createUser, updateUser, deactivateUser, reactivateUser,
  listApplications, decideApplication, getResearchAudit,
} from '../controllers/adminUserController.js';
import { listPendingLeave, decideLeave } from '../controllers/leaveController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all admin routes with authentication and admin role checks
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getAdminStats);
router.get('/activity-heatmap', getActivityHeatmap);
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);

router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/users/:id/reactivate', reactivateUser);

router.get('/research-applications', listApplications);
router.patch('/research-applications/:id', decideApplication);
router.get('/audit/research', getResearchAudit);

// Leave that has no supervisor to decide it — chiefly a supervisor's own.
router.get('/leave', listPendingLeave);
router.patch('/leave/:id', decideLeave);

export default router;

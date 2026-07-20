import express from 'express';
import { submitComplaint, requestComplaintOtp, getMyComplaints, getComplaintByTrackingId, downloadReceipt } from '../controllers/complaintController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload, handleUploadErrors } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public tracking lookup route
router.get('/track/:trackingId', getComplaintByTrackingId);

// Public download receipt endpoint
router.get('/download-receipt/:trackingId', downloadReceipt);

// Request email OTP for complaint submission
router.post('/request-otp', requestComplaintOtp);

// Submission accepts up to 3 image file uploads - public, verifies OTP inside
router.post('/', upload.array('images', 3), handleUploadErrors, submitComplaint);

// Protect subsequent routes to authenticated citizens only (for legacy dashboard or other)
router.use(protect);
router.use(restrictTo('citizen'));

router.get('/my-complaints', getMyComplaints);

export default router;

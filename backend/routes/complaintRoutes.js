import express from 'express';
import { submitComplaint, requestComplaintOtp, getMyComplaints, getComplaintByTrackingId, downloadReceipt } from '../controllers/complaintController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload, handleUploadErrors, stripImageMetadata } from '../middleware/uploadMiddleware.js';
import { otpPerIp, otpPerEmail, submitPerIp } from '../middleware/rateLimits.js';

const router = express.Router();

// Public tracking lookup route
router.get('/track/:trackingId', getComplaintByTrackingId);

// Public download receipt endpoint
router.get('/download-receipt/:trackingId', downloadReceipt);

// Request email OTP for complaint submission
router.post('/request-otp', otpPerIp, otpPerEmail, requestComplaintOtp);

// Submission accepts up to 3 image file uploads - public, verifies OTP inside
router.post('/', submitPerIp, upload.array('images', 3), handleUploadErrors, stripImageMetadata, submitComplaint);

// Protect subsequent routes to authenticated citizens only (for legacy dashboard or other)
router.use(protect);
router.use(restrictTo('citizen'));

router.get('/my-complaints', getMyComplaints);

export default router;

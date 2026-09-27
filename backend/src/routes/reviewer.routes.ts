import { Router } from 'express';
import {
  getReviewerQueue,
  getReviewPackage,
  verifyReport,
  rejectReport,
  requestInfoOnReport,
} from '../controllers/reviewer.controller';
import { requireAuth, requireReviewer } from '../middleware/auth.middleware';

const router = Router();

// Enforce Reviewer / Admin role authorization across all endpoints in this router
router.use(requireAuth);
router.use(requireReviewer);

// Reviewer queue with filters
router.get('/reports', getReviewerQueue);

// Full reviewer package (Report + Gemini signals + Trust telemetry + Corroboration + Contradictions)
router.get('/reports/:id', getReviewPackage);

// Human Review Decisions
router.post('/reports/:id/verify', verifyReport);
router.post('/reports/:id/reject', rejectReport);
router.post('/reports/:id/request-info', requestInfoOnReport);

export default router;

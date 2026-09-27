import { Router } from 'express';
import {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  recalculateReportTrust,
  reviewReport,
  uploadEvidenceForReport,
} from '../controllers/report.controller';
import { getReportCorrelations } from '../controllers/incident.controller';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { handleEvidenceUpload } from '../middleware/upload.middleware';

const router = Router();

// Routes
router.post('/', optionalAuth, createReport);
router.get('/', getReports);
router.get('/my', optionalAuth, getMyReports);
router.get('/:id', getReportById);
router.get('/:id/correlations', getReportCorrelations);
router.post('/:id/recalculate-trust', optionalAuth, recalculateReportTrust);
router.patch('/:id/review', optionalAuth, reviewReport);
router.post('/:id/review', optionalAuth, reviewReport);

// Evidence upload
router.post(
  '/:id/evidence',
  requireAuth,
  handleEvidenceUpload('evidence'),
  uploadEvidenceForReport
);

export default router;

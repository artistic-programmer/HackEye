import { Router } from 'express';
import {
  createReport,
  getReports,
  getMyReports,
  getReportById,
} from '../controllers/report.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Routes
router.post('/', optionalAuth, createReport);
router.get('/', getReports);
router.get('/my', optionalAuth, getMyReports);
router.get('/:id', getReportById);

export default router;

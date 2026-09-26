import { Router } from 'express';
import {
  createReport,
  getReports,
  getMyReports,
  getReportById,
} from '../controllers/report.controller';

const router = Router();

// Routes
router.post('/', createReport);
router.get('/', getReports);
router.get('/my', getMyReports);
router.get('/:id', getReportById);

export default router;

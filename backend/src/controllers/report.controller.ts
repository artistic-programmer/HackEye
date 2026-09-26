import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Report, ReportCategory } from '../models/Report';
import { User } from '../models/User';

const VALID_CATEGORIES: ReportCategory[] = [
  'Infrastructure',
  'Safety',
  'Environment',
  'Traffic',
  'Public Service',
  'Other',
];

// TEMPORARY: Development user mechanism for MVP stage.
// Real authentication (Google OAuth) will replace this in a future stage.
const getOrCreateDevUser = async () => {
  let devUser = await User.findOne({ email: 'dev_citizen@dailybugle.local' });
  if (!devUser) {
    devUser = await User.create({
      name: 'Anshu (Dev Reporter)',
      email: 'dev_citizen@dailybugle.local',
      role: 'USER',
      reputation: 64,
    });
  }
  return devUser;
};

// POST /api/reports - Create a civic report
export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, location, evidence } = req.body;

    // Validation: Title
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({
        success: false,
        message: 'Title is required and must be non-empty',
      });
      return;
    }

    // Validation: Description
    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({
        success: false,
        message: 'Description is required and must be non-empty',
      });
      return;
    }

    // Validation: Category
    if (!category || !VALID_CATEGORIES.includes(category as ReportCategory)) {
      res.status(400).json({
        success: false,
        message: `Category is required and must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
      return;
    }

    // Validation: Location
    if (!location || typeof location !== 'object' || !location.address || !location.address.trim()) {
      res.status(400).json({
        success: false,
        message: 'Location address is required',
      });
      return;
    }

    const reporterUser = (req as any).user || (await getOrCreateDevUser());

    const newReport = await Report.create({
      title: title.trim(),
      description: description.trim(),
      category,
      location: {
        address: location.address.trim(),
        latitude: typeof location.latitude === 'number' ? location.latitude : 0,
        longitude: typeof location.longitude === 'number' ? location.longitude : 0,
      },
      evidence: typeof evidence === 'string' ? evidence : '',
      reporter: reporterUser._id,
      status: 'UNDER_REVIEW', // Initial status required for all new reports
    });

    res.status(201).json({
      success: true,
      data: newReport,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating report',
    });
  }
};

// GET /api/reports - Return recent reports sorted newest first
export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, limit } = req.query;

    const filter: Record<string, any> = {};
    if (category && typeof category === 'string' && category !== 'All') {
      filter.category = category;
    }
    if (status && typeof status === 'string' && status !== 'All') {
      filter.status = status;
    }

    const maxResults = limit ? Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 100) : 50;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(maxResults)
      .populate('reporter', 'name avatar role reputation');

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching reports',
    });
  }
};

// GET /api/reports/my - Return reports by the current user (temporary dev user)
export const getMyReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const reporterUser = (req as any).user || (await getOrCreateDevUser());

    const reports = await Report.find({ reporter: reporterUser._id })
      .sort({ createdAt: -1 })
      .populate('reporter', 'name avatar role reputation');

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching your reports',
    });
  }
};

// GET /api/reports/:id - Return a single report by ID
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({
        success: false,
        message: 'Report not found',
      });
      return;
    }

    const report = await Report.findById(reportId).populate('reporter', 'name avatar role reputation');

    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching report by id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching report',
    });
  }
};

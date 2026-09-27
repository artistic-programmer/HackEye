import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Incident } from '../models/Incident';
import { Report } from '../models/Report';

/**
 * GET /api/incidents
 * Lists grouped real-world incidents with stats and timeline previews
 */
export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, page = '1', limit = '20' } = req.query;

    const filter: Record<string, any> = {};
    if (category && category !== 'All' && category !== 'ALL') {
      filter.category = category;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('primaryReport', 'title category location createdAt status trustAnalysis reporter')
        .populate('reports', 'title category createdAt status reporter evidence')
        .populate('contradictingReports', 'title category createdAt status')
        .exec(),
      Incident.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while fetching incidents',
    });
  }
};

/**
 * GET /api/incidents/:id
 * Returns single incident with full report timeline and corroboration dossier
 */
export const getIncidentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const incidentId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!incidentId || !mongoose.Types.ObjectId.isValid(incidentId)) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    const incident = await Incident.findById(incidentId)
      .populate({
        path: 'reports',
        populate: { path: 'reporter', select: 'name avatar role reputation' },
      })
      .populate({
        path: 'contradictingReports',
        populate: { path: 'reporter', select: 'name avatar role reputation' },
      })
      .populate('primaryReport')
      .exec();

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    console.error('Error fetching incident:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while fetching incident',
    });
  }
};

/**
 * GET /api/reports/:id/correlations
 * Returns related incident and corroboration details for a given citizen report
 */
export const getReportCorrelations = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const report = await Report.findById(reportId)
      .populate('reporter', 'name reputation role')
      .exec();

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    // Find parent incident if grouped
    let incident = null;
    if (report.incident) {
      incident = await Incident.findById(report.incident)
        .populate('reports', 'title category location status createdAt reporter')
        .populate('contradictingReports', 'title category location status createdAt reporter')
        .exec();
    }

    // Populate corroborating reports
    const corroboratingIds = report.trustAnalysis?.corroboratingReportIds || [];
    const validCorroborating = corroboratingIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const corroboratingReports = await Report.find({ _id: { $in: validCorroborating } })
      .populate('reporter', 'name reputation')
      .select('title category location status createdAt reporter evidence trustAnalysis')
      .exec();

    // Populate contradicting reports
    const contradictingIds = report.trustAnalysis?.contradictingReportIds || [];
    const validContradicting = contradictingIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const contradictingReports = await Report.find({ _id: { $in: validContradicting } })
      .populate('reporter', 'name reputation')
      .select('title category location status createdAt reporter evidence trustAnalysis')
      .exec();

    res.status(200).json({
      success: true,
      data: {
        reportId: report._id,
        incident,
        corroboratingReports,
        contradictingReports,
        corroborationCount: corroboratingReports.length,
        hasContradiction: contradictingReports.length > 0,
        explanation: report.trustAnalysis?.explanation || 'Pending calculation',
      },
    });
  } catch (error: any) {
    console.error('Error fetching report correlations:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while fetching correlations',
    });
  }
};

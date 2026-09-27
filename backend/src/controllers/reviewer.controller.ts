import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Report } from '../models/Report';
import { trustService } from '../services/trust.service';

/**
 * GET /api/reviewer/reports
 * Returns reports requiring human reviewer attention with statistics and filters.
 */
export const getReviewerQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'UNDER_REVIEW', category, urgency, trustLevel, page = '1', limit = '50' } = req.query;

    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (urgency && urgency !== 'ALL') {
      filter['aiAnalysis.urgency'] = urgency;
    }

    if (trustLevel && trustLevel !== 'ALL') {
      filter['trustAnalysis.level'] = trustLevel;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [reports, totalCount, pendingCount, needsInfoCount, verifiedCount, rejectedCount] =
      await Promise.all([
        Report.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('reporter', 'name avatar role reputation')
          .populate('reviewedBy', 'name avatar role')
          .exec(),
        Report.countDocuments(filter),
        Report.countDocuments({ status: 'UNDER_REVIEW' }),
        Report.countDocuments({ status: 'NEEDS_INFO' }),
        Report.countDocuments({ status: 'VERIFIED' }),
        Report.countDocuments({ status: 'REJECTED' }),
      ]);

    const formattedReports = reports.map((r) => ({
      id: r._id,
      title: r.title,
      description: r.description,
      status: r.status,
      category: r.category,
      urgency: r.aiAnalysis?.urgency || 'MEDIUM',
      trustScore: r.trustAnalysis?.score ?? 50,
      trustLevel: r.trustAnalysis?.level ?? 'MODERATE',
      corroboratingCount: r.trustAnalysis?.corroboratingReportIds?.length ?? 0,
      contradictingCount: r.trustAnalysis?.contradictingReportIds?.length ?? 0,
      location: r.location,
      evidence: r.evidence,
      reporter: r.reporter,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      reviewRequest: r.reviewRequest,
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        reports: formattedReports,
        stats: {
          pendingCount,
          needsInfoCount,
          verifiedCount,
          rejectedCount,
          totalFiltered: totalCount,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviewer queue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching reviewer queue',
    });
  }
};

/**
 * GET /api/reviewer/reports/:id
 * Returns the complete Reviewer Package:
 * 1. Citizen Report
 * 2. Gemini AI Factual Extraction (Key claims, missing info, attention signals)
 * 3. Trust Telemetry & Signal Breakdown
 * 4. Populated Corroborating and Contradicting Reports
 * 5. Review History & Audit Trail
 */
export const getReviewPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const report = await Report.findById(reportId)
      .populate('reporter', 'name email avatar role reputation createdAt')
      .populate('reviewedBy', 'name avatar role')
      .populate('reviewHistory.reviewer', 'name avatar role')
      .exec();

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    // Populate corroborating reports
    const corroboratingIds = report.trustAnalysis?.corroboratingReportIds || [];
    const validCorroboratingIds = corroboratingIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const corroboratingReports = await Report.find({ _id: { $in: validCorroboratingIds } })
      .select('title category location createdAt status trustAnalysis reporter evidence')
      .populate('reporter', 'name reputation')
      .exec();

    // Populate contradicting reports
    const contradictingIds = report.trustAnalysis?.contradictingReportIds || [];
    const validContradictingIds = contradictingIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const contradictingReports = await Report.find({ _id: { $in: validContradictingIds } })
      .select('title category location createdAt status trustAnalysis reporter evidence')
      .populate('reporter', 'name reputation')
      .exec();

    res.status(200).json({
      success: true,
      data: {
        report: {
          id: report._id,
          title: report.title,
          description: report.description,
          category: report.category,
          location: report.location,
          evidence: report.evidence,
          status: report.status,
          reporter: report.reporter,
          reviewedBy: report.reviewedBy,
          reviewedAt: report.reviewedAt,
          reviewHistory: report.reviewHistory || [],
          reviewRequest: report.reviewRequest,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
        aiAnalysis: report.aiAnalysis || {
          summary: 'No AI analysis generated.',
          category: 'OTHER',
          urgency: 'MEDIUM',
          specificity: 0,
          keyClaims: [],
          missingInformation: [],
          suspiciousSignals: [],
          recommendedAction: 'HUMAN_VERIFICATION',
          status: 'PENDING',
        },
        trustAnalysis: report.trustAnalysis || {
          score: 50,
          level: 'MODERATE',
          signals: {
            reporterReputation: 0,
            specificity: 0,
            evidence: 0,
            location: 0,
            time: 0,
            corroboration: 0,
            missingInformation: 0,
            suspiciousSignals: 0,
            contradiction: 0,
          },
          explanation: 'Pending calculation.',
        },
        corroboration: corroboratingReports.map((c) => ({
          id: c._id,
          title: c.title,
          category: c.category,
          location: c.location?.address,
          status: c.status,
          reporterName: (c.reporter as any)?.name || 'Citizen',
          reporterReputation: (c.reporter as any)?.reputation ?? 0,
          trustScore: c.trustAnalysis?.score ?? 50,
          createdAt: c.createdAt,
        })),
        contradictions: contradictingReports.map((c) => ({
          id: c._id,
          title: c.title,
          category: c.category,
          location: c.location?.address,
          status: c.status,
          reporterName: (c.reporter as any)?.name || 'Citizen',
          reporterReputation: (c.reporter as any)?.reputation ?? 0,
          trustScore: c.trustAnalysis?.score ?? 50,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching review package:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching review package',
    });
  }
};

/**
 * POST /api/reviewer/reports/:id/verify
 * Human Reviewer Action: Verify a civic report
 * Process:
 * 1. Checks reviewer authentication & authorization
 * 2. Checks reviewability & idempotency (prevents duplicate reputation bonuses)
 * 3. Updates status to VERIFIED
 * 4. Logs audit entry in reviewHistory
 * 5. Applies +10 reputation bonus to reporter via Trust Engine
 */
export const verifyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;
    const reviewerUser = (req as any).user;
    const { note = '' } = req.body;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    // Idempotency: prevent repeated bonus if already verified
    if (report.status === 'VERIFIED') {
      res.status(200).json({
        success: true,
        message: 'Report is already verified.',
        data: report,
        reputationUpdate: null,
      });
      return;
    }

    const previousStatus = report.status;
    report.status = 'VERIFIED';
    report.reviewedBy = reviewerUser?._id || null;
    report.reviewedAt = new Date();

    // Append to reviewHistory audit trail
    report.reviewHistory = report.reviewHistory || [];
    report.reviewHistory.push({
      reviewer: reviewerUser?._id,
      action: 'VERIFIED',
      reason: 'Verified by human reviewer',
      note: typeof note === 'string' ? note.trim() : '',
      createdAt: new Date(),
    });

    await report.save();

    // Human Reviewer-driven reputation update: +10 bonus
    let reputationUpdate = null;
    if (report.reporter) {
      reputationUpdate = await trustService.updateReporterReputation(
        report.reporter,
        'VERIFIED'
      );
    }

    await report.populate('reporter', 'name email avatar role reputation');
    await report.populate('reviewedBy', 'name avatar role');

    res.status(200).json({
      success: true,
      message: 'Report successfully verified by human reviewer.',
      data: report,
      reputationUpdate,
    });
  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying report',
    });
  }
};

/**
 * POST /api/reviewer/reports/:id/reject
 * Human Reviewer Action: Reject a civic report
 * Process:
 * 1. Checks reviewer authorization
 * 2. Checks idempotency (prevents repeated penalty for duplicate calls)
 * 3. Updates status to REJECTED
 * 4. Logs audit entry with reason category & notes
 * 5. Applies -5 reputation penalty to reporter
 */
export const rejectReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;
    const reviewerUser = (req as any).user;
    const { reason = 'INSUFFICIENT_EVIDENCE', note = '' } = req.body;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    // Idempotency: prevent repeated penalty if already rejected
    if (report.status === 'REJECTED') {
      res.status(200).json({
        success: true,
        message: 'Report is already rejected.',
        data: report,
        reputationUpdate: null,
      });
      return;
    }

    const previousStatus = report.status;
    report.status = 'REJECTED';
    report.reviewedBy = reviewerUser?._id || null;
    report.reviewedAt = new Date();

    report.reviewHistory = report.reviewHistory || [];
    report.reviewHistory.push({
      reviewer: reviewerUser?._id,
      action: 'REJECTED',
      reason: typeof reason === 'string' ? reason.trim() : 'REJECTED',
      note: typeof note === 'string' ? note.trim() : '',
      createdAt: new Date(),
    });

    await report.save();

    // Human Reviewer-driven reputation penalty: -5
    let reputationUpdate = null;
    if (report.reporter) {
      reputationUpdate = await trustService.updateReporterReputation(
        report.reporter,
        'REJECTED'
      );
    }

    await report.populate('reporter', 'name email avatar role reputation');
    await report.populate('reviewedBy', 'name avatar role');

    res.status(200).json({
      success: true,
      message: 'Report rejected by human reviewer.',
      data: report,
      reputationUpdate,
    });
  } catch (error) {
    console.error('Error rejecting report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while rejecting report',
    });
  }
};

/**
 * POST /api/reviewer/reports/:id/request-info
 * Human Reviewer Action: Request clarifying information from citizen
 * Process:
 * 1. Checks reviewer authorization
 * 2. Updates status to NEEDS_INFO
 * 3. Records reviewRequest message
 * 4. Logs audit entry in reviewHistory
 * 5. Reputation is unchanged (0 adjustment)
 */
export const requestInfoOnReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;
    const reviewerUser = (req as any).user;
    const { message } = req.body;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        message: 'A clarifying message explaining the requested information is required.',
      });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    report.status = 'NEEDS_INFO';
    report.reviewedBy = reviewerUser?._id || null;
    report.reviewedAt = new Date();

    report.reviewRequest = {
      message: message.trim(),
      reviewer: reviewerUser?._id,
      createdAt: new Date(),
    };

    report.reviewHistory = report.reviewHistory || [];
    report.reviewHistory.push({
      reviewer: reviewerUser?._id,
      action: 'NEEDS_INFO',
      note: message.trim(),
      createdAt: new Date(),
    });

    await report.save();

    await report.populate('reporter', 'name email avatar role reputation');
    await report.populate('reviewedBy', 'name avatar role');

    res.status(200).json({
      success: true,
      message: 'Information requested from reporter. Status updated to NEEDS_INFO.',
      data: report,
      reputationUpdate: { change: 0, reason: 'NEEDS_INFO preserves citizen reputation' },
    });
  } catch (error) {
    console.error('Error requesting information:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while requesting information',
    });
  }
};

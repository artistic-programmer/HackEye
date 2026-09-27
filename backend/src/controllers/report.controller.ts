import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Report, ReportCategory } from '../models/Report';
import { User } from '../models/User';
import { geminiService } from '../services/gemini.service';
import { trustService } from '../services/trust.service';
import { storageService } from '../services/storage.service';
import { incidentService } from '../services/incident.service';

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

    // 1. Create and persist report in MongoDB with initial PENDING status
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
      aiAnalysis: {
        summary: '',
        category: 'OTHER',
        urgency: 'MEDIUM',
        specificity: 0,
        keyClaims: [],
        missingInformation: [],
        suspiciousSignals: [],
        recommendedAction: 'HUMAN_VERIFICATION',
        model: geminiService.getModelName(),
        analyzedAt: null,
        status: 'PENDING',
        errorMessage: null,
      },
    });

    // 2. Perform Gemini 3.5 Flash-Lite AI analysis with graceful degradation
    try {
      const aiResult = await geminiService.analyzeReport({
        title: newReport.title,
        description: newReport.description,
        category: newReport.category,
        location: newReport.location,
        evidence: newReport.evidence || '',
      });

      newReport.aiAnalysis = {
        summary: aiResult.summary,
        category: aiResult.category,
        urgency: aiResult.urgency,
        specificity: aiResult.specificity,
        keyClaims: aiResult.keyClaims,
        missingInformation: aiResult.missingInformation,
        suspiciousSignals: aiResult.suspiciousSignals,
        recommendedAction: aiResult.recommendedAction,
        model: geminiService.getModelName(),
        analyzedAt: new Date(),
        status: 'COMPLETED',
        errorMessage: null,
      };
      await newReport.save();
    } catch (aiError: any) {
      console.error(
        `Gemini AI analysis failed for report ${newReport._id}:`,
        aiError?.message || aiError
      );
      newReport.aiAnalysis = {
        summary: '',
        category: 'OTHER',
        urgency: 'MEDIUM',
        specificity: 0,
        keyClaims: [],
        missingInformation: [],
        suspiciousSignals: [],
        recommendedAction: 'HUMAN_VERIFICATION',
        model: geminiService.getModelName(),
        analyzedAt: null,
        status: 'FAILED',
        errorMessage: aiError?.message || 'AI analysis failed',
      };
      await newReport.save();
    }

    // 3. Find corroborating/contradicting reports & calculate Trust Score
    try {
      const { corroborating, contradicting, isDuplicateSelfSubmission } =
        await trustService.findRelatedReports(newReport);

      const trustResult = trustService.calculateTrustScore(
        newReport,
        reporterUser?.reputation ?? 0,
        corroborating,
        contradicting,
        isDuplicateSelfSubmission
      );

      let explanation = trustResult.explanation;
      if (isDuplicateSelfSubmission) {
        explanation =
          'Duplicate submission by same reporter detected. Self-corroboration is excluded. ' +
          explanation;
      }

      newReport.trustAnalysis = {
        score: trustResult.score,
        level: trustResult.level,
        signals: trustResult.signals,
        corroboratingReportIds: trustResult.corroboratingReportIds,
        contradictingReportIds: trustResult.contradictingReportIds,
        calculatedAt: trustResult.calculatedAt,
        explanation,
      };
      await newReport.save();

      // Bidirectional Corroboration: update previously submitted reports
      if (corroborating.length > 0) {
        for (const existingReport of corroborating) {
          try {
            const related = await trustService.findRelatedReports(existingReport);
            const updatedTrust = trustService.calculateTrustScore(
              existingReport,
              (existingReport.reporter as any)?.reputation ?? 0,
              related.corroborating,
              related.contradicting
            );
            existingReport.trustAnalysis = {
              score: updatedTrust.score,
              level: updatedTrust.level,
              signals: updatedTrust.signals,
              corroboratingReportIds: updatedTrust.corroboratingReportIds,
              contradictingReportIds: updatedTrust.contradictingReportIds,
              calculatedAt: updatedTrust.calculatedAt,
              explanation: updatedTrust.explanation,
            };
            await existingReport.save();
          } catch (updateErr) {
            console.error('Error updating corroborating report trust:', updateErr);
          }
        }
      }
    } catch (trustError: any) {
      console.error(
        `Trust Engine calculation failed for report ${newReport._id}:`,
        trustError?.message || trustError
      );
    }

    // 4. Group report into real-world Incident (or create new incident)
    try {
      await incidentService.processReportForIncident(newReport);
    } catch (incidentError: any) {
      console.error(
        `Incident grouping failed for report ${newReport._id}:`,
        incidentError?.message || incidentError
      );
    }

    await newReport.populate('reporter', 'name avatar role reputation');
    await newReport.populate('incident', 'title status independentReportersCount');

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

// POST /api/reports/:id/recalculate-trust - Recalculate trust analysis on demand
export const recalculateReportTrust = async (req: Request, res: Response): Promise<void> => {
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

    const report = await Report.findById(reportId).populate('reporter');
    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found',
      });
      return;
    }

    const { corroborating, contradicting } = await trustService.findRelatedReports(report);
    const reporterReputation = (report.reporter as any)?.reputation ?? 0;
    const trustResult = trustService.calculateTrustScore(
      report,
      reporterReputation,
      corroborating,
      contradicting
    );

    report.trustAnalysis = {
      score: trustResult.score,
      level: trustResult.level,
      signals: trustResult.signals,
      corroboratingReportIds: trustResult.corroboratingReportIds,
      contradictingReportIds: trustResult.contradictingReportIds,
      calculatedAt: trustResult.calculatedAt,
      explanation: trustResult.explanation,
    };
    await report.save();

    await report.populate('reporter', 'name avatar role reputation');

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error recalculating trust score:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while recalculating trust score',
    });
  }
};

// PATCH or POST /api/reports/:id/review - Reviewer decision on a civic report
export const reviewReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { decision } = req.body;

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({
        success: false,
        message: 'Report not found',
      });
      return;
    }

    if (!['VERIFIED', 'REJECTED', 'NEEDS_INFO'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review decision. Must be one of: VERIFIED, REJECTED, NEEDS_INFO',
      });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found',
      });
      return;
    }

    const previousStatus = report.status;
    report.status = decision;
    await report.save();

    // Human Reviewer-driven reputation update:
    // When reviewer verifies (+10) or rejects (-5) a report, update reporter's historical reputation
    let reputationUpdate = null;
    if (previousStatus !== decision && report.reporter) {
      reputationUpdate = await trustService.updateReporterReputation(
        report.reporter,
        decision
      );
    }

    await report.populate('reporter', 'name avatar role reputation');

    res.status(200).json({
      success: true,
      message: `Report status updated to ${decision}`,
      data: report,
      reputationUpdate,
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while reviewing report',
    });
  }
};

/**
 * POST /api/reports/:id/evidence
 * Uploads media evidence (image or video) for a report.
 * Strictly enforces:
 * 1. User authentication
 * 2. Ownership (only report creator or REVIEWER/ADMIN can attach evidence)
 * 3. File presence & validation
 * 4. Storage via StorageService (Cloudinary or secure local)
 * 5. Saves rich evidence metadata to Report model
 * 6. Recalculates Trust Score with evidence presence signal
 */
export const uploadEvidenceForReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;
    const currentUser = (req as any).user;

    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: 'Authentication is required to upload evidence.',
      });
      return;
    }

    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    // Ownership check: Only report author or REVIEWER/ADMIN can modify evidence
    const isOwner = report.reporter && String(report.reporter) === String(currentUser._id);
    const isReviewerOrAdmin = currentUser.role === 'REVIEWER' || currentUser.role === 'ADMIN';

    if (!isOwner && !isReviewerOrAdmin) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. Only the report author or an authorized reviewer may attach evidence.',
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No evidence file uploaded. Please attach an image or video file.',
      });
      return;
    }

    // Store file via StorageService (Cloudinary or local storage)
    const storedEvidence = await storageService.uploadEvidence(file);

    // Save evidence metadata in MongoDB
    report.evidence = storedEvidence;

    // Recalculate Trust Score with newly attached evidence
    const reporterUser = await User.findById(report.reporter);
    const candidateRelated = await trustService.findRelatedReports({
      _id: report._id,
      title: report.title,
      description: report.description,
      category: report.category,
      location: report.location,
      reporter: report.reporter,
    });

    const trustResult = trustService.calculateTrustScore(
      {
        _id: report._id,
        title: report.title,
        description: report.description,
        category: report.category,
        location: report.location,
        evidence: report.evidence,
        aiAnalysis: report.aiAnalysis,
      },
      reporterUser?.reputation ?? 0,
      candidateRelated.corroborating,
      candidateRelated.contradicting
    );

    report.trustAnalysis = {
      score: trustResult.score,
      level: trustResult.level,
      signals: trustResult.signals,
      corroboratingReportIds: trustResult.corroboratingReportIds,
      contradictingReportIds: trustResult.contradictingReportIds,
      calculatedAt: trustResult.calculatedAt,
      explanation: trustResult.explanation,
    };

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Evidence successfully uploaded and attached to report.',
      data: {
        evidence: report.evidence,
        trustAnalysis: report.trustAnalysis,
      },
    });
  } catch (error: any) {
    console.error('Error uploading evidence for report:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Internal server error while uploading evidence',
    });
  }
};




import mongoose from 'mongoose';
import { Incident, IIncident } from '../models/Incident';
import { Report, IReport } from '../models/Report';
import { User } from '../models/User';
import { trustService } from './trust.service';

export interface GroupingScoreBreakdown {
  totalScore: number;
  locationScore: number;
  timeScore: number;
  categoryScore: number;
  textScore: number;
  isMatch: boolean;
  distanceMeters?: number;
}

export class IncidentService {
  private readonly GROUPING_THRESHOLD = 70; // Minimum score to associate reports into an incident
  private readonly MAX_DISTANCE_METERS = 800; // 800 meters max spatial cluster
  private readonly MAX_TIME_WINDOW_HOURS = 48; // 48 hours max temporal window

  /**
   * Calculates Haversine distance in meters between two lat/lng coordinates
   */
  public calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Evaluates relationship between a new report and an existing incident or candidate report
   */
  public evaluateGroupingScore(
    report: {
      category: string;
      location: { address?: string; latitude?: number; longitude?: number };
      description: string;
      createdAt?: Date;
    },
    candidate: {
      category: string;
      location: { address?: string; latitude?: number; longitude?: number };
      description: string;
      createdAt?: Date;
    }
  ): GroupingScoreBreakdown {
    let locationScore = 0;
    let distanceMeters: number | undefined = undefined;

    // 1. Geographic Proximity Signal (0 to 35 pts)
    const hasReportCoords =
      report.location?.latitude &&
      report.location?.longitude &&
      report.location.latitude !== 0 &&
      report.location.longitude !== 0;

    const hasCandidateCoords =
      candidate.location?.latitude &&
      candidate.location?.longitude &&
      candidate.location.latitude !== 0 &&
      candidate.location.longitude !== 0;

    if (hasReportCoords && hasCandidateCoords) {
      distanceMeters = this.calculateHaversineDistance(
        report.location.latitude!,
        report.location.longitude!,
        candidate.location.latitude!,
        candidate.location.longitude!
      );

      if (distanceMeters <= 300) {
        locationScore = 35; // Very close (<300m)
      } else if (distanceMeters <= 600) {
        locationScore = 25; // Close (<600m)
      } else if (distanceMeters <= this.MAX_DISTANCE_METERS) {
        locationScore = 15;
      }
    } else {
      // Fallback to text token matching on address
      const isAddressMatch = trustService.checkLocationMatch(report.location, candidate.location);
      if (isAddressMatch) {
        locationScore = 25;
      }
    }

    // 2. Temporal Proximity Signal (0 to 20 pts)
    let timeScore = 0;
    const timeA = report.createdAt ? new Date(report.createdAt).getTime() : Date.now();
    const timeB = candidate.createdAt ? new Date(candidate.createdAt).getTime() : Date.now();
    const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);

    if (diffHours <= 6) {
      timeScore = 20; // Within 6 hours
    } else if (diffHours <= 18) {
      timeScore = 15;
    } else if (diffHours <= this.MAX_TIME_WINDOW_HOURS) {
      timeScore = 10;
    }

    // 3. Category Compatibility Signal (0 to 20 pts)
    let categoryScore = 0;
    if (report.category === candidate.category) {
      categoryScore = 20;
    } else {
      const compatibleCategories: Record<string, string[]> = {
        Safety: ['Infrastructure', 'Traffic', 'Public Service'],
        Infrastructure: ['Safety', 'Traffic', 'Public Service'],
        Traffic: ['Safety', 'Infrastructure'],
        Environment: ['Safety', 'Public Service'],
      };
      if (compatibleCategories[report.category]?.includes(candidate.category)) {
        categoryScore = 10;
      }
    }

    // 4. Text & Semantic Claim Similarity (0 to 25 pts)
    let textScore = 0;
    const wordsA = trustService.extractIncidentKeywords(report.description);
    const wordsB = trustService.extractIncidentKeywords(candidate.description);

    if (wordsA.size > 0 && wordsB.size > 0) {
      const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
      const union = new Set([...wordsA, ...wordsB]);
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;

      // Critical keywords boost (e.g. fire, flood, broken, accident, water, smoke, leak)
      const criticalKeywords = new Set([
        'fire', 'smoke', 'flood', 'flooding', 'water', 'leak', 'accident',
        'crash', 'pothole', 'wire', 'explosion', 'collapsed', 'hazard', 'traffic'
      ]);
      const hasSharedCritical = [...intersection].some((w) => criticalKeywords.has(w));

      if (hasSharedCritical || jaccard >= 0.25) {
        textScore = Math.min(25, Math.round(jaccard * 30) + (hasSharedCritical ? 12 : 0));
      }
    }

    const totalScore = locationScore + timeScore + categoryScore + textScore;
    const isMatch = totalScore >= this.GROUPING_THRESHOLD;

    return {
      totalScore,
      locationScore,
      timeScore,
      categoryScore,
      textScore,
      isMatch,
      distanceMeters,
    };
  }

  /**
   * Main flow when a new report is submitted:
   * 1. Search recent active incidents within the time window.
   * 2. If matching incident found: associate report with that incident.
   * 3. Else: create a new Incident.
   * 4. Recalculate member report trust scores.
   */
  public async processReportForIncident(
    report: IReport
  ): Promise<{ incident: IIncident; isNewIncident: boolean }> {
    const timeLimit = new Date(Date.now() - this.MAX_TIME_WINDOW_HOURS * 60 * 60 * 1000);

    // Find active candidate incidents
    const candidateIncidents = await Incident.find({
      status: { $in: ['UNDER_REVIEW', 'VERIFIED'] },
      updatedAt: { $gte: timeLimit },
    })
      .populate('primaryReport')
      .exec();

    let bestIncident: IIncident | null = null;
    let highestScore = 0;

    for (const incident of candidateIncidents) {
      const primary = incident.primaryReport as any;
      if (!primary) continue;

      const evalResult = this.evaluateGroupingScore(
        {
          category: report.category,
          location: report.location,
          description: report.description,
          createdAt: report.createdAt,
        },
        {
          category: primary.category,
          location: primary.location,
          description: primary.description,
          createdAt: primary.createdAt,
        }
      );

      if (evalResult.isMatch && evalResult.totalScore > highestScore) {
        highestScore = evalResult.totalScore;
        bestIncident = incident;
      }
    }

    if (bestIncident) {
      // Associate with existing incident
      const reporterUser = report.reporter
        ? await User.findById(report.reporter).select('name reputation')
        : null;

      // Add to reports array if not already present
      const reportIdStr = report._id.toString();
      const existingReportIds = bestIncident.reports.map((id) => id.toString());
      if (!existingReportIds.includes(reportIdStr)) {
        bestIncident.reports.push(report._id as any);
      }

      // Add timeline entry
      bestIncident.timeline.push({
        reportId: report._id as any,
        reporterId: (report.reporter as any) || null,
        reporterName: reporterUser?.name || 'Citizen Reporter',
        title: report.title,
        timestamp: report.createdAt || new Date(),
        snippet: report.description.slice(0, 120),
      });

      // Check for contradiction against primary report
      const primary = bestIncident.primaryReport as any;
      if (primary && trustService.checkContradiction(report.description, primary.description)) {
        const contraIds = bestIncident.contradictingReports.map((id) => id.toString());
        if (!contraIds.includes(reportIdStr)) {
          bestIncident.contradictingReports.push(report._id as any);
        }
      }

      // Calculate independent reporters count (anti-abuse)
      const allReports = await Report.find({ _id: { $in: bestIncident.reports } }).select('reporter');
      const uniqueReporters = new Set<string>();
      allReports.forEach((r) => {
        if (r.reporter) uniqueReporters.add(r.reporter.toString());
      });
      bestIncident.independentReportersCount = Math.max(1, uniqueReporters.size);

      await bestIncident.save();

      // Link incident to report
      report.incident = bestIncident._id as any;
      await report.save();

      // Recalculate trust analysis for member reports in this incident
      await this.recalculateIncidentMemberTrust(bestIncident);

      return { incident: bestIncident, isNewIncident: false };
    }

    // No match: create new Incident
    const reporterUser = report.reporter
      ? await User.findById(report.reporter).select('name')
      : null;

    const newIncident = await Incident.create({
      title: report.title,
      summary: report.description.slice(0, 160),
      category: report.category,
      location: {
        address: report.location.address,
        latitude: report.location.latitude || 0,
        longitude: report.location.longitude || 0,
      },
      status: 'UNDER_REVIEW',
      primaryReport: report._id,
      reports: [report._id],
      contradictingReports: [],
      independentReportersCount: 1,
      timeline: [
        {
          reportId: report._id as any,
          reporterId: (report.reporter as any) || null,
          reporterName: reporterUser?.name || 'Citizen Reporter',
          title: report.title,
          timestamp: report.createdAt || new Date(),
          snippet: report.description.slice(0, 120),
        },
      ],
      trustScore: report.trustAnalysis?.score || 50,
    });

    report.incident = newIncident._id as any;
    await report.save();

    return { incident: newIncident, isNewIncident: true };
  }

  /**
   * Recalculates Trust Engine score for all reports in an incident
   */
  public async recalculateIncidentMemberTrust(incident: IIncident): Promise<void> {
    const reports = await Report.find({ _id: { $in: incident.reports } });

    for (const rep of reports) {
      const candidateRelated = await trustService.findRelatedReports({
        _id: rep._id,
        title: rep.title,
        description: rep.description,
        category: rep.category,
        location: rep.location,
        reporter: rep.reporter,
      });

      const reporterUser = rep.reporter ? await User.findById(rep.reporter) : null;

      const trustResult = trustService.calculateTrustScore(
        {
          _id: rep._id,
          title: rep.title,
          description: rep.description,
          category: rep.category,
          location: rep.location,
          evidence: rep.evidence,
          aiAnalysis: rep.aiAnalysis,
        },
        reporterUser?.reputation ?? 0,
        candidateRelated.corroborating,
        candidateRelated.contradicting
      );

      rep.trustAnalysis = {
        score: trustResult.score,
        level: trustResult.level,
        signals: trustResult.signals,
        corroboratingReportIds: trustResult.corroboratingReportIds,
        contradictingReportIds: trustResult.contradictingReportIds,
        calculatedAt: trustResult.calculatedAt,
        explanation: trustResult.explanation,
      };

      await rep.save();
    }
  }
}

export const incidentService = new IncidentService();

import {
  ITrustSignals,
  ITrustAnalysisResult,
  TrustLevel,
  TRUST_WEIGHTS,
  REPUTATION_RULES,
  IReportForTrust,
} from '../types/trust.types';
import { Report } from '../models/Report';
import { User } from '../models/User';

export class TrustService {
  /**
   * Signal 1: Reporter Credibility (0 to 15 points, or negative for known repeat offenders)
   * A new user receives 0 (neutral contribution).
   * Does NOT consider identity characteristics, email domain, or social status.
   */
  public calculateReporterReputation(reputation?: number | null): number {
    if (reputation === undefined || reputation === null || reputation === 0) {
      return 0; // Neutral contribution for new or unranked users
    }

    const { maxPoints, minPoints, establishedThreshold } = TRUST_WEIGHTS.reporterReputation;

    if (reputation > 0) {
      // Linear scaling up to establishedThreshold (e.g. 50 reputation -> 15 points)
      const ratio = Math.min(reputation / establishedThreshold, 1.0);
      return Math.round(ratio * maxPoints);
    } else {
      // Negative reputation from repeatedly rejected/spam reports (bounded down to minPoints)
      const ratio = Math.min(Math.abs(reputation) / establishedThreshold, 1.0);
      return Math.round(-ratio * Math.abs(minPoints));
    }
  }

  /**
   * Signal 2: Gemini Specificity (0 to 15 points)
   * Uses Gemini's factual specificity score (0–100).
   * High specificity = more concrete details for human verification.
   */
  public calculateSpecificityContribution(specificity?: number | null): number {
    if (specificity === undefined || specificity === null) {
      return 0;
    }
    const clamped = Math.max(0, Math.min(100, Number(specificity) || 0));
    return Math.round((clamped / 100) * TRUST_WEIGHTS.specificity.maxPoints);
  }

  /**
   * Signal 3: Supporting Evidence Presence (0 or 10 points)
   * Checks whether the citizen provided an attachment, photo, or document.
   */
  public calculateEvidenceContribution(evidence?: any): number {
    if (!evidence) return TRUST_WEIGHTS.evidence.noEvidencePoints;
    if (typeof evidence === 'string' && evidence.trim().length > 0) {
      return TRUST_WEIGHTS.evidence.hasEvidencePoints;
    }
    if (typeof evidence === 'object' && (evidence.url || evidence.publicId)) {
      return TRUST_WEIGHTS.evidence.hasEvidencePoints;
    }
    return TRUST_WEIGHTS.evidence.noEvidencePoints;
  }

  /**
   * Signal 4: Location Precision (0 to 10 points)
   * Exact GPS coordinates: 10
   * Specific street address / landmark: 8
   * General area: 4
   * None: 0
   */
  public calculateLocationContribution(location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  }): number {
    if (!location) return TRUST_WEIGHTS.location.noLocationPoints;

    const hasCoords =
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      location.latitude !== 0 &&
      location.longitude !== 0;

    if (hasCoords) {
      return TRUST_WEIGHTS.location.exactCoordinatesPoints;
    }

    const address = (location.address || '').trim().toLowerCase();
    if (!address) {
      return TRUST_WEIGHTS.location.noLocationPoints;
    }

    // Explicitly vague addresses provide no actionable location
    const vagueAddressRegex =
      /\b(somewhere|unknown|none|n\/a|not provided|someplace|nowhere)\b/i;
    if (vagueAddressRegex.test(address)) {
      return TRUST_WEIGHTS.location.noLocationPoints;
    }

    // Heuristic for specific address (contains road, st, lane, ave, chowk, square, sector, or numbers)
    const specificAddressRegex =
      /\b(street|st|road|rd|lane|ln|avenue|ave|chowk|square|sector|plot|block|near|opposite|opp|behind|unit)\b|\d+/i;

    if (specificAddressRegex.test(address) && address.length >= 10) {
      return TRUST_WEIGHTS.location.specificAddressPoints;
    }

    return TRUST_WEIGHTS.location.generalAreaPoints;
  }

  /**
   * Signal 5: Time Precision (0 to 5 points)
   * Specific time/date (e.g. "5:30 AM", "September 26"): 5
   * General relative time ("yesterday", "this morning"): 2
   * None: 0
   */
  public calculateTimeContribution(text: string): number {
    if (!text || typeof text !== 'string') return TRUST_WEIGHTS.time.noTimePoints;

    const specificTimeRegex =
      /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|\d{1,2}:\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})\b/i;

    if (specificTimeRegex.test(text)) {
      return TRUST_WEIGHTS.time.specificTimePoints;
    }

    const generalTimeRegex =
      /\b(yesterday|today|this morning|last night|earlier today|tonight|an hour ago|hours ago|just now|recently)\b/i;

    if (generalTimeRegex.test(text)) {
      return TRUST_WEIGHTS.time.generalTimePoints;
    }

    return TRUST_WEIGHTS.time.noTimePoints;
  }

  /**
   * Signal 6: Missing Information Penalty (0 to -10 points)
   * Each missing contextual item reduces score.
   */
  public calculateMissingInformationPenalty(missingInfo?: string[] | null): number {
    if (!Array.isArray(missingInfo) || missingInfo.length === 0) {
      return 0;
    }
    const penalty = missingInfo.length * TRUST_WEIGHTS.missingInformation.penaltyPerItem;
    return Math.max(TRUST_WEIGHTS.missingInformation.maxPenalty, penalty);
  }

  /**
   * Signal 7: Suspicious Signals Penalty (0 to -10 points)
   * Attention signals for human reviewers (vague wording, sensationalism).
   */
  public calculateSuspiciousSignalsPenalty(suspiciousSignals?: string[] | null): number {
    if (!Array.isArray(suspiciousSignals) || suspiciousSignals.length === 0) {
      return 0;
    }
    const penalty = suspiciousSignals.length * TRUST_WEIGHTS.suspiciousSignals.penaltyPerItem;
    return Math.max(TRUST_WEIGHTS.suspiciousSignals.maxPenalty, penalty);
  }

  /**
   * Signal 8: Independent Corroboration (0 to 20 points)
   * CRITICAL ANTI-ABUSE RULE:
   * Reports from the same reporter DO NOT count as independent corroboration.
   */
  public calculateCorroborationContribution(
    currentReporterId: string | undefined,
    corroboratingReports: Array<{ reporter?: any }>
  ): { contribution: number; independentCount: number } {
    if (!Array.isArray(corroboratingReports) || corroboratingReports.length === 0) {
      return { contribution: 0, independentCount: 0 };
    }

    // Filter out reports submitted by the same reporter
    const currentRepStr = currentReporterId ? String(currentReporterId) : '';
    const independentReports = corroboratingReports.filter((r) => {
      const matchRepStr = r.reporter ? String(r.reporter._id || r.reporter) : '';
      return matchRepStr && matchRepStr !== currentRepStr;
    });

    const independentCount = independentReports.length;
    if (independentCount === 0) {
      return { contribution: 0, independentCount: 0 };
    }

    if (independentCount === 1) {
      return {
        contribution: TRUST_WEIGHTS.corroboration.singleCorroborationPoints,
        independentCount: 1,
      };
    }

    return {
      contribution: TRUST_WEIGHTS.corroboration.multipleCorroborationPoints,
      independentCount,
    };
  }

  /**
   * Signal 9: Contradiction Penalty (0 to -15 points)
   * Conflicting reports signal that reviewer attention/investigation is needed.
   */
  public calculateContradictionPenalty(
    contradictingReports: Array<{ _id?: any }>
  ): number {
    if (!Array.isArray(contradictingReports) || contradictingReports.length === 0) {
      return 0;
    }

    const penalty =
      contradictingReports.length * TRUST_WEIGHTS.contradiction.penaltyPerContradiction;
    return Math.max(TRUST_WEIGHTS.contradiction.maxPenalty, penalty);
  }

  /**
   * Qualitative Trust Level determination.
   * Describes strength of available signals, NEVER factual truth.
   */
  public determineTrustLevel(score: number): TrustLevel {
    if (score >= 80) return 'STRONG';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Master Trust Calculation Function
   *
   * Formula:
   * score = baseScore (50)
   *       + reporterContribution
   *       + specificityContribution
   *       + evidenceContribution
   *       + locationContribution
   *       + timeContribution
   *       + corroborationContribution
   *       + missingInformationPenalty (negative)
   *       + suspiciousSignalPenalty (negative)
   *       + contradictionPenalty (negative)
   *
   * Clamped: 0 <= score <= 100
   */
  public calculateTrustScore(
    report: IReportForTrust,
    reporterReputation?: number | null,
    corroboratingReports: Array<{ _id?: any; reporter?: any }> = [],
    contradictingReports: Array<{ _id?: any; reporter?: any }> = [],
    isDuplicateSelfSubmission: boolean = false
  ): ITrustAnalysisResult {
    const reporterContribution = this.calculateReporterReputation(reporterReputation);

    const specificityContribution = this.calculateSpecificityContribution(
      report.aiAnalysis?.specificity
    );

    const evidenceContribution = this.calculateEvidenceContribution(report.evidence);

    const locationContribution = this.calculateLocationContribution(report.location);

    const combinedText = `${report.title} ${report.description}`;
    const timeContribution = this.calculateTimeContribution(combinedText);

    const currentReporterId = report.reporter
      ? String(report.reporter._id || report.reporter)
      : undefined;

    const { contribution: rawCorroboration } =
      this.calculateCorroborationContribution(currentReporterId, corroboratingReports);

    // Anti-Abuse: duplicate self-submissions strictly receive 0 corroboration
    const corroborationContribution = isDuplicateSelfSubmission ? 0 : rawCorroboration;

    const contradictionPenalty = this.calculateContradictionPenalty(contradictingReports);

    const missingInformationPenalty = this.calculateMissingInformationPenalty(
      report.aiAnalysis?.missingInformation
    );

    const suspiciousSignalsPenalty = this.calculateSuspiciousSignalsPenalty(
      report.aiAnalysis?.suspiciousSignals
    );

    const rawScore =
      TRUST_WEIGHTS.baseScore +
      reporterContribution +
      specificityContribution +
      evidenceContribution +
      locationContribution +
      timeContribution +
      corroborationContribution +
      missingInformationPenalty +
      suspiciousSignalsPenalty +
      contradictionPenalty;

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const level = this.determineTrustLevel(score);

    const signals: ITrustSignals = {
      reporterReputation: reporterContribution,
      specificity: specificityContribution,
      evidence: evidenceContribution,
      location: locationContribution,
      time: timeContribution,
      corroboration: corroborationContribution,
      missingInformation: missingInformationPenalty,
      suspiciousSignals: suspiciousSignalsPenalty,
      contradiction: contradictionPenalty,
    };

    const corroboratingReportIds = corroboratingReports
      .filter((r) => {
        const matchRepStr = r.reporter ? String(r.reporter._id || r.reporter) : '';
        return matchRepStr && matchRepStr !== currentReporterId;
      })
      .map((r) => String(r._id || ''))
      .filter(Boolean);

    const contradictingReportIds = contradictingReports
      .map((r) => String(r._id || ''))
      .filter(Boolean);

    return {
      score,
      level,
      signals,
      corroboratingReportIds,
      contradictingReportIds,
      calculatedAt: new Date(),
      explanation:
        'Calculated based on available supporting signals. This score does not establish that the report is verified or true.',
    };
  }

  /**
   * Extracts significant keywords (length >= 4, lowercase, non-stopwords)
   */
  public extractIncidentKeywords(text: string): Set<string> {
    if (!text || typeof text !== 'string') return new Set();
    const stopwords = new Set([
      'this', 'that', 'with', 'from', 'there', 'have', 'been', 'what', 'when',
      'where', 'some', 'about', 'around', 'into', 'over', 'under', 'just',
      'more', 'were', 'very', 'also', 'will', 'would', 'could', 'should',
      'after', 'before', 'their', 'which', 'other', 'these', 'those', 'then',
      'them', 'they', 'reported', 'please', 'near', 'opposite',
      'somewhere', 'something', 'anything', 'nothing', 'town', 'city',
      'place', 'area', 'happened', 'yesterday', 'today', 'morning', 'afternoon',
      'night', 'road', 'street', 'corner', 'going', 'down', 'seems', 'seen', 'stuff'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopwords.has(w));

    return new Set(words);
  }

  /**
   * Deterministic Location Match Checker
   */
  public checkLocationMatch(
    locA?: { address?: string; latitude?: number; longitude?: number },
    locB?: { address?: string; latitude?: number; longitude?: number }
  ): boolean {
    if (!locA || !locB) return false;

    // Check GPS coordinates proximity (~2.5km / 0.025 degrees)
    const hasCoordsA = locA.latitude && locA.longitude && locA.latitude !== 0 && locA.longitude !== 0;
    const hasCoordsB = locB.latitude && locB.longitude && locB.latitude !== 0 && locB.longitude !== 0;

    if (hasCoordsA && hasCoordsB) {
      const latDiff = Math.abs(Number(locA.latitude) - Number(locB.latitude));
      const lngDiff = Math.abs(Number(locA.longitude) - Number(locB.longitude));
      if (latDiff <= 0.025 && lngDiff <= 0.025) {
        return true;
      }
    }

    // Check address token overlap
    const addrA = (locA.address || '').toLowerCase();
    const addrB = (locB.address || '').toLowerCase();
    if (!addrA || !addrB) return false;

    const locationStopwords = new Set([
      'somewhere', 'town', 'city', 'area', 'place', 'location', 'unknown', 'none', 'someplace', 'nowhere'
    ]);

    const tokensA = [...this.extractIncidentKeywords(addrA)].filter((t) => !locationStopwords.has(t));
    const tokensB = [...this.extractIncidentKeywords(addrB)].filter((t) => !locationStopwords.has(t));

    if (tokensA.length === 0 || tokensB.length === 0) return false;

    let matchCount = 0;
    for (const t of tokensA) {
      if (tokensB.includes(t)) matchCount++;
    }

    return matchCount >= 1;
  }

  /**
   * Checks for contradictory signals between two reports about the same area/category
   */
  public checkContradiction(
    currentText: string,
    candidateText: string
  ): boolean {
    const contradictionRegex =
      /\b(no\s+(?:flood|flooding|water|fire|leak|hazard|issue|accident|problem|jam)|road\s+is\s+(?:clear|dry|open|fine)|completely\s+(?:clear|dry|normal)|normal\s+traffic|false\s+alarm|nothing\s+(?:happened|wrong|here)|already\s+(?:fixed|resolved|cleared))\b/i;

    const currentHasDenial = contradictionRegex.test(currentText);
    const candidateHasDenial = contradictionRegex.test(candidateText);

    // If one report affirms an incident and the other explicitly denies it
    return (currentHasDenial && !candidateHasDenial) || (!currentHasDenial && candidateHasDenial);
  }

  /**
   * Finds independent corroborating and contradicting reports in the database.
   * ANTI-ABUSE: Self-corroboration by same reporter is strictly filtered out.
   */
  public async findRelatedReports(
    currentReport: IReportForTrust
  ): Promise<{
    corroborating: any[];
    contradicting: any[];
    isDuplicateSelfSubmission: boolean;
  }> {
    const currentId = currentReport._id ? String(currentReport._id) : null;
    const currentReporterId = currentReport.reporter
      ? String(currentReport.reporter._id || currentReport.reporter)
      : null;

    const query: any = {};
    if (currentId) {
      query._id = { $ne: currentId };
    }

    // Look for candidates in recent reports
    const candidates = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const currentCombined = `${currentReport.title} ${currentReport.description}`;
    const currentKeywords = this.extractIncidentKeywords(currentCombined);

    const corroborating: any[] = [];
    const contradicting: any[] = [];
    let isDuplicateSelfSubmission = false;

    for (const cand of candidates) {
      const candReporterId = cand.reporter ? String(cand.reporter._id || cand.reporter) : null;
      const isSameReporter = Boolean(currentReporterId && candReporterId && currentReporterId === candReporterId);

      const isLocationMatched = this.checkLocationMatch(currentReport.location, cand.location);
      const candCombined = `${cand.title} ${cand.description}`;
      const candKeywords = this.extractIncidentKeywords(candCombined);

      // Calculate shared keyword count
      let sharedCount = 0;
      for (const k of currentKeywords) {
        if (candKeywords.has(k)) sharedCount++;
      }

      // 1. Anti-Abuse: Check for duplicate submission by SAME user
      if (isSameReporter && isLocationMatched && sharedCount >= 2) {
        isDuplicateSelfSubmission = true;
        // Strictly skip adding to corroboration!
        continue;
      }

      // Check category compatibility
      const categoryMatch =
        !currentReport.category ||
        !cand.category ||
        currentReport.category.toLowerCase() === cand.category.toLowerCase();

      // 2. Check for Contradiction
      if (isLocationMatched && categoryMatch && this.checkContradiction(currentCombined, candCombined)) {
        contradicting.push(cand);
        continue;
      }

      // 3. Check for Independent Corroboration
      // Requires different reporter, location overlap, category match, and incident keyword overlap
      if (!isSameReporter && isLocationMatched && categoryMatch && sharedCount >= 2) {
        corroborating.push(cand);
      }
    }

    return {
      corroborating,
      contradicting,
      isDuplicateSelfSubmission,
    };
  }

  /**
   * Human Reviewer-driven reporter reputation adjustment.
   * AI is never permitted to adjust user reputation directly.
   * Rules:
   * - VERIFIED: +10 reputation
   * - REJECTED: -5 reputation (with additional -10 penalty if >= 3 rejections)
   * - NEEDS_INFO: 0 adjustment
   * Clamped between -50 and 100.
   */
  public async updateReporterReputation(
    reporterId: any,
    decision: 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO'
  ): Promise<{ oldReputation: number; newReputation: number; change: number }> {
    if (!reporterId) return { oldReputation: 0, newReputation: 0, change: 0 };

    const user = await User.findById(reporterId);
    if (!user) return { oldReputation: 0, newReputation: 0, change: 0 };

    const oldReputation = user.reputation ?? 0;
    let change = 0;

    if (decision === 'VERIFIED') {
      change = REPUTATION_RULES.verifiedReportBonus;
    } else if (decision === 'REJECTED') {
      change = REPUTATION_RULES.rejectedReportPenalty;
      // Check for repeated spam / rejected reports
      const pastRejectedCount = await Report.countDocuments({
        reporter: user._id,
        status: 'REJECTED',
      });
      if (pastRejectedCount >= REPUTATION_RULES.repeatedRejectionThreshold) {
        change += REPUTATION_RULES.repeatedSpamAdditionalPenalty;
      }
    } else if (decision === 'NEEDS_INFO') {
      change = REPUTATION_RULES.needsInfoAdjustment;
    }

    const newReputation = Math.max(
      REPUTATION_RULES.minReputation,
      Math.min(REPUTATION_RULES.maxReputation, oldReputation + change)
    );

    user.reputation = newReputation;
    await user.save();

    return { oldReputation, newReputation, change };
  }
}

export const trustService = new TrustService();
export default trustService;

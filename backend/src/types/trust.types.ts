/**
 * Daily Bugle — Trust Engine Types & Centralized Weight Configuration
 *
 * CORE PRINCIPLE:
 * The Trust Engine does NOT decide "Is this report true?"
 * It calculates the confidence/priority assigned to available supporting signals.
 * Final verification remains strictly with a human reviewer.
 */

export type TrustLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'STRONG';

export interface ITrustSignals {
  reporterReputation: number; // 0 to +15 (or negative if negative reputation)
  specificity: number; // 0 to +15
  evidence: number; // 0 or +10
  location: number; // 0 to +10
  time: number; // 0 to +5
  corroboration: number; // 0 to +20
  missingInformation: number; // 0 to -10 (negative penalty)
  suspiciousSignals: number; // 0 to -10 (negative penalty)
  contradiction: number; // 0 to -15 (negative penalty)
}

export interface ITrustWeightsConfig {
  baseScore: number;
  reporterReputation: {
    maxPoints: number;
    minPoints: number;
    establishedThreshold: number;
  };
  specificity: {
    maxPoints: number;
  };
  evidence: {
    hasEvidencePoints: number;
    noEvidencePoints: number;
  };
  location: {
    exactCoordinatesPoints: number;
    specificAddressPoints: number;
    generalAreaPoints: number;
    noLocationPoints: number;
  };
  time: {
    specificTimePoints: number;
    generalTimePoints: number;
    noTimePoints: number;
  };
  corroboration: {
    singleCorroborationPoints: number;
    multipleCorroborationPoints: number;
    maxPoints: number;
  };
  contradiction: {
    penaltyPerContradiction: number;
    maxPenalty: number;
  };
  missingInformation: {
    penaltyPerItem: number;
    maxPenalty: number;
  };
  suspiciousSignals: {
    penaltyPerItem: number;
    maxPenalty: number;
  };
}

/**
 * Centralized weight configuration for transparent, easily tunable scoring.
 */
export const TRUST_WEIGHTS: ITrustWeightsConfig = {
  baseScore: 50,
  reporterReputation: {
    maxPoints: 15,
    minPoints: -10,
    establishedThreshold: 50,
  },
  specificity: {
    maxPoints: 15,
  },
  evidence: {
    hasEvidencePoints: 10,
    noEvidencePoints: 0,
  },
  location: {
    exactCoordinatesPoints: 10,
    specificAddressPoints: 8,
    generalAreaPoints: 4,
    noLocationPoints: 0,
  },
  time: {
    specificTimePoints: 5,
    generalTimePoints: 2,
    noTimePoints: 0,
  },
  corroboration: {
    singleCorroborationPoints: 10,
    multipleCorroborationPoints: 20,
    maxPoints: 20,
  },
  contradiction: {
    penaltyPerContradiction: -8,
    maxPenalty: -15,
  },
  missingInformation: {
    penaltyPerItem: -2,
    maxPenalty: -10,
  },
  suspiciousSignals: {
    penaltyPerItem: -3,
    maxPenalty: -10,
  },
};

/**
 * Reviewer-driven reputation rules.
 * AI never updates reputation directly.
 */
export const REPUTATION_RULES = {
  verifiedReportBonus: 10,
  rejectedReportPenalty: -5,
  repeatedSpamAdditionalPenalty: -10,
  repeatedRejectionThreshold: 3,
  needsInfoAdjustment: 0,
  minReputation: -50,
  maxReputation: 100,
};

export interface ITrustAnalysisResult {
  score: number;
  level: TrustLevel;
  signals: ITrustSignals;
  corroboratingReportIds: string[];
  contradictingReportIds: string[];
  calculatedAt: Date;
  explanation: string;
}

export interface IReportForTrust {
  _id?: any;
  title: string;
  description: string;
  category: string;
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  evidence?: any;
  reporter?: any;
  createdAt?: Date;
  aiAnalysis?: {
    status?: string;
    specificity?: number;
    keyClaims?: string[];
    missingInformation?: string[];
    suspiciousSignals?: string[];
  };
}

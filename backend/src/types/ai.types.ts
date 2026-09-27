export type AiCategory =
  | 'INFRASTRUCTURE'
  | 'SAFETY'
  | 'ENVIRONMENT'
  | 'TRAFFIC'
  | 'PUBLIC_SERVICE'
  | 'OTHER';

export type AiUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AiRecommendedAction =
  | 'NO_ACTION'
  | 'NEEDS_MORE_INFORMATION'
  | 'HUMAN_VERIFICATION';

export type AiAnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface IAiAnalysisResult {
  summary: string;
  category: AiCategory;
  urgency: AiUrgency;
  specificity: number; // 0 to 100
  keyClaims: string[];
  missingInformation: string[];
  suspiciousSignals: string[];
  recommendedAction: AiRecommendedAction;
}

export interface IAiAnalysis extends IAiAnalysisResult {
  model: string;
  analyzedAt: Date;
  status: AiAnalysisStatus;
  errorMessage?: string;
}

export interface IReportInputForAi {
  title: string;
  description: string;
  category?: string;
  location?:
    | string
    | {
        address: string;
        latitude?: number;
        longitude?: number;
      };
  evidence?: any;
}

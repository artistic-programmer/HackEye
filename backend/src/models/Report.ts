import mongoose, { Schema, Document } from 'mongoose';

export type ReportCategory =
  | 'Infrastructure'
  | 'Safety'
  | 'Environment'
  | 'Traffic'
  | 'Public Service'
  | 'Other';

export type ReportStatus =
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NEEDS_INFO';

export type AiStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface ILocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IAiAnalysisDoc {
  summary: string;
  category: string;
  urgency: string;
  specificity: number;
  keyClaims: string[];
  missingInformation: string[];
  suspiciousSignals: string[];
  recommendedAction: string;
  model: string;
  analyzedAt?: Date | null;
  status: AiStatus;
  errorMessage?: string | null;
}

export interface ITrustSignalsDoc {
  reporterReputation: number;
  specificity: number;
  evidence: number;
  location: number;
  time: number;
  corroboration: number;
  missingInformation: number;
  suspiciousSignals: number;
  contradiction: number;
}

export interface ITrustAnalysisDoc {
  score: number;
  level: string; // 'LOW' | 'MODERATE' | 'HIGH' | 'STRONG'
  signals: ITrustSignalsDoc;
  corroboratingReportIds?: string[];
  contradictingReportIds?: string[];
  calculatedAt?: Date | null;
  explanation?: string;
}

export interface IReviewHistoryEntry {
  reviewer: mongoose.Types.ObjectId;
  action: 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO';
  reason?: string;
  note?: string;
  createdAt: Date;
}

export interface IReviewRequestDoc {
  message: string;
  reviewer: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IReportEvidence {
  url: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw';
  mimeType?: string;
  originalName?: string;
  size?: number;
  uploadedAt?: Date;
}

export interface IReport extends Document {
  title: string;
  description: string;
  category: ReportCategory;
  location: ILocation;
  evidence?: IReportEvidence | string;
  reporter?: mongoose.Types.ObjectId;
  status: ReportStatus;
  incident?: mongoose.Types.ObjectId | null;
  aiAnalysis?: IAiAnalysisDoc;
  trustAnalysis?: ITrustAnalysisDoc;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewHistory?: IReviewHistoryEntry[];
  reviewRequest?: IReviewRequestDoc | null;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const AiAnalysisSchema: Schema = new Schema(
  {
    summary: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'OTHER',
    },
    urgency: {
      type: String,
      default: 'MEDIUM',
    },
    specificity: {
      type: Number,
      default: 0,
    },
    keyClaims: {
      type: [String],
      default: [],
    },
    missingInformation: {
      type: [String],
      default: [],
    },
    suspiciousSignals: {
      type: [String],
      default: [],
    },
    recommendedAction: {
      type: String,
      default: 'HUMAN_VERIFICATION',
    },
    model: {
      type: String,
      default: 'gemini-3.5-flash-lite',
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const TrustSignalsSchema: Schema = new Schema(
  {
    reporterReputation: { type: Number, default: 0 },
    specificity: { type: Number, default: 0 },
    evidence: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    time: { type: Number, default: 0 },
    corroboration: { type: Number, default: 0 },
    missingInformation: { type: Number, default: 0 },
    suspiciousSignals: { type: Number, default: 0 },
    contradiction: { type: Number, default: 0 },
  },
  { _id: false }
);

const TrustAnalysisSchema: Schema = new Schema(
  {
    score: {
      type: Number,
      default: 50,
    },
    level: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'STRONG'],
      default: 'MODERATE',
    },
    signals: {
      type: TrustSignalsSchema,
      default: () => ({}),
    },
    corroboratingReportIds: {
      type: [String],
      default: [],
    },
    contradictingReportIds: {
      type: [String],
      default: [],
    },
    calculatedAt: {
      type: Date,
      default: null,
    },
    explanation: {
      type: String,
      default:
        'Calculated based on available supporting signals. This score does not establish that the report is verified or true.',
    },
  },
  { _id: false }
);

const ReportSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Infrastructure',
        'Safety',
        'Environment',
        'Traffic',
        'Public Service',
        'Other',
      ],
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    evidence: {
      type: Schema.Types.Mixed,
      default: '',
    },
    incident: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_INFO'],
      default: 'UNDER_REVIEW',
    },
    aiAnalysis: {
      type: AiAnalysisSchema,
      default: () => ({
        status: 'PENDING',
        model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      }),
    },
    trustAnalysis: {
      type: TrustAnalysisSchema,
      default: () => ({
        score: 50,
        level: 'MODERATE',
        signals: {},
        corroboratingReportIds: [],
        contradictingReportIds: [],
        calculatedAt: null,
      }),
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewHistory: {
      type: [
        {
          reviewer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          action: {
            type: String,
            enum: ['VERIFIED', 'REJECTED', 'NEEDS_INFO'],
            required: true,
          },
          reason: {
            type: String,
            default: '',
          },
          note: {
            type: String,
            default: '',
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    reviewRequest: {
      type: {
        message: {
          type: String,
          required: true,
        },
        reviewer: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      default: null,
      _id: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
export default Report;

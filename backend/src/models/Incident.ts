import mongoose, { Schema, Document } from 'mongoose';
import { ReportCategory } from './Report';

export type IncidentStatus = 'UNDER_REVIEW' | 'VERIFIED' | 'RESOLVED' | 'REJECTED';

export interface IIncidentTimelineEntry {
  reportId: mongoose.Types.ObjectId;
  reporterId?: mongoose.Types.ObjectId | null;
  reporterName?: string;
  title: string;
  timestamp: Date;
  snippet: string;
}

export interface IIncident extends Document {
  title: string;
  summary: string;
  category: ReportCategory;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: IncidentStatus;
  primaryReport: mongoose.Types.ObjectId;
  reports: mongoose.Types.ObjectId[];
  contradictingReports: mongoose.Types.ObjectId[];
  independentReportersCount: number;
  timeline: IIncidentTimelineEntry[];
  trustScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reporterName: {
      type: String,
      default: 'Citizen Reporter',
    },
    title: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    snippet: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const IncidentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
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
    status: {
      type: String,
      enum: ['UNDER_REVIEW', 'VERIFIED', 'RESOLVED', 'REJECTED'],
      default: 'UNDER_REVIEW',
    },
    primaryReport: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    reports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
    contradictingReports: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
    independentReportersCount: {
      type: Number,
      default: 1,
    },
    timeline: {
      type: [TimelineEntrySchema],
      default: [],
    },
    trustScore: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast spatial and category searches
IncidentSchema.index({ category: 1, status: 1 });
IncidentSchema.index({ createdAt: -1 });

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);

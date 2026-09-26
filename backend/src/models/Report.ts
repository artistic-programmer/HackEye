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

export interface ILocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IReport extends Document {
  title: string;
  description: string;
  category: ReportCategory;
  location: ILocation;
  evidence?: string;
  reporter?: mongoose.Types.ObjectId;
  status: ReportStatus;
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
      type: String,
      default: '',
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
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
export default Report;

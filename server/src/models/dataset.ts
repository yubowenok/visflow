import { Schema, model, HydratedDocument } from 'mongoose';

export interface IDataset {
  username: string;
  filename: string;
  originalname: string;
  size: number; // bytes
  lastUsedAt: Date; // last accessed by user
  createdAt?: Date; // uploaded at
  updatedAt?: Date; // last downloaded at
}

export type DatasetDocument = HydratedDocument<IDataset>;

const datasetSchema = new Schema<IDataset>({
  username: String,
  filename: String,
  originalname: String,
  size: Number,
  lastUsedAt: Date,
}, { timestamps: true });

datasetSchema.index({ filename: 1 }, { unique: true });

const Dataset = model<IDataset>('Dataset', datasetSchema);
export default Dataset;

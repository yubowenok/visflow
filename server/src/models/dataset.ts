import mongoose from 'mongoose';

export interface DatasetModel extends mongoose.Document {
  username: string;
  filename: string;
  originalname: string;
  size: number; // bytes
  lastUsedAt: Date; // last accessed by user
  createdAt: Date; // uploaded at
  updatedAt: Date; // last downloaded at
}

const datasetSchema = new mongoose.Schema({
  username: String,
  filename: String,
  originalname: String,
  size: Number,
  lastUsedAt: Date,
}, { timestamps: true });

datasetSchema.index({
  username: 1,
  filename: 1,
}, { unique: true });

const Dataset = mongoose.model<DatasetModel>('Dataset', datasetSchema);
export default Dataset;

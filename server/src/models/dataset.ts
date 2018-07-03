import mongoose from 'mongoose';

export interface DatasetModel extends mongoose.Document {
  username: string;
  filename: string;
  originalname: string;
  size: number; // bytes
}

const datasetSchema = new mongoose.Schema({
  username: String,
  filename: String,
  originalname: String,
  size: Number,
}, { timestamps: true });

datasetSchema.index({
  username: 1,
  filename: 1,
}, { unique: true });

const Dataset = mongoose.model<DatasetModel>('Dataset', datasetSchema);
export default Dataset;

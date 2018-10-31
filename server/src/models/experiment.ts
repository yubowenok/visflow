import mongoose from 'mongoose';

export interface ExperimentModel extends mongoose.Document {
  filename: string;
  startTime: Date;
  endTime?: Date;
}

// Query and auto completion share a same model.

const experimentSchema = new mongoose.Schema({
  filename: String,
  startTime: Date,
  endTime: Date,
}, { timestamps: true });

export const Experiment = mongoose.model<ExperimentModel>('Experiment', experimentSchema);

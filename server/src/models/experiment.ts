/*
import mongoose from 'mongoose';

export interface ExperimentModel extends mongoose.Document {
  filename: string;
  startTime: Date;
  endTime?: Date;
  step: string;
}

// Query and auto completion share a same model.

const experimentSchema = new mongoose.Schema({
  filename: String,
  startTime: Date,
  endTime: Date,
  step: String,
}, { timestamps: true });

export const Experiment = mongoose.model<ExperimentModel>('Experiment', experimentSchema);
*/

import mongoose from 'mongoose';

export interface ExperimentModel extends mongoose.Document {
  filename: string;
  answers: { [question: string]: string[] };
}

// Query and auto completion share a same model.

const experimentSchema = new mongoose.Schema({
  filename: String,
  answers: Object,
}, { timestamps: true });

const Experiment = mongoose.model<ExperimentModel>('Experiment', experimentSchema);
export default Experiment;

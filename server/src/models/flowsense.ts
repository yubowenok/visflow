import mongoose from 'mongoose';

export interface FlowsenseModel extends mongoose.Document {
  query: string;
  rawQuery: string;
  result: object;
}

// Query and auto completion share a same model.

const flowsenseQuerySchema = new mongoose.Schema({
  query: String,
  rawQuery: String,
  result: Object,
}, { timestamps: true });

const flowsenseAutoCompletionSchema = new mongoose.Schema({
  query: String,
  rawQuery: String,
  result: Object,
}, { timestamps: true });

export const FlowsenseQuery = mongoose.model<FlowsenseModel>('FlowsenseQuery', flowsenseQuerySchema);
export const FlowsenseAutoCompletion = mongoose.model<FlowsenseModel>('FlowsenseAutoCompletion',
  flowsenseAutoCompletionSchema);

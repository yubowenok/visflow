import { Schema, model } from 'mongoose';

export interface IFlowsense {
  query: string;
  rawQuery: string;
  result: object;
}

// Query and auto completion share a same model.

const flowsenseQuerySchema = new Schema<IFlowsense>({
  query: String,
  rawQuery: String,
  result: Object,
}, { timestamps: true });

const flowsenseAutoCompletionSchema = new Schema<IFlowsense>({
  query: String,
  rawQuery: String,
  result: Object,
}, { timestamps: true });

export const FlowsenseQuery = model<IFlowsense>('FlowsenseQuery', flowsenseQuerySchema);
export const FlowsenseAutoCompletion = model<IFlowsense>('FlowsenseAutoCompletion', flowsenseAutoCompletionSchema);

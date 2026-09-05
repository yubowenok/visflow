import { Schema, model, HydratedDocument } from 'mongoose';

export interface ILog {
  // points to the log history of one diagram
  username: string;
  filename: string;

  /**
   * All operations taken on this diagram.
   * If the diagram is edited through multiple sessions, the logs will be appended.
   * By replaying all the logged events, the diagram can be recreated from scratch.
   */
  logs: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type LogDocument = HydratedDocument<ILog>;

const logSchema = new Schema<ILog>({
  username: String,
  filename: String,
  logs: Array,
}, { timestamps: true });

logSchema.index({ filename: 1 }, { unique: true });

const Log = model<ILog>('log', logSchema);
export default Log;

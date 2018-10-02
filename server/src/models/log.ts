import mongoose from 'mongoose';

export interface LogModel extends mongoose.Document {
  // points to the log history of one diagram
  username: string;
  filename: string;

  /**
   * All operations taken on this diagram.
   * If the diagram is edited through multiple sessions, the logs will be appended.
   * By replaying all the logged events, the diagram can be recreated from scratch.
   */
  logs: any[]; // tslint:disable-line no-any
}

const logSchema = new mongoose.Schema({
  username: String,
  filename: String,
  logs: Array,
}, { timestamps: true });

logSchema.index({
  username: 1,
  filename: 1,
}, { unique: true });

const Log = mongoose.model<LogModel>('log', logSchema);
export default Log;

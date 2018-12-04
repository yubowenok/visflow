import mongoose from 'mongoose';

export interface DiagramModel extends mongoose.Document {
  username: string;
  diagramName: string; // user-readable diagram name
  filename: string; // system filename, random hash
  updatedAt: Date;
}

const diagramSchema = new mongoose.Schema({
  username: String,
  filename: String,
  diagramName: String,
}, { timestamps: true });

diagramSchema.index({
  filename: 1,
}, { unique: true });

const Diagram = mongoose.model<DiagramModel>('Diagram', diagramSchema);
export default Diagram;

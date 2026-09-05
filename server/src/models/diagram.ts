import { Schema, model, HydratedDocument } from 'mongoose';

export interface IDiagram {
  username: string;
  diagramName: string; // user-readable diagram name
  filename: string; // system filename, random hash
  createdAt?: Date;
  updatedAt?: Date;
}

export type DiagramDocument = HydratedDocument<IDiagram>;

const diagramSchema = new Schema<IDiagram>({
  username: String,
  filename: String,
  diagramName: String,
}, { timestamps: true });

diagramSchema.index({ filename: 1 }, { unique: true });

const Diagram = model<IDiagram>('Diagram', diagramSchema);
export default Diagram;

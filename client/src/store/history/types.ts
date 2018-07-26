import Node from '@/components/node/node';
import { DiagramEventType } from '@/store/dataflow/types';

export enum HistoryEventLevel {
  DIAGRAM = 'diagram',
  NODE = 'node',
}

export interface HistoryEvent {
  level: HistoryEventLevel;
  type: string;
  message: string;
  data: any; // tslint:disable-line no-any
}

export interface HistoryNodeEvent extends HistoryEvent {
  node: Node;
}

export interface HistoryDiagramEvent extends HistoryEvent {
  type: DiagramEventType;
}

// Batch event that creates/removes multiple nodes/edges
export interface HistoryDiagramBatchEvent extends HistoryEvent {
  events: HistoryDiagramEvent[];
}

export interface HistoryState {
  undoStack: HistoryEvent[];
  redoStack: HistoryEvent[];
}

export * from './util';

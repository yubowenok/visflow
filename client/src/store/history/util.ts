import { Node } from '@/components/node';
import {
  HistoryEventLevel,
  HistoryNodeEvent,
  HistoryDiagramEvent,
  HistoryDiagramBatchEvent,
 } from '@/store/history/types';
import { DiagramEventType } from '@/store/dataflow/types';


// tslint:disable-next-line no-any
export const diagramEvent = (type: DiagramEventType, message: string, data: any): HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type,
    message,
    data,
  };
};

// tslint:disable-next-line no-any
export const diagramBatchEvent = (type: string, message: string, events: HistoryDiagramEvent[], data?: any):
  HistoryDiagramBatchEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type,
    message,
    events,
    data,
  };
};

// tslint:disable-next-line no-any
export const nodeEvent = (type: string, message: string, node: Node, data: any): HistoryNodeEvent => {
  return {
    level: HistoryEventLevel.NODE,
    type,
    node,
    message,
    data,
  };
};

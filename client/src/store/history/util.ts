// tslint:disable no-any
import { Node } from '@/components/node';
import {
  HistoryEventLevel,
  HistoryNodeEvent,
  HistoryDiagramEvent,
  HistoryDiagramBatchEvent,
  HistoryNodeOptionEvent,
 } from '@/store/history/types';
import { DiagramEventType } from '@/store/dataflow/types';


export const diagramEvent = (type: DiagramEventType, message: string, data: any): HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type,
    message,
    data,
  };
};

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

export const nodeEvent = (type: string, message: string, node: Node, data: any): HistoryNodeEvent => {
  return {
    level: HistoryEventLevel.NODE,
    type,
    message,
    node,
    data,
  };
};

export const nodeOptionEvent = (type: string, message: string, node: Node,
                                setter: (value: any) => void, value: any, prevValue: any):
  HistoryNodeOptionEvent => {
  return {
    level: HistoryEventLevel.NODE,
    type,
    message,
    node,
    setter,
    data: { value, prevValue },
  };
};

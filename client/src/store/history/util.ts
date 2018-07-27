// tslint:disable no-any
import { Node } from '@/components/node';
import {
  HistoryEventLevel,
  HistoryNodeEvent,
  HistoryDiagramEvent,
  HistoryDiagramBatchEvent,
  HistoryNodeOptionEvent,
  HistoryEventIcon,
 } from '@/store/history/types';
import { DiagramEventType } from '@/store/dataflow/types';


export const diagramEvent = (type: DiagramEventType, message: string, data: any, icon?: HistoryEventIcon):
  HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type,
    message,
    data,
    icon,
  };
};

export const diagramBatchEvent = (type: string, message: string, events: HistoryDiagramEvent[],
                                  icon?: HistoryEventIcon, data?: any): HistoryDiagramBatchEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type,
    message,
    events,
    data,
    icon,
  };
};

export const nodeEvent = (type: string, message: string, node: Node, data: any,
                          icon?: HistoryEventIcon): HistoryNodeEvent => {
  return {
    level: HistoryEventLevel.NODE,
    type,
    message,
    node,
    data,
    icon,
  };
};

export const nodeOptionEvent = (type: string, message: string, node: Node,
                                setter: (value: any) => void, value: any, prevValue: any,
                                icon?: HistoryEventIcon):
  HistoryNodeOptionEvent => {
  let defaultIconValue = 'fas fa-sliders-h';
  if (!icon) {
    if (type.match(/select/)) {
      defaultIconValue = 'fas fa-list';
    } else if (type.match(/input/)) {
      defaultIconValue = 'fas fa-edit';
    } else if (type.match(/toggle/)) {
      defaultIconValue = 'fas fa-toggle-on';
    }
  }
  return {
    level: HistoryEventLevel.NODE,
    type,
    message,
    node,
    setter,
    data: { value, prevValue },
    icon: icon || { value: defaultIconValue },
  };
};

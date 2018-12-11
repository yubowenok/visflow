import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Aggregation, { AggregationMode } from './aggregation';

enum AggregationEventType {
  SELECT_MODE = 'setMode',
  SELECT_COLUMN = 'setColumn',
  SELECT_GROUP_BY_COLUMN = 'setGroupByColumn',
}

export const selectModeEvent = (node: Aggregation, mode: AggregationMode, prevMode: AggregationMode):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AggregationEventType.SELECT_MODE,
    'select aggregation mode',
    node,
    node.setMode,
    mode,
    prevMode,
  );
};

export const selectColumnEvent = (node: Aggregation, column: number, prevColumn: number): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AggregationEventType.SELECT_COLUMN,
    'select column',
    node,
    node.setColumn,
    column,
    prevColumn,
  );
};

export const selectGroupByColumnEvent = (node: Aggregation, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AggregationEventType.SELECT_GROUP_BY_COLUMN,
    'select group by column',
    node,
    node.setGroupByColumn,
    column,
    prevColumn,
  );
};

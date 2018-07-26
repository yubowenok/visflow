import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Histogram from './histogram';

enum HistogramEventType {
  SELECT_COLUMN = 'select-column',
  INPUT_NUM_BINS = 'input-num-bins',
}

export const selectColumnEvent = (node: Histogram, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistogramEventType.SELECT_COLUMN,
    'select column',
    node,
    node.setColumn,
    column,
    prevColumn,
  );
};

export const inputNumBinsEvent = (node: Histogram, value: number, prevValue: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistogramEventType.INPUT_NUM_BINS,
    'input number of bins',
    node,
    node.setNumBins,
    value,
    prevValue,
  );
};

import { HistoryNodeOptionEvent, nodeOptionEvent, nodeEvent } from '@/store/history/types';
import Histogram, { HistogramSelection } from './histogram';
import { SubsetSelection } from '@/data/package';

enum HistogramEventType {
  SELECT_COLUMN = 'select-column',
  INPUT_NUM_BINS = 'input-num-bins',
  // Prefix to avoid conflict with visualization base class
  HISTOGRAM_INTERACTIVE_SELECTION = 'histogram-interactive-selection',
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

export const interactiveSelectionEvent = (node: Histogram, selection: HistogramSelection,
                                          prevSelection: HistogramSelection, message: string = 'select items'):
                                          HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistogramEventType.HISTOGRAM_INTERACTIVE_SELECTION,
    message,
    node,
    node.setHistogramSelection,
    selection,
    prevSelection,
  );
};

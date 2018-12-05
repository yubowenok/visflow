import _ from 'lodash';
import { HistoryNodeOptionEvent, nodeOptionEvent, nodeEvent } from '@/store/history/types';
import Histogram, { HistogramSelection } from './histogram';

enum HistogramEventType {
  SELECT_COLUMN = 'setColumn',
  INPUT_NUM_BINS = 'setNumBins',
  INPUT_MAX_COUNT = 'setMaxCount',
  // Prefix to avoid conflict with visualization base class
  HISTOGRAM_INTERACTIVE_SELECTION = 'setHistogramSelection',
  TOGGLE_USE_DATASET_RANGE = 'setUseDatasetRange',
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

export const inputMaxCountEvent = (node: Histogram, count: number | null, prevCount: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistogramEventType.INPUT_MAX_COUNT,
    'input max count',
    node,
    node.setMaxCount,
    count,
    prevCount,
  );
};


export const interactiveSelectionEvent = (node: Histogram, selection: HistogramSelection,
                                          prevSelection: HistogramSelection, message?: string):
                                          HistoryNodeOptionEvent => {
  if (message === undefined) {
    const countItems = selection.selection.numItems();
    const countBars = _.size(selection.selectedBars);
    message = `select ${countItems} item` + (countItems === 1 ? '' : 's');
    message += ` , ${countBars} stacked bar` + (countBars === 1 ? '' : 's');
  }
  return nodeOptionEvent(
    HistogramEventType.HISTOGRAM_INTERACTIVE_SELECTION,
    message,
    node,
    node.setHistogramSelection,
    {
      selection: selection.selection.serialize(),
      selectedBars: Array.from(selection.selectedBars),
    },
    {
      selection: prevSelection.selection.serialize(),
      selectedBars: Array.from(prevSelection.selectedBars),
    },
  );
};

export const toggleUseDatasetRangeEvent = (node: Histogram, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistogramEventType.TOGGLE_USE_DATASET_RANGE,
    'toggle use dataset range',
    node,
    node.setUseDatasetRange,
    value,
    !value,
  );
};

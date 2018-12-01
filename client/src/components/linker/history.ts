import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Linker from './linker';

enum ConstantsGeneratorEventType {
  SELECT_EXTRACT_COLUMN = 'setExtractColumn',
  SELECT_FILTER_COLUMN = 'setFilterColumn',
}

export const selectExtractColumnEvent = (node: Linker, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ConstantsGeneratorEventType.SELECT_EXTRACT_COLUMN,
    'select extract column',
    node,
    node.setExtractColumn,
    column,
    prevColumn,
  );
};

export const selectFilterColumnEvent = (node: Linker, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ConstantsGeneratorEventType.SELECT_FILTER_COLUMN,
    'select filter column',
    node,
    node.setFilterColumn,
    column,
    prevColumn,
  );
};

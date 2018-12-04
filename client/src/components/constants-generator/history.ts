import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import ConstantsGenerator from './constants-generator';
import { getConstantsListInputType } from '@/components/constants-list/constants-list';

enum ConstantsGeneratorEventType {
  INPUT_CONSTANTS = 'setInputConstants',
  SELECT_COLUMN = 'setColumn',
  TOGGLE_DISTINCT = 'setDistinct',
  TOGGLE_SORT = 'setSort',
}

export const inputConstantsEvent = (node: ConstantsGenerator, constants: string[], prevConstants: string[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ConstantsGeneratorEventType.INPUT_CONSTANTS,
    getConstantsListInputType(constants, prevConstants),
    node,
    node.setInputConstants,
    constants,
    prevConstants,
  );
};

export const selectColumnEvent = (node: ConstantsGenerator, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ConstantsGeneratorEventType.SELECT_COLUMN,
    'select column',
    node,
    node.setColumn,
    column,
    prevColumn,
  );
};

export const toggleDistinctEvent = (node: ConstantsGenerator, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ConstantsGeneratorEventType.TOGGLE_DISTINCT,
    'toggle distinct constants',
    node,
    node.setDistinct,
    value,
    !value,
  );
};

export const toggleSortEvent = (node: ConstantsGenerator, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ConstantsGeneratorEventType.TOGGLE_DISTINCT,
    'toggle sort constants',
    node,
    node.setSort,
    value,
    !value,
  );
};

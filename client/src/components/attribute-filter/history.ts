import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import AttributeFilter, {
  AmountType,
  ExtremumCriterion,
  FilterType,
  PatternMatchMode,
} from './attribute-filter';
import { getConstantsListInputType } from '@/components/constants-list/constants-list';

enum AttributeFilterEventType {
  INPUT_AMOUNT = 'input-amount',
  INPUT_PATTERNS = 'input-patterns',
  INPUT_RANGE_MAX = 'input-range-max',
  INPUT_RANGE_MIN = 'input-range-min',
  SELECT_AMOUNT_TYPE = 'select-amount-type',
  SELECT_COLUMN = 'select-column',
  SELECT_EXTREMUM_CRITERION = 'select-extremum-criterion',
  SELECT_FILTER_TYPE = 'select-filter-type',
  SELECT_GROUP_BY_COLUMN = 'select-group-by-column',
  SELECT_PATTERN_MATCH_MODE = 'pattern-match-mode',
  SELECT_SAMPLING_CRITERION = 'select-sampling-criterion',
  TOGGLE_ON_DISTINCT_VALUES = 'toggle-on-distinct-values',
  TOGGLE_PATTERN_CASE_SENSITIVE = 'toggle-pattern-case-sensitive',
}

export const selectFilterTypeEvent = (node: AttributeFilter, type: FilterType, prevType: FilterType):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_FILTER_TYPE,
    'select filter type',
    node,
    node.setFilterType,
    type,
    prevType,
  );
};

export const selectColumnEvent = (node: AttributeFilter, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_COLUMN,
    'select column',
    node,
    node.setColumn,
    column,
    prevColumn,
  );
};

export const inputPatternsEvent = (node: AttributeFilter, patterns: string[], prevPatterns: string[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.INPUT_PATTERNS,
    getConstantsListInputType(patterns, prevPatterns, 'pattern'),
    node,
    node.setPatterns,
    patterns,
    prevPatterns,
  );
};

export const selectPatternMatchModeEvent = (node: AttributeFilter, mode: PatternMatchMode, prevMode: PatternMatchMode):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_PATTERN_MATCH_MODE,
    'select match mode',
    node,
    node.setPatternMatchMode,
    mode,
    prevMode,
  );
};

export const togglePatternCaseSensitiveEvent = (node: AttributeFilter, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.TOGGLE_PATTERN_CASE_SENSITIVE,
    'toggle case sensitive',
    node,
    node.setPatternCaseSensitive,
    value,
    !value,
  );
};

export const inputRangeMin = (node: AttributeFilter, value: number | null, prevValue: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.INPUT_RANGE_MIN,
    'input range min',
    node,
    node.setRangeMin,
    value,
    prevValue,
  );
};

export const inputRangeMax = (node: AttributeFilter, value: number | null, prevValue: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.INPUT_RANGE_MAX,
    'input range max',
    node,
    node.setRangeMax,
    value,
    prevValue,
  );
};

export const selectExtremumCriterion = (node: AttributeFilter, criterion: ExtremumCriterion,
                                        prevCriterion: ExtremumCriterion): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_SAMPLING_CRITERION,
    'select extremum criterion',
    node,
    node.setExtremumCriterion,
    criterion,
    prevCriterion,
  );
};

export const selectAmountType = (node: AttributeFilter, type: AmountType, prevType: AmountType):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_AMOUNT_TYPE,
    'select amount type',
    node,
    node.setAmountType,
    type,
    prevType,
  );
};

export const inputAmount = (node: AttributeFilter, amount: number | null, prevAmount: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.INPUT_AMOUNT,
    'input amount',
    node,
    node.setAmount,
    amount,
    prevAmount,
  );
};

export const selectGroupByColumn = (node: AttributeFilter, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_GROUP_BY_COLUMN,
    'select group by column',
    node,
    node.setGroupByColumn,
    column,
    prevColumn,
  );
};

export const toggleOnDistinctValues = (node: AttributeFilter, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.TOGGLE_ON_DISTINCT_VALUES,
    'toggle on distinct values',
    node,
    node.setOnDistinctValues,
    value,
    !value,
  );
};

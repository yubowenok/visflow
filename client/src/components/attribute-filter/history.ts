import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import AttributeFilter, {
  FilterType,
  PatternMatchMode,
  SamplingCriterion,
  SamplingAmountType,
} from './attribute-filter';
import { getConstantsListInputType } from '@/components/constants-list/constants-list';

enum AttributeFilterEventType {
  SELECT_FILTER_TYPE = 'select-filter-type',
  SELECT_COLUMN = 'select-column',
  INPUT_PATTERNS = 'input-patterns',
  SELECT_PATTERN_MATCH_MODE = 'pattern-match-mode',
  TOGGLE_PATTERN_CASE_SENSITIVE = 'toggle-pattern-case-sensitive',
  INPUT_RANGE_MIN = 'input-range-min',
  INPUT_RANGE_MAX = 'input-range-max',
  SELECT_SAMPLING_CRITERION = 'select-sampling-criterion',
  SELECT_SAMPLING_AMOUNT_TYPE = 'select-sampling-amount-type',
  INPUT_SAMPLING_AMOUNT = 'input-sampling-amount',
  SELECT_SAMPLING_GROUP_BY_COLUMN = 'select-sampling-group-by-column',
  TOGGLE_SAMPLING_ON_DISTINCT_VALUES = 'toggle-sampling-on-distinct-values',
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

export const selectSamplingCriterion = (node: AttributeFilter, criterion: SamplingCriterion,
                                        prevCriterion: SamplingCriterion): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_SAMPLING_CRITERION,
    'select sampling criterion',
    node,
    node.setSamplingCriterion,
    criterion,
    prevCriterion,
  );
};

export const selectSamplingAmountType = (node: AttributeFilter, type: SamplingAmountType, prevType: SamplingAmountType):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_SAMPLING_AMOUNT_TYPE,
    'select sampling amount type',
    node,
    node.setSamplingAmountType,
    type,
    prevType,
  );
};

export const inputSamplingAmount = (node: AttributeFilter, amount: number | null, prevAmount: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.INPUT_SAMPLING_AMOUNT,
    'input sampling amount',
    node,
    node.setSamplingAmount,
    amount,
    prevAmount,
  );
};

export const selectSamplingGroupByColumn = (node: AttributeFilter, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.SELECT_SAMPLING_GROUP_BY_COLUMN,
    'select sampling group by column',
    node,
    node.setSamplingGroupByColumn,
    column,
    prevColumn,
  );
};

export const toggleSamplingOnDistinctValues = (node: AttributeFilter, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    AttributeFilterEventType.TOGGLE_SAMPLING_ON_DISTINCT_VALUES,
    'toggle sampling on distinct values',
    node,
    node.setSamplingOnDistinctValues,
    value,
    !value,
  );
};

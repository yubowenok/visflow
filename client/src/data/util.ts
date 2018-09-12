import TabularDataset, { TabularColumn } from './tabular-dataset';
import { ValueType } from '@/data/parser';

/**
 * Provides a list of column select options.
 * If condition function is given, each column is passed through the condition. If the condition does not hold,
 * the column option will have the "disabled" attribute set. Note that all columns are returned regardless of
 * the condition.
 */
export const getColumnSelectOptions = (dataset: TabularDataset | undefined | null,
                                       condition?: (column: TabularColumn) => boolean): SelectOption[] => {
  if (!dataset) {
    return [];
  }
  const columns = dataset.getColumns();
  return columns.map((column: TabularColumn, columnIndex: number) => {
    return {
      value: columnIndex,
      label: column.name,
      disabled: condition && !condition(column),
    };
  });
};

/** Returns if a value type is numerical. */
export const isNumericalType = (type: ValueType): boolean => {
  return type === ValueType.FLOAT || type === ValueType.INT;
};

/** Returns if a value type forms a continuous domain. */
export const isContinuousDomain = (type: ValueType): boolean => {
  return isNumericalType(type) || type === ValueType.DATE;
};

export const valueComparator = (type: ValueType): ((a: number | string, b: number | string) => number) => {
  if (type === ValueType.DATE) {
    return (a, b) => new Date(a).getTime() - new Date(b).getTime();
  }
  return (a, b) => a === b ? 0 : (a < b ? -1 : 1);
};

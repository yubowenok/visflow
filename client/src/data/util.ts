import TabularDataset, { TabularColumn } from './tabular-dataset';
import { ValueType } from '@/data/parser';

export const getColumnSelectOptions = (dataset: TabularDataset | undefined | null): SelectOption[] => {
  if (!dataset) {
    return [];
  }
  return dataset.getColumns().map((column: TabularColumn, columnIndex: number) => {
    return {
      value: columnIndex,
      label: column.name,
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

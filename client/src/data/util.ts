import TabularDataset, { ColumnSelectOption, TabularColumn } from './tabular-dataset';

export const getColumnSelectOptions = (dataset: TabularDataset | undefined | null): ColumnSelectOption[] => {
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

import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import SeriesTranspose from './series-transpose';

enum SeriesTransposeEventType {
  SELECT_KEY_COLUMN = 'setKeyColumn',
  SELECT_SERIES_COLUMNS = 'setSeriesColumns',
  INPUT_SERIES_COLUMN_NAME = 'setSeriesColumnName',
  INPUT_VALUE_COLUMN_NAME = 'setValueColumnName',
}

export const selectKeyColumnEvent = (node: SeriesTranspose, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesTransposeEventType.SELECT_KEY_COLUMN,
    'select key column',
    node,
    node.setKeyColumn,
    column,
    prevColumn,
  );
};

export const selectSeriesColumnsEvent = (node: SeriesTranspose, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesTransposeEventType.SELECT_SERIES_COLUMNS,
    'select series columns',
    node,
    node.setSeriesColumns,
    columns,
    prevColumns,
  );
};

export const inputSeriesColumnNameEvent = (node: SeriesTranspose, name: string, prevName: string):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesTransposeEventType.INPUT_SERIES_COLUMN_NAME,
    'input series column name',
    node,
    node.setSeriesColumnName,
    name,
    prevName,
  );
};

export const inputValueColumnNameEvent = (node: SeriesTranspose, name: string, prevName: string):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesTransposeEventType.INPUT_VALUE_COLUMN_NAME,
    'input value column name',
    node,
    node.setValueColumnName,
    name,
    prevName,
  );
};

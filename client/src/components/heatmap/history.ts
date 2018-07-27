import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Heatmap from './heatmap';
import { getColumnListInputType } from '@/components/column-list/column-list';

enum HeatmapEventType {
  SELECT_COLUMNS = 'select-columns',
  SELECT_COLOR_SCALE = 'select-color-scale',
  SELECT_SORT_BY_COLUMN = 'select-sort-by-column',
  SELECT_ROW_LABEL_COLUMN = 'select-row-label-column',
  TOGGLE_COLUMN_LABELS_VISIBLE = 'toggle-column-labels-visible',
}

export const selectColumnsEvent = (node: Heatmap, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HeatmapEventType.SELECT_COLUMNS,
    getColumnListInputType(columns, prevColumns),
    node,
    node.setColumns,
    columns,
    prevColumns,
  );
};

export const selectColorScaleEvent = (node: Heatmap, colorScaleId: string, prevColorScaleId: string):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HeatmapEventType.SELECT_COLOR_SCALE,
    'select color scale',
    node,
    node.setColorScale,
    colorScaleId,
    prevColorScaleId,
  );
};

export const selectSortByColumnEvent = (node: Heatmap, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HeatmapEventType.SELECT_SORT_BY_COLUMN,
    'select sort-by column',
    node,
    node.setSortByColumn,
    column,
    prevColumn,
  );
};

export const selectRowLabelColumnEvent = (node: Heatmap, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HeatmapEventType.SELECT_ROW_LABEL_COLUMN,
    (column !== null ? 'select' : 'clear') + ' row label column',
    node,
    node.setRowLabelColumn,
    column,
    prevColumn,
  );
};

export const toggleColumnLabelsVisibleEvent = (node: Heatmap, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HeatmapEventType.TOGGLE_COLUMN_LABELS_VISIBLE,
    'toggle column labels',
    node,
    node.setColumnLabelsVisible,
    value,
    !value,
  );
};

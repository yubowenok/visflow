import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import LineChart from './line-chart';

enum LineChartEventType {
  SELECT_SERIES_COLUMN = 'select-series-column',
  SELECT_VALUE_COLUMN = 'select-value-column',
  SELECT_GROUP_BY_COLUMN = 'select-group-by-column',
  TOGGLE_POINTS_VISIBLE = 'toggle-points-visible',
  TOGGLE_CURVE_DRAWING = 'toggle-curve-drawing',
  TOGGLE_LEGENDS_VISIBLE = 'toggle-legends-visible',
}

export const selectSeriesColumnEvent = (node: LineChart, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    LineChartEventType.SELECT_SERIES_COLUMN,
    'select series column',
    node,
    node.setSeriesColumn,
    column,
    prevColumn,
  );
};

export const selectValueColumnEvent = (node: LineChart, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    LineChartEventType.SELECT_VALUE_COLUMN,
    'select value column',
    node,
    node.setValueColumn,
    column,
    prevColumn,
  );
};

export const selectGroupByColumnEvent = (node: LineChart, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    LineChartEventType.SELECT_GROUP_BY_COLUMN,
    'select value column',
    node,
    node.setGroupByColumn,
    column,
    prevColumn,
  );
};

export const togglePointsVisibleEvent = (node: LineChart, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    LineChartEventType.TOGGLE_POINTS_VISIBLE,
    'toggle points',
    node,
    node.setPointsVisible,
    value,
    !value,
  );
};

export const toggleCurveDrawingEvent = (node: LineChart, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    LineChartEventType.TOGGLE_CURVE_DRAWING,
    'toggle curve',
    node,
    node.setCurveDrawing,
    value,
    !value,
  );
};

export const toggleLegendsVisibleEvent = (node: LineChart, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    LineChartEventType.TOGGLE_LEGENDS_VISIBLE,
    'toggle legends',
    node,
    node.setLegendsVisible,
    value,
    !value,
  );
};

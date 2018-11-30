import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import VisualEditor, { VisualEditorMode } from './visual-editor';
import { VisualPropertyType } from '@/data/visuals';

enum VisualEditorEventType {
  SELECT_MODE = 'setMode',
  INPUT_VISUALS_COLOR = 'setVisuals-color',
  INPUT_VISUALS_BORDER = 'setVisualsBorder',
  INPUT_VISUALS_SIZE = 'setVisualsSize',
  INPUT_VISUALS_WIDTH = 'setVisualsWidth',
  INPUT_VISUALS_OPACITY = 'setVisualsOpacity',
  SELECT_ENCODING_COLUMN = 'setEncodingColumn',
  SELECT_ENCODING_TYPE = 'setEncodingType',
  SELECT_ENCODING_COLOR_SCALE = 'setEncodingColorScale',
  INPUT_ENCODING_SCALE_MIN = 'setEncodingScaleMin',
  INPUT_ENCODING_SCALE_MAX = 'setEncodingScaleMax',
}

export const selectModeEvent = (node: VisualEditor, mode: VisualEditorMode, prevMode: VisualEditorMode):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.SELECT_MODE,
    'select visual editor mode',
    node,
    node.setMode,
    mode,
    prevMode,
  );
};

export const inputVisualsColorEvent = (node: VisualEditor, color: string | null, prevColor: string | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_VISUALS_COLOR,
    'input color',
    node,
    node.setVisualsColor,
    color,
    prevColor,
  );
};

export const inputVisualsBorderEvent = (node: VisualEditor, border: string | null, prevBorder: string | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_VISUALS_BORDER,
    'input border',
    node,
    node.setVisualsBorder,
    border,
    prevBorder,
  );
};

export const inputVisualsSizeEvent = (node: VisualEditor, size: number | null, prevSize: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_VISUALS_SIZE,
    'input size',
    node,
    node.setVisualsSize,
    size,
    prevSize,
  );
};

export const inputVisualsWidthEvent = (node: VisualEditor, width: number | null, prevWidth: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_VISUALS_WIDTH,
    'input width',
    node,
    node.setVisualsWidth,
    width,
    prevWidth,
  );
};

export const inputVisualsOpacityEvent = (node: VisualEditor, opacity: number | null, prevOpacity: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_VISUALS_OPACITY,
    'input opacity',
    node,
    node.setVisualsOpacity,
    opacity,
    prevOpacity,
  );
};

export const selectEncodingColumnEvent = (node: VisualEditor, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.SELECT_ENCODING_COLUMN,
    'select encoding column',
    node,
    node.setEncodingColumn,
    column,
    prevColumn,
  );
};

export const selectEncodingTypeEvent = (node: VisualEditor, type: VisualPropertyType, prevType: VisualPropertyType):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.SELECT_ENCODING_TYPE,
    'select encoding type',
    node,
    node.setEncodingType,
    type,
    prevType,
  );
};

export const selectEncodingColorScaleEvent = (node: VisualEditor, colorScaleId: string, prevColorScaleId: string):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.SELECT_ENCODING_COLOR_SCALE,
    'select color scale',
    node,
    node.setEncodingColorScale,
    colorScaleId,
    prevColorScaleId,
  );
};

export const inputEncodingScaleMinEvent = (node: VisualEditor, value: number | null, prevValue: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_ENCODING_SCALE_MIN,
    'input scale min',
    node,
    node.setEncodingScaleMin,
    value,
    prevValue,
  );
};

export const inputEncodingScaleMaxEvent = (node: VisualEditor, value: number | null, prevValue: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    VisualEditorEventType.INPUT_ENCODING_SCALE_MAX,
    'input scale max',
    node,
    node.setEncodingScaleMax,
    value,
    prevValue,
  );
};

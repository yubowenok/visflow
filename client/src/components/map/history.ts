import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Map from './map';

enum MapEventType {
  SELECT_LATITUDE_COLUMN = 'setLatitudeColumn',
  SELECT_LONGITUDE_COLUMN = 'setLongitudeColumn',
  TOGGLE_NAVIGATING = 'setNavigating',
}

export const selectLatitudeColumnEvent = (node: Map, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    MapEventType.SELECT_LATITUDE_COLUMN,
    'select latitude column',
    node,
    node.setLatitudeColumn,
    column,
    prevColumn,
  );
};

export const selectLongitudeColumnEvent = (node: Map, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    MapEventType.SELECT_LONGITUDE_COLUMN,
    'select longitude column',
    node,
    node.setLongitudeColumn,
    column,
    prevColumn,
  );
};

export const toggleNavigatingEvent = (node: Map, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    MapEventType.TOGGLE_NAVIGATING,
    'toggle navigation',
    node,
    node.setNavigating,
    value,
    !value,
  );
};

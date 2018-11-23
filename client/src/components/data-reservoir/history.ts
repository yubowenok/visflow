import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import DataReservoir from './data-reservoir';

enum DataReservoirEventType {
  RELEASE_OUTPUT = 'release-output',
  CLEAR_OUTPUT = 'clear-output',
}

export const releaseOutputEvent = (node: DataReservoir, items: number[], prevItems: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    DataReservoirEventType.RELEASE_OUTPUT,
    'release output',
    node,
    node.setItems,
    items.concat(),
    prevItems.concat(),
  );
};

export const clearOutputEvent = (node: DataReservoir, prevItems: number[]): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    DataReservoirEventType.CLEAR_OUTPUT,
    'clear output',
    node,
    node.setItems,
    [],
    prevItems.concat(),
  );
};

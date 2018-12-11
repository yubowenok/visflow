import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import SeriesPlayer from './series-player';

enum SeriesPlayerEventType {
  SELECT_TIME_COLUMN = 'setTimeColumn',
  INPUT_FRAMES_PER_SECOND = 'setFramesPerSecond',
  SET_CURRENT_TIME_INDEX = 'setCurrentTimeIndex',
}

export const selectTimeColumnEvent = (node: SeriesPlayer, column: number, prevColumn: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesPlayerEventType.SELECT_TIME_COLUMN,
    'set time column',
    node,
    node.setTimeColumn,
    column,
    prevColumn,
  );
};

export const setCurrentTimeIndexEvent = (node: SeriesPlayer, value: number, prevValue: number,
                                         message: string = 'set time'):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesPlayerEventType.SET_CURRENT_TIME_INDEX,
    message,
    node,
    node.setCurrentTimeIndex,
    value,
    prevValue,
  );
};

export const inputFramesPerSecondEvent = (node: SeriesPlayer, value: number, prevValue: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SeriesPlayerEventType.INPUT_FRAMES_PER_SECOND,
    'input frames per second',
    node,
    node.setFramesPerSecond,
    value,
    prevValue,
  );
};

import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Player from './player';

enum PlayerEventType {
  SELECT_TIME_COLUMN = 'setTimeColumn',
  INPUT_FRAMES_PER_SECOND = 'setFramesPerSecond',
  SET_CURRENT_TIME_INDEX = 'setCurrentTimeIndex',
}

export const selectTimeColumnEvent = (node: Player, column: number, prevColumn: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    PlayerEventType.SELECT_TIME_COLUMN,
    'set time column',
    node,
    node.setTimeColumn,
    column,
    prevColumn,
  );
};

export const setCurrentTimeIndexEvent = (node: Player, value: number, prevValue: number, message: string = 'set time'):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    PlayerEventType.SET_CURRENT_TIME_INDEX,
    message,
    node,
    node.setCurrentTimeIndex,
    value,
    prevValue,
  );
};

export const inputFramesPerSecondEvent = (node: Player, value: number, prevValue: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    PlayerEventType.INPUT_FRAMES_PER_SECOND,
    'input frames per second',
    node,
    node.setFramesPerSecond,
    value,
    prevValue,
  );
};

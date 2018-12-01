import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import SetOperator, { SetOperatorMode } from './set-operator';

enum SetOperatorEventType {
  SELECT_MODE = 'setMode',
}

export const selectModeEvent = (node: SetOperator, mode: SetOperatorMode, prevMode: SetOperatorMode):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    SetOperatorEventType.SELECT_MODE,
    'select set mode',
    node,
    node.setMode,
    mode,
    prevMode,
  );
};

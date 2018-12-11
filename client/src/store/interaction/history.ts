import { HistoryInteractionEvent, interactionEvent } from '@/store/history/types';
import { InteractionState } from './types';
import { State } from '../../../../node_modules/vuex-class';

enum InteractionEventType {
  TOGGLE_SYSTEM_VISMODE = 'toggle-system-vismode',
}

export const toggleSystemVisModeEvent = (value: boolean): HistoryInteractionEvent => {
  return interactionEvent(
    InteractionEventType.TOGGLE_SYSTEM_VISMODE,
    'toggle VisMode',
    value,
    { value: 'fas fa-video' },
  );
};

const undoToggleSystemVisMode = (state: InteractionState, evt: HistoryInteractionEvent) => {
  state.isSystemInVisMode = !(evt.data as boolean);
};

const redoToggleSystemVisMode = (state: InteractionState, evt: HistoryInteractionEvent) => {
  state.isSystemInVisMode = evt.data as boolean;
};

export const undo = (state: InteractionState, evt: HistoryInteractionEvent) => {
  switch (evt.type) {
    case InteractionEventType.TOGGLE_SYSTEM_VISMODE:
      undoToggleSystemVisMode(state, evt);
      break;
  }
};

export const redo = (state: InteractionState, evt: HistoryInteractionEvent) => {
  switch (evt.type) {
    case InteractionEventType.TOGGLE_SYSTEM_VISMODE:
      redoToggleSystemVisMode(state, evt);
      break;
  }
};

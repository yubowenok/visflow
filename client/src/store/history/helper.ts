import {
  HistoryState,
  HistoryEvent,
  HistoryNodeEvent,
  HistoryDiagramEvent,
  HistoryEventLevel,
} from '@/store/history/types';
import store from '@/store';
import { SubsetSelection } from '@/data/package';

const executeDiagramRedo = (evt: HistoryDiagramEvent) => {
  store.commit('dataflow/redo', evt);
};

const executeNodeRedo = (evt: HistoryNodeEvent) => {
  evt.node.redo(evt);
};

const executeRedo = (evt: HistoryEvent) => {
  if (evt.level === HistoryEventLevel.DIAGRAM) {
    executeDiagramRedo(evt as HistoryDiagramEvent);
  } else if (evt.level === HistoryEventLevel.NODE) {
    executeNodeRedo(evt as HistoryNodeEvent);
  }
};

export const redo = (state: HistoryState) => {
  const evt = state.redoStack.pop();
  if (evt) {
    executeRedo(evt);
    state.undoStack.push(evt);
  }
};

const executeDiagramUndo = (evt: HistoryDiagramEvent) => {
  store.commit('dataflow/undo', evt);
};

const executeNodeUndo = (evt: HistoryNodeEvent) => {
  evt.node.undo(evt);
};

const executeUndo = (evt: HistoryEvent) => {
  if (evt.level === HistoryEventLevel.DIAGRAM) {
    executeDiagramUndo(evt as HistoryDiagramEvent);
  } else if (evt.level === HistoryEventLevel.NODE) {
    executeNodeUndo(evt as HistoryNodeEvent);
  }
};

export const undo = (state: HistoryState) => {
  const evt = state.undoStack.pop();
  if (evt) {
    executeUndo(evt);
    state.redoStack.push(evt);
  }
};

/**
 * If the last two actions on the undo stack are toggling a same node option, remove them both as they cancel each
 * other and clutter the history.
 */
export const cancelToggles = (state: HistoryState) => {
  const undoStack = state.undoStack;
  if (undoStack.length < 2) {
    return;
  }
  const evt1 = undoStack[undoStack.length - 1] as HistoryNodeEvent;
  const evt2 = undoStack[undoStack.length - 2] as HistoryNodeEvent;
  if (evt1.node && evt2.node &&
    evt1.type === evt2.type && evt1.type.match(/toggle/) !== null &&
    evt1.data.prevValue === evt2.data.value &&
    evt1.data.value === evt2.data.prevValue) {
    undoStack.splice(-2);
  }
};

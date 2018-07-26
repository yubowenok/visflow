import {
  HistoryState,
  HistoryEvent,
  HistoryNodeEvent,
  HistoryDiagramEvent,
  HistoryEventLevel,
} from '@/store/history/types';
import store from '@/store';

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

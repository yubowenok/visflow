import { HistoryNodeEvent, nodeEvent } from '@/store/history/types';
import Visualization from './visualization';
import { SubsetSelection } from '@/data/package';

enum VisualizationEventType {
  INTERACTIVE_SELECTION = 'interactive-selection',
}

export const interactiveSelectionEvent = (node: Visualization, selection: SubsetSelection,
                                          prevSelection: SubsetSelection,
                                          message?: string) => {
  const count = selection.numItems();
  return nodeEvent(
    VisualizationEventType.INTERACTIVE_SELECTION,
    !message ? `select ${count} item${count !== 1 ? 's' : ''}` : message,
    node,
    {
      selection: selection.serialize(),
      prevSelection: prevSelection.serialize(),
    },
    { isNodeIcon: true, nodeType: node.nodeType },
  );
};

const undoInteractiveSelection = (evt: HistoryNodeEvent) => {
  (evt.node as Visualization).setSelection(evt.data.prevSelection);
};

const redoInteractiveSelection = (evt: HistoryNodeEvent) => {
  (evt.node as Visualization).setSelection(evt.data.selection);
};

export const undo = (evt: HistoryNodeEvent) => {
  switch (evt.type) {
    case VisualizationEventType.INTERACTIVE_SELECTION:
      undoInteractiveSelection(evt);
      break;
    default:
      return false;
  }
  return true;
};

export const redo = (evt: HistoryNodeEvent) => {
  switch (evt.type) {
    case VisualizationEventType.INTERACTIVE_SELECTION:
      redoInteractiveSelection(evt);
      break;
    default:
      return false;
  }
  return true;
};

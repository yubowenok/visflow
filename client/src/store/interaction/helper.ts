import Node from '@/components/node/node';
import { DataflowState } from '@/store/dataflow/types';
import { InteractionState } from './types';
import store from '@/store';
import _ from 'lodash';

const dataflow = (): DataflowState => store.state.dataflow;

/** Drags all selected nodes by (dx, dy). The dragged node does not additionally move. */
export const dragSelectedNodes = (dragged: Node | undefined, dx: number, dy: number) => {
  _.each(dataflow().nodes.filter(node => node.isSelected && node !== dragged), node => {
    node.moveBy(dx, dy);
  });
};

/** Deselects all selected nodes. */
export const deselectAllNodes = (options?: { exception?: Node }) => {
  const exception = options && options.exception;
  _.each(dataflow().nodes.filter(node => node.isSelected && node !== exception), node => {
    node.deselect();
  });
};

export const moveNode = (node: Node, dx: number, dy: number) => {
  node.moveBy(dx, dy);
};

export const moveNodes = (nodes: Node[], dx: number, dy: number) => {
  nodes.forEach(node => node.moveBy(dx, dy));
};

export const keyStroke = (state: InteractionState, keys: string, evt: JQuery.Event) => {
  switch (keys) {
    case 'delete':
    case state.osCtrlKey + '+d':
    case 'ctrl+x': // TODO: change to cut nodes
      store.commit('dataflow/removeSelectedNodes');
      break;
    case state.osCtrlKey + '+s':
      store.dispatch('dataflow/saveDiagram');
      break;
    case state.osCtrlKey + '+shift+s':
      store.commit('modals/openSaveAsDiagramModal');
      break;
    case state.osCtrlKey + '+l':
      store.commit('modals/openLoadDiagramModal');
      break;
    case state.osCtrlKey + '+n':
      store.commit('modals/openNewDiagramModal');
      break;
    case state.osCtrlKey + '+z':
      store.commit('history/undo');
      break;
    case state.osCtrlKey + '+shift+z':
      store.commit('history/redo');
      break;
    case 'a':
      store.commit('panels/openQuickNodePanel');
      break;
    case 'escape':
      store.commit('modals/closeNodeModal');
      break;
    case 'ctrl+r':
      // TODO: debug use only
      debugger; // tslint:disable-line
      break;
    default:
      // Pass the keyboard command to selected nodes.
      let handledByNode = false;
      store.state.dataflow.nodes.filter(node => node.isSelected).forEach(node => {
        handledByNode = handledByNode || node.onKeys(keys);
      });
      if (!handledByNode) {
        // The event is not handled anywhere.
        return;
      }
  }
  // The keystroke is handled by VisFlow, either globally or at nodes.
  // Prevent the browser's default actions.
  evt.preventDefault();

  // Clear lagging states for safety. Sometimes key combinations fail to trigger key releases, resulting in the
  // page getting stuck on pressed keys.
  /*
  state.ctrlPressed = false;
  state.altPressed = false;
  state.shiftPressed = false;
  */
};

/**
 * @fileoverview This is the state handler for system-wise interaction.
 */

import { Module } from 'vuex';
import { RootState } from '@/store';
import Port from '@/components/port/port';
import Node from '@/components/node/node';
import store from '@/store';
import * as helper from '@/store/interaction/helper';

export interface DragNodePayload {
  node: Node;
  dx: number;
  dy: number;
}
export interface InteractionState {
  draggedPort?: Port;
  draggedX1: number;
  draggedY1: number;
  draggedX2: number;
  draggedY2: number;

  altPressed: boolean;
  shiftPressed: boolean;
  ctrlPressed: boolean;
  altHold: boolean;
}

const initialState = {
  draggedPort: undefined,
  draggedX1: 0,
  draggedY1: 0,
  draggedX2: 0,
  draggedY2: 0,

  altPressed: false,
  shiftPressed: false,
  ctrlPressed: false,
  altHold: false,
};

const getters = {
  isAltPressed: (state: InteractionState): boolean => {
    return state.altHold || state.altPressed;
  },

  isShiftPressed: (state: InteractionState): boolean => {
    return state.shiftPressed;
  },

  isCtrlPressed: (state: InteractionState): boolean => {
    return state.ctrlPressed;
  },

  // TODO: check usage of this getter.
  numSelectedNodes: (state: InteractionState): number => {
    return store.state.dataflow.nodes.filter(node => node.isSelected).length;
  },
};

const mutations = {
  portDragStarted: (state: InteractionState, port: Port) => {
    state.draggedPort = port;
    const $port = $(port.$el);
    const portOffset = $port.offset() as JQuery.Coordinates;
    const portWidth = $port.width() as number;
    const portHeight = $port.height() as number;
    state.draggedX1 = portOffset.left + portWidth / 2;
    state.draggedY1 = portOffset.top + portHeight / 2;
  },

  portDragged: (state: InteractionState, p: Point) => {
    state.draggedX2 = p.x;
    state.draggedY2 = p.y;
  },

  portDragEnded: (state: InteractionState, port: Port) => {
    state.draggedPort = undefined;
  },

  dropPortOnNode: (state: InteractionState, node: Node) => {
    store.commit('dataflow/createEdge', {
      sourcePort: state.draggedPort,
      targetNode: node,
    });
  },

  dropPortOnPort: (state: InteractionState, port: Port) => {
    store.commit('dataflow/createEdge', {
      sourcePort: state.draggedPort,
      targetPort: port,
    });
  },

  toggleAltHold: (state: InteractionState, value?: boolean) => {
    if (value === undefined) {
      state.altHold = !state.altHold;
    } else {
      state.altHold = value;
    }
  },

  dragNode: (state: InteractionState, { dx, dy, node }: DragNodePayload) => {
    helper.dragSelectedNodes(node, dx, dy);
  },

  dragNodeStopped: (state: InteractionState) => {
    // helper.dragSelectedNodesStopped();
  },

  clickNode: (state: InteractionState, clicked: Node) => {
    helper.deselectAllNodes({ exception: clicked });
  },

  clickBackground: (state: InteractionState) => {
    helper.deselectAllNodes();
  },

  keydown: (state: InteractionState, key: string) => {
    switch (key.toLowerCase()) {
      case 'control':
        state.ctrlPressed = true;
        break;
      case 'shift':
        state.shiftPressed = true;
        break;
      case 'alt':
        state.altPressed = true;
        break;
    }
  },

  keyup: (state: InteractionState, key: string) => {
    key = key.toLowerCase();
    switch (true) {
      case key === 'control':
        state.ctrlPressed = false;
        break;
      case key === 'shift':
        state.shiftPressed = false;
        break;
      case key === 'alt':
        state.altPressed = false;
        break;
      case 'a' <= key && key <= 'z':
        mutations.keyStroke(state, [
          state.ctrlPressed ? 'ctrl' : '',
          state.shiftPressed ? 'shift' : '',
          key,
        ].filter(s => s !== '').join('+'));
        break;
    }
  },

  keyStroke(state: InteractionState, keys: string) {
    switch (keys) {
      case 'ctrl+d':
      case 'ctrl+x': // TODO: change to cut nodes
        store.commit('dataflow/removeSelectedNodes');
        break;
      case 'ctrl+s':
        store.dispatch('dataflow/saveDiagram');
        break;
      case 'ctrl+shift+s':
        store.commit('modals/openSaveAsDiagramModal');
        break;
      case 'ctrl+l':
        store.commit('modals/openLoadDiagramModal');
        break;
      case 'ctrl+n':
        store.commit('modals/openNewDiagramModal');
        break;
    }
  },
};

const interaction: Module<InteractionState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default interaction;

/**
 * @fileoverview This is the state handler for system-wise interaction.
 */
import { Module } from 'vuex';

import Node from '@/components/node/node';
import Port from '@/components/port/port';
import store, { RootState } from '@/store';
import * as helper from '@/store/interaction/helper';
import Edge from '@/components/edge/edge';
import { InteractionState } from './types';
import { areBoxesIntersected } from '@/common/util';
import * as history from './history';
import { HistoryInteractionEvent } from '@/store/history/types';

const IS_MAC = navigator.appVersion.match(/mac/i) !== null;

const initialState: InteractionState = {
  isNodeDragging: false,
  isNodeListDragging: false,

  draggedNode: undefined,
  draggedPort: undefined,
  draggedX1: 0,
  draggedY1: 0,
  draggedX2: 0,
  draggedY2: 0,
  lastMouseX: 0,
  lastMouseY: 0,

  altPressed: false,
  shiftPressed: false,
  ctrlPressed: false,
  metaPressed: false,
  altHold: false,

  isSystemInVisMode: false,

  mouseupEdge: undefined,

  osCtrlKey: IS_MAC ? 'meta' : 'ctrl',
  osCtrlKeyChar: IS_MAC ? '⌘' : '⇧',
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

  numSelectedNodes: (state: InteractionState): number => {
    return store.state.dataflow.nodes.filter(node => node.isSelected).length;
  },

  /**
   * Gets all the selected nodes.
   */
  selectedNodes: (state: InteractionState): Node[] => {
    return store.state.dataflow.nodes.filter(node => node.isSelected);
  },

  /**
   * Gets the focused node, the node with the highest focus score.
   */
  focusNode: (state: InteractionState): Node | null => {
    return helper.focusNode();
  },

  isDraggedNodeDroppable: (state: InteractionState): boolean => {
    if (!state.draggedNode) {
      return false;
    }
    // A dragged node is only droppable when it has no connections.
    // This is because a node with connections is most likely unable to be inserted onto an edge.
    // When multiple nodes are selected, none of them is droppable.
    return !state.draggedNode.getAllEdges().length && getters.numSelectedNodes(state) === 1;
  },
};

const mutations = {
  nodeListDragStarted: (state: InteractionState) => {
    state.isNodeListDragging = true;
    state.mouseupEdge = undefined; // Clear potential leftover mouseup edge from last mouse interaction.
  },

  nodeListDragEnded: (state: InteractionState) => {
    state.isNodeListDragging = false;
  },

  nodeDragStarted: (state: InteractionState, node: Node) => {
    state.isNodeDragging = true;
    state.draggedNode = node;
    state.mouseupEdge = undefined; // Clear potential leftover mouseup edge from last mouse interaction.
  },

  nodeDragEnded: (state: InteractionState) => {
    if (state.mouseupEdge && getters.isDraggedNodeDroppable(state)) {
      store.commit('dataflow/insertNodeOnEdge', {
        node: state.draggedNode,
        edge: state.mouseupEdge,
      });
    }
    state.isNodeDragging = false;
    state.draggedNode = undefined;
  },

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

  mouseupOnEdge: (state: InteractionState, edge: Edge) => {
    state.mouseupEdge = edge;
  },

  clearMouseupEdge: (state: InteractionState) => {
    state.mouseupEdge = undefined;
  },

  /**
   * Selects nodes that intersect the box on the canvas.
   */
  selectNodesInBoxOnCanvas: (state: InteractionState, box: Box) => {
    store.state.dataflow.nodes.forEach(node => {
      if (areBoxesIntersected(box, node.getBoundingBox())) {
        node.select();
      }
    });
  },

  toggleAltHold: (state: InteractionState, value?: boolean) => {
    if (value === undefined) {
      state.altHold = !state.altHold;
    } else {
      state.altHold = value;
    }
  },

  dragNode: (state: InteractionState, { node, dx, dy }: { node: Node, dx: number, dy: number }) => {
    helper.dragSelectedNodes(node, dx, dy);
  },

  // Directly moves node(s). These methods are called by programs controlling the history.
  moveNode: (state: InteractionState, { node, dx, dy }: { node: Node, dx: number, dy: number }) => {
    helper.moveNode(node, dx, dy);
  },
  moveNodes: (state: InteractionState, { nodes, dx, dy }: { nodes: Node[], dx: number, dy: number }) => {
    helper.moveNodes(nodes, dx, dy);
  },

  clickNode: (state: InteractionState, clicked: Node) => {
    helper.deselectAllNodes({ exception: clicked });
  },

  clickBackground: (state: InteractionState) => {
    helper.deselectAllNodes();
    helper.reduceAllNodeActiveness();
    helper.closeFlowsenseInput();
    window.getSelection().removeAllRanges(); // clear accidental browser range selection
  },

  reduceAllNodeActiveness: (state: InteractionState, clicked: Node) => {
    helper.reduceAllNodeActiveness({ exception: clicked });
  },

  trackMouseMove: (state: InteractionState, point: Point) => {
    state.lastMouseX = point.x;
    state.lastMouseY = point.y;
  },

  mouseup: (state: InteractionState) => {
  },

  keydown: (state: InteractionState, evt: JQuery.Event) => {
    const key = (evt.key as string).toLowerCase();
    switch (key) {
      case 'control':
        state.ctrlPressed = true;
        break;
      case 'shift':
        state.shiftPressed = true;
        break;
      case 'alt':
        state.altPressed = true;
        break;
      case 'meta':
        state.metaPressed = true;
        break;
      default:
        if ('a' <= key && key <= 'z') {
          helper.keyStroke(state, [
            state.metaPressed ? 'meta' : '',
            state.ctrlPressed ? 'ctrl' : '',
            state.shiftPressed ? 'shift' : '',
            key,
          ].filter(s => s !== '').join('+'), evt);
        }
    }
  },

  keyup: (state: InteractionState, evt: JQuery.Event) => {
    const key = (evt.key as string).toLowerCase();
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
      case key === 'meta':
        state.metaPressed = false;
        break;
    }
  },

  startSystemVisMode: (state: InteractionState) => {
    state.isSystemInVisMode = true;
    store.commit('history/commit', history.toggleSystemVisModeEvent(true));
  },

  endSystemVisMode: (state: InteractionState) => {
    state.isSystemInVisMode = false;
    store.commit('history/commit', history.toggleSystemVisModeEvent(false));
  },

  toggleSystemVisMode: (state: InteractionState) => {
    state.isSystemInVisMode = !state.isSystemInVisMode;
    store.commit('history/commit', history.toggleSystemVisModeEvent(state.isSystemInVisMode));
  },

  redo: (state: InteractionState, evt: HistoryInteractionEvent) => {
    history.redo(state, evt);
  },

  undo: (state: InteractionState, evt: HistoryInteractionEvent) => {
    history.undo(state, evt);
  },
};

const interaction: Module<InteractionState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default interaction;

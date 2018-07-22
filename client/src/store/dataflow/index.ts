import { Module } from 'vuex';
import store, { RootState } from '@/store';
import _ from 'lodash';

import { DataflowState, CreateNodeOptions, CreateEdgeOptions } from '@/store/dataflow/types';
import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Port from '@/components/port/port';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';
import * as helper from '@/store/dataflow/helper';
import * as saveLoad from '@/store/dataflow/save-load';
import * as nodeTypes from './node-types';

export * from '@/store/dataflow/util';

/** It is expected that the number of nodes do not exceed this limit, and we can rotate 300 layers. */
const MAX_NODE_LAYERS = 300;

export const getInitialState = (): DataflowState => ({
  canvas: undefined,
  nodeTypes: nodeTypes.nodeTypes,
  nodes: [],
  numNodeLayers: 0,
  filename: '',
  diagramName: '',
  isDeserializing: false,
});

export const initialState: DataflowState = getInitialState();

const getters = {
  topNodeLayer: (state: DataflowState): number => {
    return state.numNodeLayers;
  },

  /*
  canvasOffset: (state: DataflowState): JQuery.Coordinates => {
    return $(state.canvas.$el).offset() as JQuery.Coordinates;
  },
  */

  /** Retrieves the img source for a given type of node. */
  getImgSrc: (state: DataflowState) => {
    return (type: string) => nodeTypes.getImgSrc(type);
  },
};

const mutations = {
  /** Sets the rendering canvas to the global Vue Dataflow instance. */
  setCanvas: (state: DataflowState, canvas: DataflowCanvas) => {
    state.canvas = canvas;
  },

  /**
   * Assigns a new layer for a node.
   * This typically happens when a node is clicked so that it appears on top of the other nodes.
   */
  incrementNodeLayer: (state: DataflowState) => {
    if (state.numNodeLayers === MAX_NODE_LAYERS) {
      state.nodes.forEach(node => {
        node.layer = node.layer - MAX_NODE_LAYERS;
      });
      state.numNodeLayers -= MAX_NODE_LAYERS;
    }
    state.numNodeLayers++;
  },

  /** Creates a node without propagation. This assumes the new node does not connect to any other node. */
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    helper.createNode(state, options);
  },

  /** Removes a node and propagates. */
  removeNode: (state: DataflowState, node: Node) => {
    helper.removeNode(state, node, true);
  },

  /** Creates an edge and propagates. */
  createEdge: (state: DataflowState, options: CreateEdgeOptions) => {
    if (options.targetNode) {
      helper.createEdgeToNode(state, options.sourcePort, options.targetNode, true);
    } else if (options.targetPort) {
      helper.createEdge(state, options.sourcePort, options.targetPort, true);
    }
  },

  /** Removes an edge and propagates. */
  removeEdge: (state: DataflowState, edge: Edge) => {
    helper.removeEdge(state, edge, true);
  },

  /** Removes all incident edges to a port and propagates. */
  disconnectPort: (state: DataflowState, port: Port) => {
    helper.disconnectPort(state, port, true);
  },

  /** Notifies of port data change and propagates the change. */
  portUpdated: (state: DataflowState, port: Port) => {
    if (state.isDeserializing) {
      console.log('propagation blocked during deserialization from port of node', port.node.id);
      return;
    }
    helper.propagatePort(port);
  },

  /** Notifies of node data change and propagates the change. */
  nodeUpdated: (state: DataflowState, node: Node) => {
    if (state.isDeserializing) {
      console.log('propagation blocked during deserialization from node', node.id);
      return;
    }
    helper.propagateNode(node);
  },

  /** Moves all nodes by (dx, dy). */
  moveDiagram: (state: DataflowState, { dx, dy }: { dx: number, dy: number }) => {
    _.each(state.nodes.filter(node => node.isVisible), node => node.moveBy(dx, dy));
  },

  /** Removes the nodes that are currently selected. */
  removeSelectedNodes: (state: DataflowState) => {
    helper.removeSelectedNodes(state);
  },
  ...saveLoad.mutations,
};

const actions = {
  ...saveLoad.actions,
};

const dataflow: Module<DataflowState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

export default dataflow;

import { Module } from 'vuex';
import { RootState } from '../index';
import _ from 'lodash';

import { nodeTypes } from './node-types';
import { DataflowState, CreateNodeOptions, CreateEdgeOptions } from './types';
import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Port from '@/components/port/port';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';
import * as helper from './helper';

export * from './util';
export { DataflowState } from './types';

/** It is expected that the number of nodes do not exceed this limit, and we can rotate 300 layers. */
const MAX_NODE_LAYERS = 300;

const initialState: DataflowState = {
  canvas: new DataflowCanvas(),
  nodeTypes,
  nodes: [],
  numNodeLayers: 0,
  nodeIdCounter: 0,
};

const getters = {
  topNodeLayer: (state: DataflowState) => state.numNodeLayers,
  /*
  canvasOffset: (state: DataflowState): JQuery.Coordinates => {
    return $(state.canvas.$el).offset() as JQuery.Coordinates;
  },
  */
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
    helper.createEdge(state, options, true);
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
    helper.propagatePort(port);
  },

  /** Notifies of node data change and propagates the change. */
  nodeUpdated: (state: DataflowState, node: Node) => {
    helper.propagateNode(node);
  },

  /** Moves all nodes by (dx, dy). */
  moveDiagram: (state: DataflowState, { dx, dy }: { dx: number, dy: number }) => {
    _.each(state.nodes, node => node.moveBy(dx, dy));
  },

  /** Removes the nodes that are currently active. */
  removeActiveNodes: (state: DataflowState) => {
    helper.removeActiveNodes(state);
  },
};

export const dataflow: Module<DataflowState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

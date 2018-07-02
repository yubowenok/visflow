import { Module } from 'vuex';
import { RootState } from '../index';
import $ from 'jquery';

import save from './save';
import { nodeTypes, getConstructor } from './node-types';
import { DataflowState, CreateNodeOptions, CreateEdgeOptions } from './types';
import { VueConstructor } from 'vue';
import store from '../index';
import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Dataflow from '@/components/dataflow/dataflow';
import { checkEdgeConnectivity } from './util';
import { showSystemMessage } from '@/store/message';
export * from './util';

/** It is expected that the number of nodes do not exceed this limit, and we can rotate 300 layers. */
const MAX_NODE_LAYERS = 300;


const initialState: DataflowState = {
  canvas: new Dataflow(),
  nodeTypes,
  nodes: [],
  edges: [],
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
  setCanvas: (state: DataflowState, canvas_: Dataflow) => {
    state.canvas = canvas_;
  },

  /** Creates a dataflow node. */
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    const constructor = getConstructor(options.type) as VueConstructor;
    const id = `node-${state.nodeIdCounter++}`;
    const node: Node = new constructor({
      data: {
        id,
        // Floor the coordinates so that nodes are always aligned to integers.
        x: Math.floor(options.centerX),
        y: Math.floor(options.centerY),
      },
      store,
    }) as Node;
    state.canvas.addNode(node);
    state.nodes.push(node);
  },

  /** Removes a node from the dataflow diagram. */
  removeNode: (state: DataflowState, node: Node) => {
    for (const edge of node.getAllEdges()) {
      mutations.removeEdge(state, edge);
    }
    state.canvas.removeNode(node, () => node.$destroy());
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

  createEdge: (state: DataflowState, payload: CreateEdgeOptions) => {
    const sourcePort = payload.sourcePort;
    const targetPort = payload.targetPort || (payload.targetNode as Node).findConnectablePort(sourcePort);
    if (!targetPort) {
      showSystemMessage('cannot find available port to connect', 'warn');
      return;
    }
    const connectivity = checkEdgeConnectivity(sourcePort, targetPort);
    if (!connectivity.connectable) {
      showSystemMessage(connectivity.reason, 'warn');
      return;
    }
    const edge = new Edge({
      data: {
        // always create edge from output port to input port
        source: !sourcePort.isInput ? sourcePort : targetPort,
        target: !sourcePort.isInput ? targetPort : sourcePort,
      },
      store,
    });
    sourcePort.addIncidentEdge(edge);
    targetPort.addIncidentEdge(edge);
    state.canvas.addEdge(edge);
  },

  removeEdge: (state: DataflowState, edge: Edge) => {
    edge.source.removeIncidentEdge(edge);
    edge.target.removeIncidentEdge(edge);
    state.canvas.removeEdge(edge, () => edge.$destroy());
  },
};

const actions = {
};

export const dataflow: Module<DataflowState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

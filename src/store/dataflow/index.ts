import { Module, ActionContext } from 'vuex';
import { RootState } from '../index';
import save from './save';
import { nodeTypes, getConstructor } from './node-types';
import { DataflowState, CreateNodeOptions } from './types';
import { VueConstructor } from 'vue';
import store from '../index';
import Node from '@/components/node/node';
import Dataflow from '@/components/dataflow/dataflow';

let canvas: Dataflow;

/** It is expected that the number of nodes do not exceed this limit, and we can rotate 300 layers. */
const MAX_NODE_LAYERS = 300;

const defaultState: DataflowState = {
  nodeTypes,
  nodes: [],
  edges: [],
  numNodeLayers: 0,
  nodeIdCounter: 0,
};

const getters = {
  topNodeLayer: (state: DataflowState) => state.numNodeLayers,
};

const mutations = {
  /** Sets the rendering canvas to the global Vue Dataflow instance. */
  setCanvas: (state: DataflowState, canvas_: Dataflow) => {
    canvas = canvas_;
  },

  /** Creates a dataflow node. */
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    const constructor = getConstructor(options.type) as VueConstructor;
    const id = `node-${state.nodeIdCounter++}`;
    const node: Node = new constructor({
      data: {
        id,
        x: options.centerX,
        y: options.centerY,
      },
      store,
    }) as Node;
    canvas.addNode(node);
    state.nodes.push(node);
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

  createEdge: (statE: DataflowState, payload: any) => { // tslint:disable-line
    console.log('create edge', payload);
  },
};

const actions = {
};

export const dataflow: Module<DataflowState, RootState> = {
  namespaced: true,
  state: defaultState,
  getters,
  mutations,
  actions,
};

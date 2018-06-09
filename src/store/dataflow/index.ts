import { Module } from 'vuex';
import { RootState } from '../index';
import save from './save';
import { nodeTypes, getConstructor } from './node-types';
import { DataflowState, CreateNodeOptions } from './types';
import Dataflow from '@/components/dataflow/dataflow';
import { VueConstructor } from 'vue';
import store from '../index';

let canvas: Dataflow;

const defaultState: DataflowState = {
  nodes: [],
  edges: [],
  nodeTypes,
};

const getters = {
};

const mutations = {
  /** Sets the rendering canvas to the global Vue Dataflow instance. */
  setCanvas: (state: DataflowState, canvas_: Dataflow) => {
    canvas = canvas_;
  },

  /** Creates a dataflow node. */
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    const constructor = getConstructor(options.type) as VueConstructor;
    const id = 'test-id';
    const node = new constructor({
      data: {
        id,
        x: options.centerX,
        y: options.centerY,
      },
      store,
    });
    canvas.addNode(node);
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

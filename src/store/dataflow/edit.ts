import { DataflowState, CreateNodeOptions } from './types';

const defaultState = {
  nodes: [],
  edges: [],
};

const getters = {
};

const mutations = {
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    console.log(state, options);
  },
};

const actions = {
};

export default {
  state: defaultState,
  mutations,
};

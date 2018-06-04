import { Module } from 'vuex';
import { RootState } from './index';

export interface DataflowState {
  nodes: string[];
  edges: string[];
}
const state: DataflowState = {
  nodes: [],
  edges: [],
};

const getters = {
};

const mutations = {
  newDiagram() {
    console.log('dataflow.newDiagram()');
  },
  saveDiagram() {
    console.log('dataflow.saveDiagram()');
  },
  loadDiagram() {
    console.log('dataflow.loadDiagram()');
  },
};

const actions = {
};

export const dataflow: Module<DataflowState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};

import { Module } from 'vuex';
import { RootState } from '../index';
import { saveMutations } from './save';

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
  ...saveMutations,
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

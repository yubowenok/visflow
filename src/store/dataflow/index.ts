import { Module } from 'vuex';
import { RootState } from '../index';
import edit from './edit';
import save from './save';
import { DataflowState } from './types';

const state = {
  ...edit.state,
};

const getters = {
};

const mutations = {
  ...edit.mutations,
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

import { Module } from 'vuex';
import { RootState } from '../index';

const state = {
};

const mutations = {
};

const history: Module<typeof state, RootState> = {
  namespaced: true,
  state,
  mutations,
};

export default history;

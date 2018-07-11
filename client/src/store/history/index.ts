import { Module } from 'vuex';
import { RootState } from '@/store';

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

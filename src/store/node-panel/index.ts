import { Module } from 'vuex';
import { RootState } from '../index';

const state = {
  visible: true,
};

const getters = {
};

const mutations = {
  /** Shows/hides the node panel for node creation, on the left side of the screen. */
  toggle() {
    state.visible = !state.visible;
  },
};

const actions = {
};

export const nodePanel: Module<typeof state, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};

import { Module } from 'vuex';
import { RootState } from '../index';

interface SystemOptionsState {
  nodeLabelsVisible: boolean;
}

const defaultState: SystemOptionsState = {
  nodeLabelsVisible: true,
};

const getters = {
};

const mutations = {
  /** Shows/hides the text labels on top of the diagram nodes. */
  toggleNodeLabels(state: SystemOptionsState) {
    state.nodeLabelsVisible = !state.nodeLabelsVisible;
  },

  /**
   * Completely overrides the system state using an object.
   * This should be called when the system is loaded from a previous session.
   */
  setState(state: SystemOptionsState, newState: SystemOptionsState) {
    Object.assign(state, newState);
  },
};

const actions = {
};

export const systemOptions: Module<SystemOptionsState, RootState> = {
  namespaced: true,
  state: defaultState,
  getters,
  mutations,
  actions,
};

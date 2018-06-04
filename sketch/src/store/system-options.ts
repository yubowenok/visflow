import { Module } from 'vuex';
import { RootState } from './index';

export interface SystemOptionsState {
  nodeLabelsEnabled: boolean;
  nodePanelEnabled: boolean;
}

const defaultState: SystemOptionsState = {
  nodeLabelsEnabled: true,
  nodePanelEnabled: true,
};

const getters = {
};

const mutations = {
  /** Enable/disable the text labels on top of the diagram nodes. */
  toggleNodeLabels(state: SystemOptionsState) {
    state.nodeLabelsEnabled = !state.nodeLabelsEnabled;
  },

  /** Enable/disable the node panel, which is for dragging new nodes onto the canvas. */
  toggleNodePanel(state: SystemOptionsState) {
    state.nodePanelEnabled = !state.nodePanelEnabled;
    console.log(state.nodePanelEnabled);
  },

  /**
   * Completely override the system state using an object.
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

import { Module } from 'vuex';
import { RootState } from '@/store';

interface SystemOptionsState {
  nodeLabelsVisible: boolean;
  useBetaFeatures: boolean;
}

const initialState: SystemOptionsState = {
  nodeLabelsVisible: true,
  useBetaFeatures: true,
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

  /**
   * Uses new types of nodes in beta from VisFlow extensions.
   * This only affects options available in the UI.
   * Created beta nodes will not be affected.
   */
  toggleBetaFeatures(state: SystemOptionsState) {
    state.useBetaFeatures = !state.useBetaFeatures;
  },
};

const systemOptions: Module<SystemOptionsState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default systemOptions;

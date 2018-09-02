import { Module } from 'vuex';
import { RootState } from '@/store';

interface FlowsenseState {
  inputVisible: boolean;
  voiceEnabled: boolean;
}

const initialState: FlowsenseState = {
  inputVisible: false,
  voiceEnabled: false,
};

const mutations = {
  openInput(state: FlowsenseState) {
    state.inputVisible = true;
  },

  closeInput(state: FlowsenseState) {
    state.inputVisible = false;
  },

  toggleInput(state: FlowsenseState) {
    state.inputVisible = !state.inputVisible;
  },

  enableVoice(state: FlowsenseState) {
    state.voiceEnabled = true;
  },

  disableVoice(state: FlowsenseState) {
    state.voiceEnabled = false;
  },

  toggleVoice(state: FlowsenseState) {
    state.voiceEnabled = !state.voiceEnabled;
  },
};

const flowsense: Module<FlowsenseState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

export default flowsense;

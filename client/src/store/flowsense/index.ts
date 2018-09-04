import { Module, ActionContext } from 'vuex';
import { RootState } from '@/store';
import { FlowsenseToken, FlowsenseResult } from './types';
import { axiosPostFullUrl, errorMessage } from '@/common/util';
import { FLOWSENSE_URL } from '@/common/env';
import * as helper from './helper';

interface FlowsenseState {
  enabled: boolean;
  inputVisible: boolean;
  voiceEnabled: boolean;
}

const initialState: FlowsenseState = {
  enabled: FLOWSENSE_URL !== '',
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

const actions = {
  query(context: ActionContext<FlowsenseState, RootState>, tokens: FlowsenseToken[]): Promise<boolean> {
    const query = helper.injectQuery(tokens);
    return new Promise((resolve, reject) => {
      console.log('injected:', query);
      return axiosPostFullUrl<FlowsenseResult>(FLOWSENSE_URL, { query: query.query })
        .then(res => {
          const result: FlowsenseResult = res.data;
          helper.executeQuery(result.value, query);
          resolve(result.success);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },
};

const flowsense: Module<FlowsenseState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
  actions,
};

export default flowsense;

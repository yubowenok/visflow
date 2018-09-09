import { Module, ActionContext } from 'vuex';
import store, { RootState } from '@/store';
import { FlowsenseToken, FlowsenseResult, FlowsenseState } from './types';
import { axiosPostFullUrl, errorMessage } from '@/common/util';
import { FLOWSENSE_URL } from '@/common/env';
import * as helper from './helper';
import { focusNode } from '@/store/interaction/helper';

const initialState: FlowsenseState = {
  enabled: FLOWSENSE_URL !== '',
  inputVisible: false,
  voiceEnabled: false,
  activePosition: { x: 0, y: 0 },
};

const mutations = {
  openInput(state: FlowsenseState, noActivePosition?: boolean) {
    state.inputVisible = true;
    if (noActivePosition) {
      const node = focusNode();
      let p: Point;
      if (node === null) {
        p = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };
      } else {
        p = node.getCenter();
      }
      state.activePosition = p;
    } else {
      state.activePosition = {
        x: store.state.interaction.lastMouseX,
        y: store.state.interaction.lastMouseY,
      };
    }
  },

  closeInput(state: FlowsenseState) {
    state.inputVisible = false;
  },

  toggleInput(state: FlowsenseState, noActivePosition?: boolean) {
    if (!state.inputVisible) {
      mutations.openInput(state, noActivePosition);
    } else {
      mutations.closeInput(state);
    }
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

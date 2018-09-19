import { Module, ActionContext } from 'vuex';
import store, { RootState } from '@/store';
import {
  FlowsenseToken,
  FlowsenseResult,
  FlowsenseState,
  FlowsenseCategorizedToken,
  FlowsenseTokenCategory,
} from './types';
import { axiosPostFullUrl, errorMessage, urlJoin } from '@/common/util';
import { FLOWSENSE_URL } from '@/common/env';
import * as helper from './helper';
import { focusNode } from '@/store/interaction/helper';
import { parseTokens } from '@/store/flowsense/util';

const ACTIVE_POSITION_X_OFFSET_PX = 100;

const initialState: FlowsenseState = {
  enabled: FLOWSENSE_URL !== '',
  inputVisible: false,
  voiceEnabled: false,
  activePosition: { x: 0, y: 0 },
};

const getters = {
  specialUtterances(): FlowsenseCategorizedToken[] {
    return helper.getSpecialUtterances();
  },
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
      const focused = focusNode();
      let x = store.state.interaction.lastMouseX + ACTIVE_POSITION_X_OFFSET_PX;
      let y = store.state.interaction.lastMouseY;
      if (focused !== null) {
        const box = focused.getBoundingBox();
        x = box.x + box.width + ACTIVE_POSITION_X_OFFSET_PX;
        y = box.y + box.height / 2;
      }
      state.activePosition = { x, y };
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
      return axiosPostFullUrl<FlowsenseResult>(urlJoin(FLOWSENSE_URL, 'query'), { query: query.query })
        .then(res => {
          const result: FlowsenseResult = res.data;
          if (result.success) {
            try {
              helper.executeQuery(result.value, query);
            } catch (err) {
              reject(err);
            }
          }
          resolve(result.success);
        }, err => reject(errorMessage(err)));
    });
  },

  autoComplete(context: ActionContext<FlowsenseState, RootState>, tokens: FlowsenseToken[]):
    Promise<FlowsenseToken[][]> {
    const query = helper.injectQuery(tokens);
    let baseIndex = 0;
    tokens.forEach(token => baseIndex += token.text.length);
    return new Promise((resolve, reject) => {
      return axiosPostFullUrl<string[]>(urlJoin(FLOWSENSE_URL, 'auto-complete'), { query: query.query })
        .then(res => {
          const result: string[] = res.data;
          console.warn(result);
          const suggestions = result.map(suggestion => {
            const suggestionTokens = parseTokens((tokens[tokens.length - 1].text === ' ' ? '' : ' ') + suggestion);
            suggestionTokens.forEach(token => helper.ejectSuggestionToken(token));
            return tokens.concat(suggestionTokens);
          });
          resolve(suggestions);
        }, err => reject(errorMessage(err)));
    });
  },
};

const flowsense: Module<FlowsenseState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

export default flowsense;

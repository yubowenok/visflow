/**
 * @fileoverview This is the state handler for system-wise interaction.
 */

import { Module } from 'vuex';
import { RootState } from '../index';

const DEFAULT_MESSAGE_DURATION = 5000;

interface MessageState {
  text: string;
  class: string;
}

export interface MessageOptions {
  text: string;
  class?: string;
  duration?: number;
}

const initialState: MessageState = {
  text: '',
  class: '',
};

const getters = {
};

const mutations = {
  /**
   * [text and background colors of message classes]
   * - none: black/white
   * - warn: dark yellow/yellow
   * - error: dark red/red
   */
  showMessage: (state: MessageState, payload: MessageOptions) => {
    state.text = payload.text;
    state.class = payload.class || '';
    const duration = payload.duration || DEFAULT_MESSAGE_DURATION;
    if (state.class !== 'error') { // error message must be closed manually
      setTimeout(() => {
        state.text = '';
      }, duration);
    }
  },

  closeMessage: (state: MessageState) => {
    state.text = '';
  },
};

const actions = {
};

export const message: Module<MessageState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

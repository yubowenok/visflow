/**
 * @fileoverview This is the state handler for system-wise interaction.
 */

import { Module } from 'vuex';
import { RootState } from '../index';
export * from './util';

const DEFAULT_MESSAGE_DURATION = 5000;
/** Minimum duration between two consecutive messages */
const MESSAGE_INTERVAL = 100;

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
    const display = () => {
      state.text = payload.text;
      state.class = payload.class || '';
      const duration = payload.duration || DEFAULT_MESSAGE_DURATION;
      if (state.class !== 'error') { // error message must be closed manually
        setTimeout(() => {
          state.text = '';
        }, duration);
      }
    };
    if (state.text !== '') {
      // If we are currently showing a message, then first animate hiding it by setting it to the empty string.
      // Display the other (new) message after a short interval.
      state.text = '';
      setTimeout(() => display(), MESSAGE_INTERVAL);
    } else {
      display();
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

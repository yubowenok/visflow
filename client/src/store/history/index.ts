import { Module } from 'vuex';
import { RootState } from '@/store';
import _ from 'lodash';

import { HistoryEvent, HistoryState } from './types';
import * as helper from './helper';

const UNDO_STACK_SIZE = 30;

const initialState: HistoryState = {
  undoStack: [],
  redoStack: [],
};

const getters = {
  redoMessage(state: HistoryState): string {
    const evt = _.last(state.redoStack);
    return evt ? evt.message : '';
  },

  undoMessage(state: HistoryState): string {
    const evt = _.last(state.undoStack);
    return evt ? evt.message : '';
  },
};

const mutations = {
  redo(state: HistoryState) {
    helper.redo(state);
  },

  undo(state: HistoryState) {
    helper.undo(state);
  },

  clear(state: HistoryState) {
    state.undoStack = [];
    state.redoStack = [];
  },

  /**
   * Undoes the latest k events.
   */
  undoEvents(state: HistoryState, k: number) {
    while (k--) {
      helper.undo(state);
    }
  },

  /**
   * Redoes the last k events.
   */
  redoEvents(state: HistoryState, k: number) {
    while (k--) {
      helper.redo(state);
    }
  },

  commit(state: HistoryState, evt: HistoryEvent) {
    state.undoStack.push(evt);
    state.redoStack = [];
    if (state.undoStack.length > UNDO_STACK_SIZE) {
      state.undoStack.shift();
    }
  },
};

const history: Module<HistoryState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default history;

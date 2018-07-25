import { Module } from 'vuex';
import { RootState } from '@/store';
import _ from 'lodash';

import { HistoryEvent, HistoryState } from './types';
import * as helper from './helper';

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

  commit(state: HistoryState, evt: HistoryEvent) {
    state.undoStack.push(evt);
    state.redoStack = [];
  },
};

const history: Module<HistoryState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default history;

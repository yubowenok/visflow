import { Module, ActionContext } from 'vuex';
import { RootState } from '@/store';
import _ from 'lodash';

import { HistoryEvent, HistoryState, HistoryLogType, HistoryLog } from './types';
import * as helper from './helper';
import { axiosPost, errorMessage } from '@/common/util';

import { historyLog } from './util';

const initialState: HistoryState = {
  undoStack: [],
  redoStack: [],
  logs: [],
  currentLogIndex: -1,
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
    state.logs.push(historyLog(HistoryLogType.REDO, 1));
    helper.redo(state);
  },

  undo(state: HistoryState) {
    state.logs.push(historyLog(HistoryLogType.UNDO, 1));
    helper.undo(state);
  },

  clear(state: HistoryState) {
    state.undoStack = [];
    state.redoStack = [];
    state.logs = [];
  },

  // Clears all the logs. Called after saving the diagram to avoid double-appending logs.
  clearLogs(state: HistoryState) {
    state.logs = [];
  },

  /**
   * Undoes the latest k events.
   */
  undoEvents(state: HistoryState, k: number) {
    state.logs.push(historyLog(HistoryLogType.UNDO, k));
    helper.batchUndo(state, k);
  },

  /**
   * Redoes the last k events.
   */
  redoEvents(state: HistoryState, k: number) {
    state.logs.push(historyLog(HistoryLogType.REDO, k));
    helper.batchRedo(state, k);
  },

  /**
   * Pushes a history event to the event stack.
   */
  commit(state: HistoryState, evt: HistoryEvent) {
    // DEBUG: Make sure that event is serializable.
    try {
      JSON.stringify(evt);
    } catch (err) {
      console.error(err);
    }

    state.logs.push(historyLog(HistoryLogType.COMMIT, evt));
    state.currentLogIndex = state.logs.length - 1;

    helper.commitEvent(state, evt);
  },

  /**
   * Sets the logs to the given array, for post analysis.
   */
  setLogs(state: HistoryState, logs: HistoryLog[]) {
    helper.reproduceLogs(state, logs);
  },

  /**
   * Reproduces the latest step in the log pointed by currentLogIndex.
   */
  redoLog(state: HistoryState) {
    helper.redoLog(state);
  },

  /**
   * Adds a log entry without going through history event commit.
   * This is used to track diagram save/load operations.
   * This also tracks the experiment steps.
   */
  addLog(state: HistoryState, log: HistoryLog) {
    log.timestamp = new Date().getTime();
    state.logs.push(log);
  },
};

const actions = {
  sendLog(context: ActionContext<HistoryState, RootState>) {
    if (!context.rootState.user.username || !context.rootState.dataflow.filename) {
      return Promise.reject('invalid username/filename');
    }
    axiosPost<void>('log/save', {
      username: context.rootState.user.username,
      filename: context.rootState.dataflow.filename,
      logs: context.state.logs,
    }).then(() => {}, err => {
      console.error(err);
    });
  },

  loadLog(context: ActionContext<HistoryState, RootState>): Promise<HistoryLog[]> {
    if (!context.rootState.user.username || !context.rootState.dataflow.filename) {
      return Promise.reject('invalid username/filename');
    }
    return new Promise<HistoryLog[]>((resolve, reject) => {
      axiosPost<HistoryLog[]>('log/load', {
        username: context.rootState.user.username,
        filename: context.rootState.dataflow.filename,
      }).then(res => {
          resolve(res.data);
          context.commit('setLogs', res.data);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },
};

const history: Module<HistoryState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

export default history;

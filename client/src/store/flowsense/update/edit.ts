import * as util from './util';
import store from '@/store';
import FlowsenseUpdateTracker from './tracker';

export const undo = (tracker: FlowsenseUpdateTracker) => {
  store.commit('history/undo', true);
};

export const redo = (tracker: FlowsenseUpdateTracker) => {
  store.commit('history/redo', true);
};

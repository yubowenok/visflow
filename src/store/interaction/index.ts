/**
 * @fileoverview This is the state handler for system-wise interaction.
 */

import { Module } from 'vuex';
import { RootState } from '../index';
import Port from '@/components/port/port';
import Node from '@/components/node/node';
import store from '../index';

interface InteractionState {
  draggedPort?: Port;
}

const defaultState = {
  draggedPort: undefined,
};

const getters = {
};

const mutations = {
  portDragStarted: (state: InteractionState, port: Port) => {
    state.draggedPort = port;
  },
  portDragged: (state: InteractionState, p: { x: number, y: number }) => {
  },
  portDragEnded: (state: InteractionState, port: Port) => {
    state.draggedPort = undefined;
  },

  dropPortOnNode: (state: InteractionState, node: Node) => {
    store.commit('dataflow/createEdge', {
      sourcePort: state.draggedPort,
      node,
    });
  },
};

const actions = {
};

export const interaction: Module<InteractionState, RootState> = {
  namespaced: true,
  state: defaultState,
  getters,
  mutations,
  actions,
};

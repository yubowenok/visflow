import { Module } from 'vuex';
import { RootState } from '../index';
import { showSystemMessage } from '../message';
import store from '../index';

interface ModalsState {
  newDiagramModalVisible: boolean;
  saveAsDiagramModalVisible: boolean;
  loadDiagramModalVisible: boolean;
}

const initialState: ModalsState = {
  newDiagramModalVisible: false,
  saveAsDiagramModalVisible: false,
  loadDiagramModalVisible: false,
};

const mutations = {
  openNewDiagramModal(state: ModalsState) {
    state.newDiagramModalVisible = true;
  },

  closeNewDiagramModal(state: ModalsState) {
    state.newDiagramModalVisible = false;
  },

  openSaveAsDiagramModal(state: ModalsState) {
    if (!store.state.user.username) {
      showSystemMessage('you must login to save diagram', 'warn');
      return;
    }
    state.saveAsDiagramModalVisible = true;
  },

  closeSaveAsDiagramModal(state: ModalsState) {
    state.saveAsDiagramModalVisible = false;
  },

  openLoadDiagramModal(state: ModalsState) {
    state.loadDiagramModalVisible = true;
  },

  closeLoadDiagramModal(state: ModalsState) {
    state.loadDiagramModalVisible = false;
  },
};

const modals: Module<ModalsState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

export default modals;

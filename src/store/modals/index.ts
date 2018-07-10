import { Module } from 'vuex';
import { RootState } from '@/store';
import { showSystemMessage } from '@/store/message';
import store from '@/store';

interface ModalsState {
  newDiagramModalVisible: boolean;
  saveAsDiagramModalVisible: boolean;
  loadDiagramModalVisible: boolean;

  loginModalVisible: boolean;
  signupModalVisible: boolean;
  profileModalVisible: boolean;
}

const initialState: ModalsState = {
  newDiagramModalVisible: false,
  saveAsDiagramModalVisible: false,
  loadDiagramModalVisible: false,

  loginModalVisible: false,
  signupModalVisible: false,
  profileModalVisible: false,
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

  openLoginModal(state: ModalsState) {
    state.loginModalVisible = true;
  },

  closeLoginModal(state: ModalsState) {
    state.loginModalVisible = false;
  },

  openSignupModal(state: ModalsState) {
    state.signupModalVisible = true;
  },

  closeSignupModal(state: ModalsState) {
    state.signupModalVisible = false;
  },

  openProfileModal(state: ModalsState) {
    state.profileModalVisible = true;
  },

  closeProfileModal(state: ModalsState) {
    state.profileModalVisible = false;
  },
};

const modals: Module<ModalsState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

export default modals;

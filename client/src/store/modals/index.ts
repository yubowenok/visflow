import { Module } from 'vuex';

import store, { RootState } from '@/store';
import { showSystemMessage } from '@/common/util';
import { MessageModalOptions } from './types';

interface ModalsState {
  nodeModalMount: Element;
  nodeModalVisible: boolean;

  newDiagramModalVisible: boolean;
  saveAsDiagramModalVisible: boolean;
  loadDiagramModalVisible: boolean;

  loginModalVisible: boolean;
  signupModalVisible: boolean;
  profileModalVisible: boolean;

  messageModalVisible: boolean;
  messageModalOptions: MessageModalOptions;
}

const initialState: ModalsState = {
  nodeModalMount: document.createElement('div'), // dummy element
  nodeModalVisible: false,

  newDiagramModalVisible: false,
  saveAsDiagramModalVisible: false,
  loadDiagramModalVisible: false,

  loginModalVisible: false,
  signupModalVisible: false,
  profileModalVisible: false,

  messageModalVisible: false,
  messageModalOptions: {
    title: '',
    message: '',
  },
};

const mutations = {
  setNodeModalMount(state: ModalsState, mount: Element) {
    state.nodeModalMount = mount;
  },

  mountNodeModal(state: ModalsState, modal: Element) {
    if (!modal) {
      console.error('attempted to mount undefined node modal');
      return;
    }
    state.nodeModalMount.appendChild(modal);
  },

  unmountNodeModal(state: ModalsState, modal: Element) {
    if (modal.parentElement !== state.nodeModalMount) {
      console.error('attempt to mount an unmounted node modal');
      return;
    }
    state.nodeModalMount.appendChild(modal);
  },

  openNodeModal(state: ModalsState) {
    state.nodeModalVisible = true;
  },

  closeNodeModal(state: ModalsState) {
    state.nodeModalVisible = false;
  },

  openNewDiagramModal(state: ModalsState) {
    state.newDiagramModalVisible = true;
  },

  closeNewDiagramModal(state: ModalsState) {
    state.newDiagramModalVisible = false;
  },

  openSaveAsDiagramModal(state: ModalsState) {
    if (!store.state.user.username) {
      showSystemMessage(store, 'you must login to save diagram', 'warn');
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

  openMessageModal(state: ModalsState, options: MessageModalOptions) {
    state.messageModalVisible = true;
    state.messageModalOptions = options;
  },

  closeMessageModal(state: ModalsState) {
    state.messageModalVisible = false;
  },
};

const modals: Module<ModalsState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

export default modals;

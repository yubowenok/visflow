import { Module } from 'vuex';
import { RootState } from '../index';
import ContextMenu from '@/components/context-menu/context-menu';

interface ContextMenuState {
  mount: Element;
}

const initialState: ContextMenuState = {
  mount: document.createElement('div'), // dummy element
};

const mutations = {
  setMount(state: ContextMenuState, mount: Element) {
    state.mount = mount;
  },

  mount(state: ContextMenuState, menu: ContextMenu) {
    if (!menu) {
      console.error('attempted to mount undefined context menu');
      return;
    }
    state.mount.appendChild(menu.$el);
  },
};

const contextMenu: Module<ContextMenuState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

export default contextMenu;

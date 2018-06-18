import { Module } from 'vuex';
import { RootState } from '../index';
import PortPanel from '@/components/port-panel/port-panel';
import OptionPanel from '@/components/option-panel/option-panel';

interface PanelsState {
  optionPanelMount: Element;
  portPanelMount: Element;
  nodePanelVisible: boolean;
}

const initialState: PanelsState = {
  optionPanelMount: document.createElement('div'), // dummy element
  portPanelMount: document.createElement('div'),
  nodePanelVisible: true,
};

const mutations = {
  setOptionPanelMount(state: PanelsState, mount: Element) {
    state.optionPanelMount = mount;
  },

  setPortPanelMount(state: PanelsState, mount: Element) {
    state.portPanelMount = mount;
  },

  mountOptionPanel(state: PanelsState, panel: OptionPanel) {
    if (!panel) {
      console.error('attempted to mount undefined option panel');
      return;
    }
    state.optionPanelMount.appendChild(panel.$el);
  },

  mountPortPanel(state: PanelsState, panel: PortPanel) {
    if (!panel) {
      console.error('attempted to mount undefined port panel');
      return;
    }
    state.portPanelMount.appendChild(panel.$el);
  },

  toggleNodePanel(state: PanelsState) {
    state.nodePanelVisible = !state.nodePanelVisible;
  },
};

export const panels: Module<PanelsState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

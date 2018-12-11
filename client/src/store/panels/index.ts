import { Module } from 'vuex';
import store, { RootState } from '@/store';
import PortPanel from '@/components/port-panel/port-panel';
import OptionPanel from '@/components/option-panel/option-panel';
import { showSystemMessage } from '@/common/util';

interface PanelsState {
  optionPanelMount: Element;
  portPanelMount: Element;
  nodePanelVisible: boolean;
  quickNodePanelVisible: boolean;
  historyPanelVisible: boolean;
  logPanelVisible: boolean;
}

const initialState: PanelsState = {
  optionPanelMount: document.createElement('div'), // dummy element
  portPanelMount: document.createElement('div'),
  nodePanelVisible: true,
  quickNodePanelVisible: false,
  historyPanelVisible: false,
  logPanelVisible: false,
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

  unmountOptionPanel(state: PanelsState, panel: OptionPanel) {
    if (panel.$el.parentElement !== state.optionPanelMount) {
      console.error('attempt to mount an unmounted option panel');
      return;
    }
    state.optionPanelMount.removeChild(panel.$el);
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

  openQuickNodePanel(state: PanelsState) {
    if (store.state.interaction.isSystemInVisMode) {
      showSystemMessage(store, 'cannot create node in VisMode', 'warn');
      return;
    }
    state.quickNodePanelVisible = true;
  },

  closeQuickNodePanel(state: PanelsState) {
    state.quickNodePanelVisible = false;
  },

  toggleHistoryPanel(state: PanelsState) {
    state.historyPanelVisible = !state.historyPanelVisible;
  },

  closeHistoryPanel(state: PanelsState) {
    state.historyPanelVisible = false;
  },

  openLogPanel(state: PanelsState) {
    state.logPanelVisible = true;
  },

  closeLogPanel(state: PanelsState) {
    state.logPanelVisible = false;
  },
};

const panels: Module<PanelsState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
};

export default panels;

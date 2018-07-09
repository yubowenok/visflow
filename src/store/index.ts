import Vue from 'vue';
import Vuex from 'vuex';
import dataflow from './dataflow';
import systemOptions from './system-options';
import panels from './panels';
import interaction from './interaction';
import message from './message';
import contextMenu from './context-menu';
import user from './user';
import dataset from './dataset';
import modals from './modals';
import history from './history';
import { DataflowState } from '@/store/dataflow';
import { InteractionState } from '@/store/interaction';
import { UserState } from '@/store/user';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export interface RootState {
  version?: number;
  dataflow: DataflowState;
  interaction: InteractionState;
  user: UserState;
}

export const defaultStore = {
  modules: {
    contextMenu,
    dataflow,
    dataset,
    history,
    interaction,
    message,
    modals,
    panels,
    systemOptions,
    user,
  },
};

export default new Vuex.Store<RootState>(defaultStore);

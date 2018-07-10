import Vue from 'vue';
import Vuex from 'vuex';
import dataflow from '@/store/dataflow';
import systemOptions from '@/store/system-options';
import panels from '@/store/panels';
import interaction from '@/store/interaction';
import message from '@/store/message';
import contextMenu from '@/store/context-menu';
import user from '@/store/user';
import dataset from '@/store/dataset';
import modals from '@/store/modals';
import history from '@/store/history';
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

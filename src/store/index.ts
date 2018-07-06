import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { dataflow } from './dataflow';
import { systemOptions } from './system-options';
import { panels } from './panels';
import { interaction } from './interaction';
import { message } from './message';
import { contextMenu } from './context-menu';
import { user } from './user';
import { dataset } from './dataset';
import { history } from './history';
import { DataflowState } from '@/store/dataflow/types';
import { InteractionState } from '@/store/interaction';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export interface RootState {
  version?: number;
  dataflow: DataflowState;
  interaction: InteractionState;
}

export const defaultStore = {
  modules: {
    dataflow,
    systemOptions,
    panels,
    interaction,
    message,
    contextMenu,
    user,
    dataset,
  },
};

export default new Vuex.Store<RootState>(defaultStore);

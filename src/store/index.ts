import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { dataflow } from './dataflow';
import { systemOptions } from './system-options';
import { panels } from './panels';
import { interaction } from './interaction';
import { message } from './message';
import { history } from './history';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export interface RootState {
  version?: number;
}

export const defaultStore = {
  modules: {
    dataflow,
    systemOptions,
    panels,
    interaction,
    message,
  },
};

export default new Vuex.Store<RootState>(defaultStore);

import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { dataflow } from './dataflow/dataflow';
import { systemOptions } from './system-options/system-options';
import { nodePanel } from './node-panel/node-panel';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export interface RootState {
  version?: number;
}

export const defaultStore = {
  modules: {
    dataflow,
    systemOptions,
    nodePanel,
  },
};

export default new Vuex.Store<RootState>(defaultStore);

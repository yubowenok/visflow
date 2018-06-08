import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { dataflow } from './dataflow';
import { systemOptions } from './system-options/system-options';
import { nodePanel } from './node-panel/node-panel';
import { interaction } from './interaction/interaction';

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
    interaction,
  },
};

export default new Vuex.Store<RootState>(defaultStore);

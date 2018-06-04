import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { dataflow } from './dataflow';
import { systemOptions } from './system-options';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export interface RootState {
  version?: number;
}

export default new Vuex.Store<RootState>({
  modules: {
    dataflow,
    systemOptions,
  },
});

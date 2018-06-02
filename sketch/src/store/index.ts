import Vue from 'vue';
import Vuex from 'vuex';
import dataflow from './modules/dataflow';
import options from './modules/options';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    dataflow,
    options,
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : []
});

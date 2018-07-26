import Vue from 'vue';
import Vuex from 'vuex';

import contextMenu from '@/store/context-menu';
import dataflow from '@/store/dataflow';
import dataset from '@/store/dataset';
import history from '@/store/history';
import interaction from '@/store/interaction';
import message from '@/store/message';
import modals from '@/store/modals';
import panels from '@/store/panels';
import router from '@/store/router';
import systemOptions from '@/store/system-options';
import user from '@/store/user';
import { RootState } from './types';

Vue.use(Vuex);

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
    router,
    systemOptions,
    user,
  },
};

export { RootState };

export default new Vuex.Store<RootState>(defaultStore);

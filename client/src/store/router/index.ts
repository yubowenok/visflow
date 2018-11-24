import { Module } from 'vuex';
import { RootState } from '@/store/types';
import VueRouter from 'vue-router';

export interface RouterState {
  router: VueRouter | undefined;
  lastUrl: string;
}

const initialState: RouterState = {
  router: undefined,
  lastUrl: '/',
};

const getters = {
  currentPath(state: RouterState): string {
    if (!state.router) {
      return '';
    }
    return state.router.currentRoute.path;
  },
};

const mutations = {
  setRouter(state: RouterState, router_: VueRouter) {
    state.router = router_;
  },

  replace(state: RouterState, url: string) {
    state.lastUrl = url;
    if (state.router) {
      state.router.replace(url);
    }
  },
};

const router: Module<RouterState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
};

export default router;

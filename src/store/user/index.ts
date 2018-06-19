import { Module, ActionContext } from 'vuex';
import { RootState } from '../index';

interface UserState {
  username: string;
}

const initialState: UserState = {
  username: '',
};

const getters = {
};

const mutations = {
};

const actions = {
  login: (context: ActionContext<UserState, RootState>) => {
    context.state.username = 'yubowenok';
  },
};

export const user: Module<UserState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

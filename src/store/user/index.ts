import { Module, ActionContext } from 'vuex';
import { RootState } from '../index';

import { axiosPost, errorMessage } from '@/common/util';

interface UserState {
  username: string;

  // an error message displayed during the login/register process
  errorMessage: string;
}

export interface SignupProfile {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
}

export interface LoginProfile {
  username: string;
  password: string;
}

const initialState: UserState = {
  username: '',
  errorMessage: '',
};

const getters = {
};

const mutations = {
  loginUser: (state: UserState, username: string) => {
    state.username = username;
  },

  logoutUser: (state: UserState) => {
    state.username = '';
  },

  resetMessage: (state: UserState) => {
    state.errorMessage = '';
  },
};

const actions = {
  login(context: ActionContext<UserState, RootState>, profile: LoginProfile): Promise<string> {
    return new Promise((resolve, reject) => {
      axiosPost<{ username: string }>('/user/login', profile)
        .then(res => {
          context.commit('loginUser', res.data.username);
          resolve(res.data.username);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  logout(context: ActionContext<UserState, RootState>): Promise<void> {
    return new Promise((resolve, reject) => {
      axiosPost<void>('/user/logout', {})
        .then(() => {
          context.commit('logoutUser');
          resolve();
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  signup(context: ActionContext<UserState, RootState>, profile: SignupProfile): Promise<string> {
    return new Promise((resolve, reject) => {
      axiosPost<{ username: string }>('/user/signup', profile)
        .then(res => {
          context.commit('loginUser', res.data.username);
          resolve(res.data.username);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  /**
   * Queries the currently logged in user from the last session.
   * The promise returnsempty string when no user logged in or the session expires.
   */
  whoami(context: ActionContext<UserState, RootState>): Promise<string> {
    return new Promise((resolve, reject) => {
      axiosPost<{ username: string }>('/user/whoami', {})
        .then(res => {
          context.commit('loginUser', res.data.username);
          resolve(res.data.username || '');
        })
        .catch(err => reject(errorMessage(err)));
    });
  },
};

export const user: Module<UserState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

import { Module, ActionContext } from 'vuex';
import { RootState } from '../index';
import axios from 'axios';

import { errorMessage } from '../util';
import { API_URL } from '../../common/url';

const axiosConfig = {
  withCredentials: true,
};
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
  login(context: ActionContext<UserState, RootState>, profile: LoginProfile) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/user/login', profile, axiosConfig)
        .then(res => {
          context.commit('loginUser', res.data.username);
          resolve(res.data.username);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  logout(context: ActionContext<UserState, RootState>) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/user/logout', {}, axiosConfig)
        .then(() => {
          context.commit('logoutUser');
          resolve();
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  signup(context: ActionContext<UserState, RootState>, profile: SignupProfile) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/user/signup', profile, axiosConfig)
        .then(res => {
          resolve(res.data.username);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  whoami(context: ActionContext<UserState, RootState>) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/user/whoami', {}, axiosConfig)
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

import { Module, ActionContext } from 'vuex';
import { RootState } from '../index';
import axios from 'axios';
import { API_URL } from '../../common/url';

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
      axios.post(API_URL + '/user/login', profile)
        .then(res => {
          context.commit('loginUser', res.data.username);
          resolve(res.data.username);
        })
        .catch(err => {
          const msg = (err.response && err.response.data) || err.message;
          reject(msg);
        });
    });
  },

  logout(context: ActionContext<UserState, RootState>) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/user/login')
        .then(res => {
          context.commit('logoutUser');
          resolve();
        })
        .catch(err => {
          const msg = (err.response && err.response.data) || err.message;
          reject(msg);
        });
    });
  },

  signup(context: ActionContext<UserState, RootState>, profile: SignupProfile) {
    return new Promise((resolve, reject) => {
      axios.post(API_URL + '/user/signup', profile)
        .then(res => {
          resolve(res.data.username);
        })
        .catch(err => {
          const msg = (err.response && err.response.data) || err.message;
          reject(msg);
        });
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

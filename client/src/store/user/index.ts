import { Module, ActionContext  } from 'vuex';
import store, { RootState } from '@/store';

import { UserState, UserInfo, LoginProfile, SignupProfile, ChangePasswordProfile } from './types';
import { axiosPost, errorMessage } from '@/common/util';

const initialState: UserState = {
  username: '',
  errorMessage: '',

  userInfo: {
    username: '',
    email: '',
  },
  loginCallback: undefined,
};

const mutations = {
  loginUser: (state: UserState, userInfo: UserInfo) => {
    state.userInfo = userInfo;
    state.username = userInfo.username;
  },

  logoutUser: (state: UserState) => {
    state.userInfo = { username: '', email: '' };
    state.username = '';
  },

  resetMessage: (state: UserState) => {
    state.errorMessage = '';
  },
};

/**
 * Dispatches user related actions upon login.
 */
const onLogin = (context: ActionContext<UserState, RootState>) => {
  context.dispatch('dataflow/listDiagram', null, { root: true });
  context.dispatch('dataset/listDataset', null, { root: true });
};

const actions = {
  /**
   * Request login by showing a login modal.
   * After the user successfully logins, callback will be executed.
   */
  requestLogin(context: ActionContext<UserState, RootState>, options: { loginCallback?: () => void }): void {
    context.state.loginCallback = options.loginCallback;
    store.commit('modals/openLoginModal');
  },

  login(context: ActionContext<UserState, RootState>, profile: LoginProfile): Promise<string> {
    return new Promise((resolve, reject) => {
      axiosPost<UserInfo>('/user/login', profile)
        .then(res => {
          context.commit('loginUser', res.data);
          onLogin(context);
          resolve(res.data.username);
          if (context.state.loginCallback) {
            context.state.loginCallback();
          }
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
      axiosPost<UserInfo>('/user/signup', profile)
        .then(res => {
          context.commit('loginUser', res.data);
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
      axiosPost<UserInfo>('/user/whoami', {})
        .then(res => {
          context.commit('loginUser', res.data);
          onLogin(context);
          resolve(res.data.username || '');
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  /**
   * Updates password.
   */
  changePassword(context: ActionContext<UserState, RootState>, profile: ChangePasswordProfile): Promise<void> {
    return new Promise((resolve, reject) => {
      axiosPost<void>('/user/changePassword', profile)
      .then(() => resolve())
      .catch(err => reject(errorMessage(err)));
    });
  },
};

const user: Module<UserState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
  actions,
};

export default user;

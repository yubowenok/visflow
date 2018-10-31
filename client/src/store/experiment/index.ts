import { Module, ActionContext } from 'vuex';
import store, { RootState } from '@/store';

import { axiosPost, errorMessage, showSystemMessage } from '@/common/util';
import { ExperimentState, ExperimentInfo } from './types';
import { DiagramSave } from '../dataflow/types';
import { deserializeDiagram } from '../dataflow/helper';

const initialState: ExperimentState = {
  filename: '',
  diagramName: '',
};

const getters = {
  isInExperiment(state: ExperimentState) {
    return state.filename !== '';
  },
};

const mutations = {
  setInfo(state: ExperimentState, info: ExperimentInfo) {
    state.diagramName = info.diagramName;
    state.filename = info.filename;
  },
};

const actions = {
  login(context: ActionContext<ExperimentState, RootState>): Promise<void> {
    return new Promise((resolve, reject) => {
      axiosPost<void>('/user/login', {
        username: '_experiment',
        password: '_experiment',
      });
    });
  },

  start(context: ActionContext<ExperimentState, RootState>): Promise<ExperimentInfo> {
    return new Promise((resolve, reject) => {
      axiosPost<ExperimentInfo>('/experiment/start')
        .then(res => {
          context.commit('setInfo', res.data);
          context.commit('router/replace', `/experiment/${res.data.filename}`, { root: true });
          resolve(res.data);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  /**
   * Loads an ongoing experiment.
   */
  load(context: ActionContext<ExperimentState, RootState>, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      axiosPost<DiagramSave>('/diagram/load', { filename })
        .then(res => {
          deserializeDiagram(context.rootState.dataflow, res.data);

          showSystemMessage(store, `Diagram loaded: ${res.data.diagramName}`, 'success');
          resolve(res.data.diagramName);
        });
    });
  },
};

const experiment: Module<ExperimentState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

export default experiment;

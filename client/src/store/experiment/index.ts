import { Module, ActionContext } from 'vuex';
import store, { RootState } from '@/store';

import { axiosPost, errorMessage, showSystemMessage } from '@/common/util';
import { ExperimentState, ExperimentInfo, ExperimentProgress, EXPERIMENT_STEPS } from './types';
import { DiagramSave } from '../dataflow/types';
import { deserializeDiagram, resetDataflow } from '../dataflow/helper';
import { HistoryLogType } from '../history/types';

const initialState: ExperimentState = {
  filename: '',
  diagramName: '',
  step: 'consentForm',
};

const getters = {
  isInExperiment(state: ExperimentState) {
    return state.filename !== '';
  },

  stepIndex(state: ExperimentState): number {
    return EXPERIMENT_STEPS.indexOf(state.step);
  },
};

const mutations = {
  setInfo(state: ExperimentState, info: ExperimentInfo) {
    state.diagramName = info.diagramName;
    state.filename = info.filename;
  },

  setStep(state: ExperimentState, step: string) {
    state.step = step;
  },

  /**
   * Proceeds to the next step of the experiment.
   */
  next(state: ExperimentState) {
    const stepIndex = getters.stepIndex(state);
    if (stepIndex === EXPERIMENT_STEPS.length - 1) {
      store.commit('router/reload', '/');
      return;
    }
    const oldStep = state.step;
    const newStep = EXPERIMENT_STEPS[stepIndex + 1];
    store.commit('history/addLog', {
      type: HistoryLogType.EXPERIMENT_STEP,
      data: {
        step: newStep,
        message: newStep,
      },
    });
    if (oldStep === 'consentForm' && !state.filename) {
      store.dispatch('experiment/start');
    }
    mutations.setStep(state, newStep);
  },

  /**
   * Goes back to the previous step of the experiment.
   */
  previous(state: ExperimentState) {
    const stepIndex = getters.stepIndex(state);
    if (stepIndex === 0) {
      console.warn('no previous experiment step');
      return;
    }
    const newStep = EXPERIMENT_STEPS[stepIndex - 1];
    mutations.setStep(state, newStep);
  },
};

const actions = {
  login(context: ActionContext<ExperimentState, RootState>): Promise<void> {
    return new Promise((resolve, reject) => {
      store.dispatch('user/login', {
        username: '_experiment',
        password: '_experiment',
      }).then(res => resolve())
        .catch(err => reject(errorMessage(err)));
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
          const diagramData = res.data;

          axiosPost<ExperimentInfo>('/experiment/progress', { filename })
            .then(progressRes => {
              const info = progressRes.data;
              context.commit('setInfo', info);
              context.commit('setStep', info.step);

              console.warn('step is', info);

              context.commit('dataflow/setDiagramName', info.diagramName, { root: true });
              context.commit('dataflow/setFilename', info.filename, { root: true });

              console.log(store.state.dataflow);

              resetDataflow(false);
              deserializeDiagram(context.rootState.dataflow, diagramData);
              showSystemMessage(store, `Diagram loaded: ${diagramData.diagramName}`, 'success');
              resolve(diagramData.diagramName);
            });
        });
    });
  },

  /**
   * Cancels the experiment.
   */
  cancel(context: ActionContext<ExperimentState, RootState>) {
    if (context.state.filename) {
      // When the filename is given, the experiment has already started and it cannot be aborted.
      return;
    }
    context.commit('router/replace', '/', { root: true });
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

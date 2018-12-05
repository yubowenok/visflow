import { Module, ActionContext } from 'vuex';
import store, { RootState } from '@/store';

import { axiosPost, errorMessage, showSystemMessage } from '@/common/util';
import { ExperimentState, ExperimentInfo, EXPERIMENT_USERNAME, EXPERIMENT_STEPS } from './types';
import { DiagramSave } from '../dataflow/types';
import { deserializeDiagram, resetDataflow } from '../dataflow/helper';
import { HistoryLogType } from '../history/types';

const initialState: ExperimentState = {
  filename: '',
  diagramName: '',
  step: 'consentForm',
  maxStep: 'consentForm',
};

const getters = {
  isInExperiment(state: ExperimentState) {
    return store.state.user.username === EXPERIMENT_USERNAME || state.filename !== '';
  },

  stepIndex(state: ExperimentState): number {
    return EXPERIMENT_STEPS.indexOf(state.step);
  },
};

const mutations = {
  setInfo(state: ExperimentState, info: ExperimentInfo) {
    state.diagramName = info.diagramName;
    state.filename = info.filename;

    store.commit('dataflow/setDiagramName', info.diagramName);
    store.commit('dataflow/setFilename', info.filename);
  },

  setStep(state: ExperimentState, step: string) {
    state.step = step;
  },

  setMaxStep(state: ExperimentState, step: string) {
    state.maxStep = step;
  },

  /**
   * Proceeds to the next step of the experiment.
   */
  next(state: ExperimentState) {
    if (state.step === 'finish') {
      // This study has already been completed. Redirect to an empty page.
      store.commit('router/reload', '/');
      return;
    }
    const stepIndex = getters.stepIndex(state);
    if (stepIndex === EXPERIMENT_STEPS.length - 1) {
      // The experiment has finished.
      store.commit('history/addLog', {
        type: HistoryLogType.EXPERIMENT_STEP,
        data: {
          step: 'finish',
          message: 'finish',
        },
      });
      store.dispatch('dataflow/autoSave')
        .then(() => {
          store.commit('router/reload', '/');
        });
      return;
    }
    const oldStep = state.step;
    let newStep = EXPERIMENT_STEPS[stepIndex + 1];

    if (newStep.match(/^clear/) && EXPERIMENT_STEPS.indexOf(state.maxStep) >= stepIndex + 2) {
      // already went through this clear step, skip
      newStep = EXPERIMENT_STEPS[stepIndex + 2];
    } else if (oldStep.match(/^clear/)) {
      // If the max step is a tutorial or the beginning of tasks, clear the diagram.
      store.dispatch('dataflow/newDiagram');
    }

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
    if (state.filename) {
      // This could be the start step, when the filename has not been set.
      store.dispatch('dataflow/autoSave');
    }
    mutations.setStep(state, newStep);
    mutations.setMaxStep(state, newStep);
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
    let newStep = EXPERIMENT_STEPS[stepIndex - 1];
    if (newStep.match(/^clear/)) {
      // a clear step must have been used, skip
      newStep = EXPERIMENT_STEPS[stepIndex - 2];
    }
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

          context.commit('dataflow/startAutoSave', undefined, { root: true });

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
              context.commit('setMaxStep', info.step);
              context.commit('setStep', info.step);

              context.commit('dataflow/setDiagramName', info.diagramName, { root: true });
              context.commit('dataflow/setFilename', info.filename, { root: true });

              resetDataflow(false);
              deserializeDiagram(diagramData);
              showSystemMessage(store, `Diagram loaded: ${diagramData.diagramName}`, 'success');

              if (info.step !== 'finish') {
                context.commit('dataflow/startAutoSave', undefined, { root: true });
              }

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
    context.dispatch('user/logout', undefined, { root: true });
    context.commit('router/replace', '/', { root: true });
  },

  /**
   * Answers an experiment question.
   */
  answer(context: ActionContext<ExperimentState, RootState>, payload: { question: string, answer: string }) {
    const filename = context.state.filename;
    if (!filename) {
      console.error('cannot answer question without filename');
      return;
    }
    axiosPost<void>('/experiment/answer', {
        filename,
        question: payload.question,
        answer: payload.answer,
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

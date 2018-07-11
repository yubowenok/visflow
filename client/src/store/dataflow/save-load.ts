import { ActionContext } from 'vuex';
import { DataflowState } from '@/store/dataflow';
import { RootState } from '@/store';
import { resetDataflow } from '@/store/dataflow/helper';
import { serializeDiagram, deserializeDiagram } from '@/store/dataflow/helper';
import store from '@/store';
import {
  axiosPost,
  showSystemMessage,
  systemMessageErrorHandler,
  clearSystemMessage,
  errorMessage,
} from '@/common/util';

import { DiagramSave, DiagramInfo } from '@/store/dataflow/types';


export const mutations = {
  setDiagramName(state: DataflowState, diagramName: string) {
    state.diagramName = diagramName;
  },

  setFilename(state: DataflowState, filename: string) {
    state.filename = filename;
  },
};

export const actions = {
  newDiagram(context: ActionContext<DataflowState, RootState>) {
    resetDataflow(context.state);
    store.commit('router/replace', '/');
  },

  saveDiagram(context: ActionContext<DataflowState, RootState>) {
    if (context.state.filename === '') {
      // The diagram not yet has a filename assigned.
      // This is the first time to save the diagram and it should use "saveAs" instead.
      store.commit('modals/openSaveAsDiagramModal');
      return;
    }
    if (!context.rootState.user.username) {
      showSystemMessage(store, 'you must login to save diagram', 'warn');
      return;
    }
    if (!context.state.filename) {
      console.error('saveDiagram() cannot be dispatched without an assigned filename');
      return;
    }

    axiosPost<string>('/diagram/save', {
      diagram: JSON.stringify(serializeDiagram(context.state)),
      filename: context.state.filename,
    }).then(() => {
        showSystemMessage(store, `Diagram saved: ${context.state.diagramName}`, 'success');
      })
      .catch(systemMessageErrorHandler(store));
  },

  saveAsDiagram(context: ActionContext<DataflowState, RootState>, diagramName: string): Promise<string> {
    if (!context.rootState.user.username) {
      console.error('saveAsDiagram() cannot be dispatched without login');
      return Promise.reject('login required');
    }
    context.commit('setDiagramName', diagramName);

    return new Promise((resolve, reject) => {
      axiosPost<string>('/diagram/save-as', {
        diagram: JSON.stringify(serializeDiagram(context.state)),
        diagramName,
      }).then(res => {
          const filename = res.data;
          context.commit('setFilename', filename);
          showSystemMessage(store, `Diagram saved: ${context.state.diagramName}`, 'success');

          store.commit('router/replace', `/diagram/${filename}`);

          resolve(filename);
        })
        .catch(err => reject(err));
    });
  },

  loadDiagram(context: ActionContext<DataflowState, RootState>, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      axiosPost<DiagramSave>('/diagram/load', { filename })
        .then(res => {
          deserializeDiagram(context.state, res.data);
          context.commit('setDiagramName', res.data.diagramName);
          context.commit('setFilename', filename);

          showSystemMessage(store, `Diagram loaded: ${res.data.diagramName}`, 'success');

          store.commit('router/replace', `/diagram/${filename}`);

          resolve(res.data.diagramName);
        })
        .catch(err => {
          if (err.response && err.response.data === 'no access') {
            showSystemMessage(store, 'login to view this diagram', 'error');
            store.dispatch('user/requestLogin', {
              loginCallback: () => context.dispatch('loadDiagram', filename),
            });
            resolve('');
            return;
          }
          reject(errorMessage(err));
        });
    });
  },

  listDiagram(context: ActionContext<DataflowState, RootState>): Promise<DiagramInfo[]> {
    return new Promise((resolve, reject) => {
      axiosPost<DiagramInfo[]>('/diagram/list')
        .then(res => resolve(res.data))
        .catch(err => reject(errorMessage(err)));
    });
  },

  deleteDiagram(context: ActionContext<DataflowState, RootState>, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      axiosPost<void>('/diagram/delete', { filename })
        .then(() => resolve())
        .catch(err => reject(errorMessage(err)));
    });
  },
};

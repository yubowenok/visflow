import { ActionContext } from 'vuex';
import { DataflowState } from './index';
import { RootState } from '../index';
import { resetDataflow } from './helper';
import { showSystemMessage } from '../message';
import { axiosPost, systemMessageErrorHandler } from '@/common/util';
import { serializeDiagram } from './helper';
import store from '../index';

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
  },

  saveDiagram(context: ActionContext<DataflowState, RootState>) {
    if (context.state.filename === '') {
      // The diagram not yet has a filename assigned.
      // This is the first time to save the diagram and it should use "saveAs" instead.
      store.commit('modals/openSaveAsDiagramModal');
      return;
    }
    if (!context.rootState.user.username) {
      showSystemMessage('you must login to save diagram', 'warn');
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
        showSystemMessage(`Diagram saved: ${context.state.diagramName}`, 'success');
      })
      .catch(systemMessageErrorHandler);
  },

  saveAsDiagram(context: ActionContext<DataflowState, RootState>, diagramName: string) {
    if (!context.rootState.user.username) {
      console.error('saveAsDiagram() cannot be dispatched without login');
      return;
    }
    context.commit('setDiagramName', diagramName);

    axiosPost<string>('/diagram/save-as', {
      diagram: JSON.stringify(serializeDiagram(context.state)),
      diagramName,
    }).then(res => {
        context.commit('setFilename', res.data);
        showSystemMessage(`Diagram saved: ${context.state.diagramName}`, 'success');
      })
      .catch(systemMessageErrorHandler);
  },

  loadDiagram(context: ActionContext<DataflowState, RootState>) {
    console.log('dataflow.loadDiagram()');
  },
};

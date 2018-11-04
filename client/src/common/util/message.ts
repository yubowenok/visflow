import { Store } from 'vuex';
import { RootStore } from '@/store/types';

interface ErrorResponse {
  message: string;
  response?: {
    data: string;
    status: number;
  };
}

type ApiError = ErrorResponse | string;

export const errorMessage = (err: ApiError): string => {
  if (typeof err === 'string') {
    return err;
  }
  if (err.response && err.response.status === 404) {
    return '404 not found';
  }
  return (err.response && err.response.data) || err.message;
};

export const showSystemMessage = (store: RootStore, text: string, type: string, duration?: number) => {
  store.commit('message/showMessage', {
    text,
    class: type,
    duration,
  });
};

export const clearSystemMessage = (store: RootStore) => {
  store.commit('message/closeMessage');
};

/** Displays an error message using the system message popup. */
export const systemMessageErrorHandler = (store: RootStore) => {
  return (err: any) => { // tslint:disable-line no-any
    if (!err.request) { // Local execution error, just throw. do not display in system message.
      throw err;
    }
    showSystemMessage(store, errorMessage(err), 'error');
  };
};

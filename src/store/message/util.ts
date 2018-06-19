import store from '../index';

export const showSystemMessage = (text: string, type: string, duration?: number) => {
  store.commit('message/showMessage', {
    text,
    class: type,
    duration,
  });
};

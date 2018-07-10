import store from '@/store';

export const showSystemMessage = (text: string, type: string, duration?: number) => {
  store.commit('message/showMessage', {
    text,
    class: type,
    duration,
  });
};

export const clearSystemMessage = () => {
  store.commit('message/closeMessage');
};

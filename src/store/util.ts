import { ENVIRONMENT } from '@/common/env';

interface Err {
  message: string;
  response?: {
    data: string;
  };
}

export const errorMessage = (err: Err): string => {
  return (err.response && err.response.data) || err.message;
};

export const delayedCall = (callback: () => void, duration: number) => {
  setTimeout(() => callback(), duration);
  return;
  if (ENVIRONMENT !== 'test') {
    setTimeout(() => callback(), duration);
  } else {
    // make the call immediately when in tests
    callback();
  }
};

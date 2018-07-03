// import { ENVIRONMENT } from '@/common/env';

interface Err {
  message: string;
  response?: {
    data: string;
  };
}

export const errorMessage = (err: Err): string => {
  return (err.response && err.response.data) || err.message;
};

export const fileSizeDisplay = (size: number): string => {
  const base = 1000;
  if (size < base) {
    return size + 'B';
  } else if (size < base * base) {
    return (size / base).toFixed(2) + 'KB';
  } else {
    return (size / base / base).toFixed(2) + 'MB';
  }
};

export const delayedCall = (callback: () => void, duration: number) => {
  // TODO: check this. just use delayed callback and see if tests are okay.
  setTimeout(() => callback(), duration);
  return;
  /*
  if (ENVIRONMENT !== 'test') {
    setTimeout(() => callback(), duration);
  } else {
    // make the call immediately when in tests
    callback();
  }
  */
};

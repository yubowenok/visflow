// import { ENVIRONMENT } from '@/common/env';
import { showSystemMessage } from '@/store/message';

interface ErrorResponse {
  message: string;
  response?: {
    data: string;
  };
}

type Error = ErrorResponse | string;

export const errorMessage = (err: Error): string => {
  if (typeof err === 'string') {
    return err;
  }
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

/** Displays an error message using the system message popup. */
export const systemMessageErrorHandler = (err: Error) => {
  showSystemMessage(errorMessage(err), 'error');
};

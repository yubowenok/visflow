import moment from 'moment';

export const DATE_FORMAT = 'M/D/YY HH:mm:ss';

export const isNumber = (value: string): boolean => {
  return !isNaN(+value);
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

export const dateDisplay = (value: string | number): string => {
  if (isNumber('' + value) &&
    ('' + value).match(/^\d{4}$/) === null) {
    // Note that we cannot create new Date() with UTC time string like
    // '1490285474832', which would throw "Invalid Date".
    // The exception is four-digit string year, which we should keep intact.
    value = +value;
  }
  return moment(new Date(value)).format(DATE_FORMAT);
};

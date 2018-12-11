import moment from 'moment';
import 'moment-timezone';
import { ValueType, isProbablyTimestamp } from '@/data/parser';
import { TIME_ZONE } from '@/common/env';

export const DATE_FORMAT = 'M/D/YY HH:mm:ss';
export const DATE_FORMAT_NO_HMS = 'M/D/YY';

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
  const valueStr = value.toString().trim();
  if (isNumber(valueStr) && valueStr.match(/^\d{4}$/) !== null) {
    // Note that we cannot create new Date() with UTC time string like
    // '1490285474832', which would throw "Invalid Date".
    // The exception is four-digit string year, which we should keep intact.
    return (+valueStr).toString();
  }
  const isTimestamp = isProbablyTimestamp(valueStr);
  // When the date is a timestamp (number), we always format the date to an env-configured TIME_ZONE.
  // If the date is string-like, e.g. 02/23/18, we consider the date to be of
  // local time, which is also assumed by Date and moment.
  const t = isTimestamp ? moment(+valueStr).tz(TIME_ZONE) : moment(new Date(value));
  if (t.isValid() && t.hours() + t.minutes() + t.seconds() + t.milliseconds() === 0) {
    return t.format(DATE_FORMAT_NO_HMS);
  }
  return t.format(DATE_FORMAT);
};


export const valueDisplay = (value: string | number, type: ValueType): string => {
  if (type === ValueType.FLOAT || type === ValueType.INT) {
    return (+value).toString();
  } else if (type === ValueType.DATE) {
    return dateDisplay(value);
  }
  return value.toString();
};

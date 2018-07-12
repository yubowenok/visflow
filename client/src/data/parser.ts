/**
 * @fileoverview Data parser that converts raw tabular data to visflow Data.
 */
import TabularDataset, { TabularRows, TabularColumn } from '@/data/tabular-dataset';
import { dsvFormat } from 'd3-dsv';
import _ from 'lodash';

/** Value types ordered from the strickest to weakest typing */
export enum ValueType {
  EMPTY = 'empty',
  DATE = 'date',
  INT = 'int',
  FLOAT = 'float',
  STRING = 'string',
  ERROR = 'error',
}

const isNumber = (text: string | number): boolean => {
  // Both sides can be NaN and NaN !== NaN.
  return Number(text) === +text;
};

const VALID_DATE_START = Date.parse('1000 GMT');
const VALID_DATE_END = Date.parse('2200 GMT');

export const isProbablyDate = (text: string | null | undefined): boolean => {
  if (text === null || text === undefined) {
    return false;
  }
  // Strangely, recently implementation change of Date.parse()
  // parses '10' into Mon Oct 01 2001 00:00:00 GMT-0400 (EDT) ???
  // We handle those special exceptions.
  // Make sure that text is not a number.
  if (isNumber(text)) {
    // Handle pure years like "2001", "1975".
    if (text.match(/^[0-9]{4,4}$/) && 1000 <= +text && +text <= 2200) {
      return true;
    }
    // Handle large millisecond timestamp.
    // Require length to be at least 9 to be conservative on smaller integers.
    if (VALID_DATE_START <= +text && +text <= VALID_DATE_END && text.length >= 9) {
      return true;
    }
    return false;
  }
  const date = new Date(text);
  return date.toString() !== 'Invalid Date' && date.getTime() >= VALID_DATE_START && date.getTime() <= VALID_DATE_END;
};

/** Parses a token and returns its value and type. */
const checkToken = (text: string | number, ignoredTypes_?: ValueType[]):
  { type: ValueType, value: number | string } => {
  const ignoredTypes = new Set<ValueType>(ignoredTypes_ ? ignoredTypes_ : []);
  text = text + ''; // Convert to string
  if (!ignoredTypes.has(ValueType.EMPTY) && text === '') {
    return {
      type: ValueType.EMPTY,
      value: '',
    };
  }
  if (!ignoredTypes.has(ValueType.DATE) && isProbablyDate(text)) {
    return {
      type: ValueType.DATE,
      value: new Date(text).getTime(),
    };
  }
  const res: RegExpMatchArray | null = text.match(/^-?[0-9]+/);
  if (!ignoredTypes.has(ValueType.INT) && res && res[0] === text) {
    return {
      type: ValueType.INT,
      value: parseInt(text, 10),
    };
  }
  if (!ignoredTypes.has(ValueType.FLOAT) && isNumber(text)) {
    return {
      type: ValueType.FLOAT,
      value: parseFloat(text),
    };
  }
  if (!ignoredTypes.has(ValueType.STRING)) {
    return {
      type: ValueType.STRING,
      value: text,
    };
  }
  return {
    type: ValueType.ERROR,
    value: '',
  };
};

/** Tokenizes the input value to form a value of chosen type. */
export const tokenize = (text: string, type?: ValueType): number | string => {
  type = !type ? checkToken(text).type : type;
  if (text === '') {
    switch (type) {
      case ValueType.INT:
      case ValueType.FLOAT:
      case ValueType.DATE:
        return 0;
      default:
        return '';
    }
  }
  switch (type) {
    case ValueType.INT:
      return parseInt(text, 10);
    case ValueType.FLOAT:
      return parseFloat(text);
    case ValueType.DATE:
      return new Date(text).getTime();
    case ValueType.STRING:
      return '' + text;
    default:
      return '';
  }
};

/** Parses a column and returns its type. */
const checkColumnType = (rows: TabularRows, columnIndex: number, name: string): TabularColumn => {
  let columnType = ValueType.EMPTY;
  rows.forEach(row => {
    const type = checkToken(row[columnIndex]).type;
    if (type > columnType) {
      columnType = type;
    }
  });
  let hasDuplicate = false;
  const existing: Set<number | string> = new Set();
  for (const row of rows) {
    const value = tokenize('' + row[columnIndex], columnType);
    row[columnIndex] = value;
    if (existing.has(value)) {
      hasDuplicate = true;
      break;
    } else {
      existing.add(value);
    }
  }
  return {
    name,
    type: columnType,
    hasDuplicate,
  };
};

/** Parses a CSV string and generates its TabularDataset. */
export const parseCsv = (csv: string): TabularDataset => {
  let headerLine;
  const firstNewLine = csv.indexOf('\n');
  if (firstNewLine === -1) {
    headerLine = csv;
  } else {
    headerLine = csv.substr(0, firstNewLine);
  }
  let delimiter = ',';
  const delimiterMatched = headerLine.match(/[,;|]/);
  if (delimiterMatched !== null) {
    delimiter = delimiterMatched[0];
  }

  let rows = dsvFormat(delimiter).parseRows(csv);
  const columnNames = rows.splice(0, 1)[0];
  if (_.last(columnNames) === '') {
    // In case there is a delimiter in the end.
    columnNames.pop();
    rows = rows.map(row => row.slice(0, columnNames.length));
  }
  for (const row of rows) {
    if (!(row instanceof Array) || row.length < columnNames.length) {
      console.error('data is not valid CSV');
      return new TabularDataset({
        columns: [],
        rows: [],
      });
    }
  }

  const columns: TabularColumn[] = columnNames.map((name: string, columnIndex: number) =>
    checkColumnType(rows, columnIndex, name));

  return new TabularDataset({
    columns,
    rows,
  });
};

import { ValueType } from '@/data/parser';

export type TabularRow = Array<number | string>;
export type TabularRows = TabularRow[];

export interface TabularColumn {
  name: string;
  type: ValueType;
  hasDuplicate: boolean;
}

export default class TabularDataset {
  public columns: TabularColumn[] = [];
  public rows: TabularRows = [];

  constructor({ columns, rows }: {
    columns: TabularColumn[],
    rows: TabularRows,
  }) {
    this.columns = columns;
    this.rows = rows;
  }
}

/*

  var typeHash = visflow.parser.dataTypeHash(data);
  var dataHash = visflow.parser.dataHash(data);
  return _.extend(data, {
    type: typeHash,
    hash: dataHash
  });
  */

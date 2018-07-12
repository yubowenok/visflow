import { ValueType } from '@/data/parser';
import _ from 'lodash';

export type TabularRow = Array<number | string>;
export type TabularRows = TabularRow[];

export interface TabularColumn {
  name: string;
  type: ValueType;
  hasDuplicate: boolean;
}

interface SubTableOptions {
  indexColumn?: boolean;
}

const arrayIndices = (indices: Set<number> | number[]): number[] => {
  return indices instanceof Set ? Array.from(indices) : indices;
};

export default class TabularDataset {
  private columns: TabularColumn[] = [];
  private rows: TabularRows = [];

  constructor({ columns, rows }: {
    columns: TabularColumn[],
    rows: TabularRows,
  }) {
    this.columns = columns;
    this.rows = rows;
  }

  public numRows(): number {
    return this.rows.length;
  }

  public getColumn(index: number): TabularColumn {
    return this.columns[index];
  }

  public isDateColumn(index: number): boolean {
    return this.columns[index].type === ValueType.DATE;
  }

  /**
   * Gets a subset of rows with values on a subset of columns.
   */
  public subRowsOnSubColumns(rowIndices: Set<number> | number[], columnIndices: Set<number> | number[],
                             options?: SubTableOptions): TabularRows {
    rowIndices = arrayIndices(rowIndices);
    columnIndices = arrayIndices(columnIndices);
    return rowIndices.map(rowIndex => this.rowOnSubColumns(rowIndex, columnIndices, options));
  }

  /**
   * Gets all the rows with values on a subset of columns.
   */
  public rowsOnSubColumns(columnIndices: Set<number> | number[], options?: SubTableOptions): TabularRows {
    columnIndices = arrayIndices(columnIndices);
    return this.rows.map((row, rowIndex) => this.rowOnSubColumns(rowIndex, columnIndices, options));
  }

  /**
   * Gets one row with values on a subset of columns.
   */
  public rowOnSubColumns(rowIndex: number, columnIndices: Set<number> | number[],
                         options_?: SubTableOptions): TabularRow {
    const options: SubTableOptions = options_ || {};
    columnIndices = arrayIndices(columnIndices);
    return _.concat(
      options.indexColumn ? [rowIndex] : [],
      _.pullAt(this.rows[rowIndex], columnIndices),
    );
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

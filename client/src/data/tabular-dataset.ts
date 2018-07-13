import { ValueType } from '@/data/parser';
import sha256 from 'crypto-js/sha256';

export type TabularRow = Array<number | string>;
export type TabularRows = TabularRow[];

export interface TabularColumn {
  name: string;
  type: ValueType;
  hasDuplicate: boolean;
}

export interface ColumnSelectOption {
  value: number; // column index in the original table
  label: string;
}

interface SubTableOptions {
  indexColumn?: boolean;
}

const arrayIndices = (indices: Set<number> | number[]): number[] => {
  return indices instanceof Set ? Array.from(indices) : indices;
};

/** Creates a hash value based on the dataset content. */
const hash = (columns: TabularColumn[], rows: TabularRows): string => {
  const columnStr = columns.map(column => column.name).join(',');
  const rowStr = rows.map(row => row.map(e => e.toString()).join(',')).join(',');
  return sha256(columnStr + ',' + rowStr).toString();
};

export default class TabularDataset {
  private columns: TabularColumn[] = [];
  private rows: TabularRows = [];
  private hash: string = '';

  constructor({ columns, rows }: {
    columns: TabularColumn[],
    rows: TabularRows,
  }) {
    this.columns = columns;
    this.rows = rows;
    this.hash = hash(columns, rows);
  }

  public numRows(): number {
    return this.rows.length;
  }

  public numColumns(): number {
    return this.columns.length;
  }

  public getColumn(index: number): TabularColumn {
    return this.columns[index];
  }

  public getColumns(): TabularColumn[] {
    return this.columns;
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
    const row: TabularRow = options.indexColumn ? [rowIndex] : [];
    columnIndices.forEach(columnIndex => row.push(this.rows[rowIndex][columnIndex]));
    return row;
  }

  public getHash(): string {
    return this.hash;
  }
}

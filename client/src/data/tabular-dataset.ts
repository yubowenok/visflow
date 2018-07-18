import sha256 from 'crypto-js/sha256';
import _ from 'lodash';
import { ValueType } from '@/data/parser';
import { SubsetItem } from '@/data/package/subset-package';
import { isContinuousDomain } from '@/data/util';

export type TabularRow = Array<number | string>;
export type TabularRows = TabularRow[];

export interface TabularColumn {
  index: number;
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

  /**
   * Retrieves the value of a cell, with a given row and column.
   */
  public getCell(item: number | SubsetItem, columnIndex: number): number | string {
    const rowIndex = item instanceof Object ? (item as SubsetItem).index : item;
    return this.rows[rowIndex][columnIndex];
  }

  public getColumn(index: number): TabularColumn {
    return this.columns[index];
  }

  public getColumns(): TabularColumn[] {
    return this.columns;
  }

  public getColumnType(columnIndex: number): ValueType {
    return this.columns[columnIndex].type;
  }

  public getColumnName(columnIndex: number): string {
    return this.columns[columnIndex].name;
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
  public allRowsOnSubColumns(columnIndices: Set<number> | number[], options?: SubTableOptions): TabularRows {
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

  /**
   * Computes the value domain on a given column for a given set of items. If items are not given, then all items
   * are considered.
   */
  public getDomain(columnIndex: number, items?: number[]): Array<number | string> {
    items = items || _.range(this.numRows());
    if (isContinuousDomain(this.columns[columnIndex].type)) {
      const values = items.map(itemIndex => this.rows[itemIndex][columnIndex]);
      const max = _.max(values) as number;
      const min = _.min(values) as number;
      return [min, max];
    } else { // discrete domain
      // Find unique values in a discrete domain.
      return _.uniq(items.map(index => this.rows[index][columnIndex]));
    }
  }

  public getHash(): string {
    return this.hash;
  }
}

import _ from 'lodash';
import sha256 from 'crypto-js/sha256';

import { INDEX_COLUMN } from '@/common/constants';
import { SubsetItem } from '@/data/package/subset-package';
import { ValueType } from '@/data/parser';
import { isContinuousDomain, valueComparator } from '@/data/util';

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
  forScale?: boolean;
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
   * Retrieves the raw value of a cell, with a given row and column.
   */
  public getCell(item: number | SubsetItem, columnIndex: number): number | string {
    const rowIndex = item instanceof Object ? (item as SubsetItem).index : item;
    if (columnIndex === INDEX_COLUMN) {
      return rowIndex;
    }
    return this.rows[rowIndex][columnIndex];
  }

  /**
   * Retrieves a normalized value of a cell that works with ScaleTime.
   */
  public getCellForScale(item: number | SubsetItem, columnIndex: number): number | string {
    const rowIndex = item instanceof Object ? (item as SubsetItem).index : item;
    const value = this.rows[rowIndex][columnIndex];
    if (columnIndex === INDEX_COLUMN) {
      return rowIndex;
    }
    return this.columns[columnIndex].type === ValueType.DATE ? new Date(value).getTime() : value;
  }

  public getColumn(index: number): TabularColumn {
    return this.columns[index];
  }

  public getColumns(): TabularColumn[] {
    return this.columns;
  }

  public getColumnType(columnIndex: number): ValueType {
    if (columnIndex === INDEX_COLUMN) {
      return ValueType.INT;
    }
    return this.columns[columnIndex].type;
  }

  public getColumnName(columnIndex: number): string {
    if (columnIndex === INDEX_COLUMN) {
      return '[index]';
    }
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
    columnIndices.forEach(columnIndex => {
      const value = this.rows[rowIndex][columnIndex];
      if (options.forScale && this.columns[columnIndex].type === ValueType.DATE) {
        row.push(new Date(value).getTime());
      } else {
        row.push(value);
      }
    });
    return row;
  }

  /**
   * Computes the value domain on a given column for a given set of items. If items are not given, then all items
   * are considered.
   */
  public getDomain(columnIndex: number, items?: number[]): Array<number | string> {
    items = items || _.range(this.numRows());
    if (!items.length) {
      return [];
    }
    const columnType = this.columns[columnIndex].type;
    const comparator = valueComparator(columnType);
    if (isContinuousDomain(columnType)) {
      let min: string | number | undefined;
      let max: string | number | undefined;
      items.forEach(itemIndex => {
        const value = this.rows[itemIndex][columnIndex];
        if (min === undefined || comparator(value, min) < 0) {
          min = value;
        }
        if (max === undefined || comparator(value, max) > 0) {
          max = value;
        }
      });
      if (min === undefined || max === undefined) { // for typing purpose
        return [];
      }
      return [min, max];
    } else { // discrete domain
      // Find unique values in a discrete domain.
      return _.uniq(items.map(index => this.rows[index][columnIndex]));
    }
  }

  /**
   * Computes the sorted values that appear on a column, w.r.t. to an optional list of items.
   * If "distinct" is set, return only unique values.
   */
  public getDomainValues(columnIndex: number, items?: number[], distinct?: boolean): Array<number | string> {
    items = items || _.range(this.numRows());
    if (columnIndex === INDEX_COLUMN) {
      return items;
    }
    const values = items.map(index => this.rows[index][columnIndex])
      .sort(valueComparator(this.getColumnType(columnIndex)));
    return distinct ? _.uniq(values) : values;
  }

  public getHash(): string {
    return this.hash;
  }
}

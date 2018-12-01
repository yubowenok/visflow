import _ from 'lodash';
import sha256 from 'crypto-js/sha256';

import { INDEX_COLUMN } from '@/common/constants';
import { SubsetItem } from '@/data/package/subset-package';
import { ValueType, generateCsv, parseCsv } from '@/data/parser';
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
  public static deserialize(jsonStr: string): TabularDataset {
    const obj = JSON.parse(jsonStr);
    const dataset = new TabularDataset({
      columns: obj.columns,
      rows: obj.rows,
    });
    dataset.setName(obj.name);
    return dataset;
  }

  public static fromColumnsAndRows(columns: string[], rows: TabularRows): TabularDataset {
    // TODO: This awkwardly converts columns and rows to CSV and then parses the raw CSV.
    // Move the parser to the tabular dataset constructor instead.
    return parseCsv(generateCsv(columns, rows));
  }

  private name: string = ''; // dataset name (originalname)
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

  public getName(): string {
    return this.name;
  }

  public getColumnIndex(columnName: string): number | null {
    const column = this.columns.find(col => col.name === columnName);
    return column ? column.index : null;
  }

  public setName(name: string) {
    this.name = name;
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

  public getRows(): TabularRows {
    return this.rows;
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

  /**
   * Checks if a given column has duplicate values on the given items. If no items are given, return if a given column
   * has duplicates from the original dataset.
   * Values are compared by their string values.
   */
  public hasDuplicates(columnIndex: number, items?: number[]): boolean {
    if (columnIndex === INDEX_COLUMN) {
      return false;
    }
    items = items || _.range(this.numRows());
    const valueSet = new Set<string>();
    for (const itemIndex of items) {
      const value = this.rows[itemIndex][columnIndex].toString();
      if (valueSet.has(value)) {
        return true;
      }
    }
    return false;
  }

  public getHash(): string {
    return this.hash;
  }

  public serialize(): string {
    return JSON.stringify(this);
  }
}

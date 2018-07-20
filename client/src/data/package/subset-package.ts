import _ from 'lodash';
import Package from '@/data/package/package';
import TabularDataset from '@/data/tabular-dataset';
import { INDEX_COLUMN } from '@/common/constants';

interface Items {
  [index: number]: SubsetItem;
}

export interface VisualProperties {
  opacity?: number;
  color?: string;
  size?: number;
  border?: string;
  width?: number;
}

export interface SubsetItem {
  index: number;
  visuals: VisualProperties;
}

export default class SubsetPackage extends Package {
  private dataset: TabularDataset | undefined = undefined;
  // Mapping from item indices to SubsetItem.
  private items: Items = {};

  constructor(dataset?: TabularDataset) {
    super();
    this.dataset = dataset;
    this.init();
  }

  public hasDataset(): boolean {
    return this.dataset !== undefined;
  }

  public getDataset(): TabularDataset | undefined {
    return this.dataset;
  }

  public getItems(): SubsetItem[] {
    return _.toArray(this.items);
  }

  public getItemIndices(): number[] {
    return _.keys(this.items).map(index => +index);
  }

  public hasItem(index: number): boolean {
    return index in this.items;
  }

  public addItem(item: SubsetItem) {
    if (!(item.index in this.items)) {
      this.items[item.index] = item;
    } else {
      const oldVisuals = this.items[item.index].visuals;
      this.items[item.index] = {
        index: item.index,
        visuals: _.extend({}, oldVisuals, item.visuals),
      };
    }
  }

  public addItemIndex(index: number) {
    if (!(index in this.items)) {
      this.items[index] = { index, visuals: {} };
    }
  }

  public addItemIndices(indices: number[]) {
    for (const index of indices) {
      this.addItemIndex(index);
    }
  }

  public filterItems(condition: (item: SubsetItem) => boolean) {
    const indices = this.getItemIndices();
    for (const index of indices) {
      const item = this.items[index];
      if (!condition(item)) {
        this.removeItem(item);
      }
    }
  }

  public getItem(index: number): SubsetItem {
    return this.items[index];
  }

  public removeItem(item: SubsetItem) {
    if (item.index in this.items) {
      delete this.items[item.index];
    }
  }

  public removeItemIndex(index: number) {
    if (index in this.items) {
      delete this.items[index];
    }
  }

  /**
   * Clears the items in the subset. Note that this does not clear the dataset.
   */
  public clearItems() {
    this.items = {};
  }

  /**
   * Clears the dataset and items.
   */
  public clearDataset() {
    this.dataset = undefined;
  }

  public numItems(): number {
    return _.size(this.items);
  }

  /**
   * Returns a deep copy of the package.
   */
  public clone(): SubsetPackage {
    const pkg = new SubsetPackage();
    pkg.subsetFrom(this);
    return pkg;
  }

  /**
   * Returns a deep copy of the package with only items defined in "items".
   */
  public subset(items: number[]): SubsetPackage {
    const pkg = new SubsetPackage();
    pkg.subsetFrom(this, items);
    return pkg;
  }


  /**
   * Produces a 2D array in which each subarray is a group of items.
   * Items with the same value on "column" are placed in a group.
   */
  public groupItems(columnIndex: number | null): number[][] {
    if (columnIndex === null) {
      return [this.getItemIndices()]; // No groupBy column gives everything in a single group.
    }
    const groups: number[][] = [];
    const valueSet: { [value: string]: number } = {};
    let groupCounter = 0;
    _.each(this.items, (item: SubsetItem, itemIndexStr: string) => {
      const itemIndex = +itemIndexStr;
      const value = columnIndex === INDEX_COLUMN ? itemIndex :
        (this.dataset as TabularDataset).getCell(itemIndex, columnIndex);
      if (value in valueSet) {
        const group = valueSet[value];
        groups[group].push(itemIndex);
      } else {
        valueSet[value] = groupCounter;
        groups[groupCounter++] = [itemIndex];
      }
    });
    return groups;
  }

  /**
   * Copies the items and dataset from another subset package. Uses deep copy.
   * @param items If items are given, then the cloned package contains only the given items if they exist
   * in the package.
   */
  private subsetFrom(pkg: SubsetPackage, items?: number[]) {
    this.dataset = pkg.dataset;
    if (!items) {
      this.items = _.cloneDeep(pkg.items);
    } else {
      const newItems: Items = {};
      for (const index of items) {
        if (index in pkg.items) {
          newItems[index] = _.cloneDeep(pkg.items[index]);
        }
      }
      this.items = newItems;
    }
  }

  private init() {
    if (!this.dataset) {
      return;
    }
    for (let index = 0; index < this.dataset.numRows(); index++) {
      this.items[index] = {
        index,
        visuals: {},
      };
    }
  }
}

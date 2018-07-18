import _ from 'lodash';
import Package from '@/data/package/package';
import TabularDataset from '@/data/tabular-dataset';

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

  public getItem(index: number): SubsetItem {
    return this.items[index];
  }

  public removeItem(item: SubsetItem) {
    if (item.index in this.items) {
      delete this.items[item.index];
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

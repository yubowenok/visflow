import _ from 'lodash';
import Package from '@/data/package/package';
import TabularDataset from '@/data/tabular-dataset';

export interface VisualProperties {
  opacity?: number;
  color?: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface SubsetItem {
  index: number;
  visuals: VisualProperties;
}

export default class SubsetPackage extends Package {
  private dataset: TabularDataset | undefined = undefined;
  // Mapping from item indices to SubsetItem.
  private items: { [index: number]: SubsetItem } = {};

  constructor(dataset?: TabularDataset) {
    super();
    this.dataset = dataset;
  }

  public getDataset(): TabularDataset | undefined {
    return this.dataset;
  }

  public getItems(): SubsetItem[] {
    return _.toArray(this.items);
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

  public numItems(): number {
    return _.size(this.items);
  }

  /**
   * Copies the items and dataset from another subset package.
   * Uses shallow copy.
   */
  public copyFrom(pkg: SubsetPackage) {
    this.dataset = pkg.dataset;
    this.items = _.extend({}, pkg.items);
  }
}

import _ from 'lodash';
import Package from './package';
import TabularDataset from '../tabular-dataset';

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
  private dataset: TabularDataset | undefined;
  // Mapping from item indices to SubsetItem.
  private items: { [index: number]: SubsetItem } = {};

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

  public removeItem(item: SubsetItem) {
    if (item.index in this.items) {
      delete this.items[item.index];
    }
  }

  public numItems(): number {
    return _.size(this.items);
  }
}

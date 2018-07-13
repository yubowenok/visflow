import _ from 'lodash';
import SubsetPackage from '@/data/package/subset-package';

export default class SubsetSelection {
  // Indices of items selected.
  private items: Set<number> = new Set();

  constructor(items?: number[]) {
    if (items) {
      this.items = new Set(items);
    }
  }

  public serialize(): number[] {
    return Array.from(this.items);
  }

  public setItems(items: number[]) {
    this.items = new Set(items);
  }

  public addItems(items: number[]) {
    items.forEach(index => this.items.add(index));
  }

  public removeItems(items: number[]) {
    items.forEach(index => this.items.delete(index));
  }

  public getItems(): number[] {
    return Array.from(this.items);
  }

  public hasItem(index: number): boolean {
    return this.items.has(index);
  }

  public clear() {
    this.items = new Set();
  }

  public toSubsetPackage(parentPkg: SubsetPackage): SubsetPackage {
    const pkg = new SubsetPackage(parentPkg.getDataset());
    this.items.forEach(index => {
      // Use _.merge() to recursively copy the visual properties.
      pkg.addItem(_.merge({}, parentPkg.getItem(index)));
    });
    return pkg;
  }
}

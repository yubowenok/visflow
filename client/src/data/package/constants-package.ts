import Package from '@/data/package/package';
import _ from 'lodash';
import { ValueType } from '@/data/parser';
import { valueComparator } from '@/data/util';

export default class ConstantsPackage extends Package {
  private values: Array<number | string> = [];

  constructor(values?: Array<number | string>) {
    super();
    this.values = values || [];
  }

  public setConstants(values: Array<number | string>) {
    this.values = values.concat();
  }

  public addConstant(value: number | string) {
    this.values.push(value);
  }

  public addConstants(values: Array<number | string>) {
    this.values = this.values.concat(values);
  }

  public getConstants(): Array<number | string> {
    return this.values;
  }

  public clear() {
    this.values = [];
  }

  public numConstants(): number {
    return this.values.length;
  }

  public unique() {
    this.values = _.uniq(this.values.map(val => val.toString()));
  }

  public sort(type?: ValueType) {
    this.values = !type ? this.values.concat().sort() : this.values.concat().sort(valueComparator(type));
  }

  public toDisplayString(): string {
    // TODO
    return 'constants';
  }
}

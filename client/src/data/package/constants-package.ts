import Package from '@/data/package/package';

export default class ConstantsPackage extends Package {
  private values: Array<number | string> = [];

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


  public toDisplayString(): string {
    // TODO
    return 'constants';
  }
}

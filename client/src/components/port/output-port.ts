import { Component } from 'vue-property-decorator';
import Node from '@/components/node/node';
import Port from '@/components/port/port';
import InputPort from '@/components/port/input-port';
import { Package } from '@/data/package';

@Component
export default class OutputPort extends Port {
  protected isMultiple = true;
  protected isUpdated = false;

  public getConnectedNodes(): Node[] {
    return this.edges.map(edge => edge.target.node);
  }

  public getConnectedPorts(): InputPort[] {
    return this.edges.map(edge => edge.target);
  }

  /** Updates the package of the port. This turns on isUpdated flag. */
  public updatePackage(pkg: Package) {
    this.package = pkg;
    this.isUpdated = true;
  }

  public isPackageUpdated(): boolean {
    return this.isUpdated;
  }

  public clearPackageUpdate() {
    this.isUpdated = false;
  }

  public getPackage(): Package {
    return this.package;
  }

  /**
   * Clears the port's package and its associated data.
   * @abstract
   */
  public clear() {
    throw new Error('using clear() of base class OutputPort');
  }
}

import { Component } from 'vue-property-decorator';
import Node from '../node/node';
import Port from './port';
import InputPort from './input-port';
import { Package } from '@/data/package';

@Component
export default class OutputPort extends Port {
  private isUpdated = false;

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

  public hasPackage(): boolean {
    return this.package !== null;
  }

  public getPackage(): Package | null {
    return this.package;
  }
}

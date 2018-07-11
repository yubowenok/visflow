import { Component } from 'vue-property-decorator';
import Node from '@/components/node/node';
import Port from '@/components/port/port';
import OutputPort from '@/components/port/output-port';
import { Package } from '@/data/package';

@Component
export default class InputPort extends Port {
  public isInput = true;

  public getConnectedNodes(): Node[] {
    return this.edges.map(edge => edge.source.node);
  }

  public getConnectedPorts(): OutputPort[] {
    return this.edges.map(edge => edge.source);
  }

  /**
   * If any of the output port connected to this input port has updated,
   * then this input port is considered updated.
   */
  public isPackageUpdated(): boolean {
    for (const edge of this.edges) {
      if (edge.source.isPackageUpdated()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Input port's hasPackage() depends on its connected output ports.
   */
  public hasPackage(): boolean {
    for (const edge of this.edges) {
      if (edge.source.hasPackage()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieves the package from the connected output port.
   */
  public getPackage(): Package {
    const pkgList = this.edges.map(edge => {
      return edge.source.hasPackage() ? edge.source.getPackage() : null;
    }).filter(pkg => pkg !== null) as Package[];
    // TODO: How to handle multiple packages for multiple connections of an input port?
    return pkgList[0];
  }
}

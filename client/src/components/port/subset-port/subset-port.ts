import { Vue, Component } from 'vue-property-decorator';
import { SubsetPackage } from '@/data/package';
import TabularDataset from '@/data/tabular-dataset';
import Port from '../port';

@Component
export default class SubsetPort extends Vue {
  protected DATA_TYPE = 'subset';
  protected package: SubsetPackage = new SubsetPackage();

  public isTypeMatched(port: Port): boolean {
    if (port.dataType() !== this.DATA_TYPE) {
      // Ensures port is a subset port.
      return false;
    }
    if (!port.hasPackage()) {
      return true;
    }
    const pkg = port.getPackage() as SubsetPackage;
    // Two subset ports can connect if their datasets are the same.
    if (pkg.hasDataset() && this.package.hasDataset() &&
      (pkg.getDataset() as TabularDataset).getHash() !== (this.package.getDataset() as TabularDataset).getHash()) {
      return false;
    }
    return true;
  }
}

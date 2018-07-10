import { Component, Prop, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import Node, { injectNodeTemplate } from '@/components/node/node';
import template from './data-source.html';
import Port from '@/components/port/port';
import OutputPort from '@/components/port/output-port';
import DatasetModal from '@/components/modals/dataset-modal/dataset-modal';
import { DatasetInfo } from '@/components/dataset-list/dataset-list';
import { systemMessageErrorHandler } from '@/common/util';
import { GetDatasetOptions } from '@/store/dataset';
import { parseCsv } from '@/data/parser';
import { SubsetPackage } from '@/data/package';

@Component({
  template: injectNodeTemplate(template),
  components: {
    DatasetModal,
  },
})
export default class DataSource extends Node {
  public isPropagationSource = true;

  protected NODE_TYPE = 'data-source';
  protected containerClasses = ['node', 'data-source'];
  protected DEFAULT_WIDTH = 120;
  protected DEFAULT_HEIGHT = 30;

  @ns.user.State('username') private username!: string;
  @ns.dataset.Action('getDataset') private getDataset!: (options: GetDatasetOptions) => Promise<string>;
  @ns.dataflow.Mutation('portUpdated') private portUpdated!: (port: Port) => void;

  private datasetInfo: DatasetInfo | null = null;
  private datasetName = '';
  private datasetLoaded = false;

  /** Data source does not update unless triggered by UI. */
  public update() {
    // Nothing to do
  }

  protected createPorts() {
    this.outputPorts = [
      new OutputPort({
        data: {
          id: 'out',
          node: this,
          isMultiple: true,
        },
        store: this.$store,
      }),
    ];
  }

  private onSelectDataset(info: DatasetInfo) {
    this.datasetInfo = info;
    this.datasetName = info.originalname;

    this.getDataset({
      username: this.username,
      filename: this.datasetInfo.filename,
    }).then((csv: string) => {
      const outputPort = this.outputPortMap.out;
      const dataset = parseCsv(csv);
      outputPort.updatePackage(new SubsetPackage(dataset));
      this.portUpdated(outputPort);
    }).catch(systemMessageErrorHandler);
  }
}

import { Component, Prop, Watch } from 'vue-property-decorator';

import ns from '@/common/namespaces';
import Node, { injectNodeTemplate } from '../node/node';
import template from './data-source.html';
import Port from '@/components/port/port';
import OutputPort from '@/components/port/output-port';
import DatasetPanel from '../dataset-panel/dataset-panel';
import { DatasetInfo } from '@/components/dataset-list/dataset-list';
import { systemMessageErrorHandler } from '@/common/util';
import { FetchDatasetOptions } from '@/store/dataset';
import { parseCsv } from '@/data/parser';

@Component({
  template: injectNodeTemplate(template),
  components: {
    DatasetPanel,
  },
})
export default class DataSource extends Node {
  protected NODE_TYPE = 'data-source';
  protected containerClasses = ['node', 'data-source'];
  protected DEFAULT_WIDTH = 120;
  protected DEFAULT_HEIGHT = 30;

  @ns.user.State('username') private username!: string;
  @ns.dataset.Action('fetchDataset') private fetchDataset!: (options: FetchDatasetOptions) => Promise<string>;
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

    this.fetchDataset({
      username: this.username,
      filename: this.datasetInfo.filename,
    }).then((csv: string) => {
      const outputPort = this.outputPortMap.out;
      outputPort.updatePackage(parseCsv(csv));
      this.portUpdated(outputPort);
    }).catch(systemMessageErrorHandler);
  }
}

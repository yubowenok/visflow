import { Component, Prop, Watch } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import Node, { injectNodeTemplate } from '../node/node';
import MultiplePort from '../port/multiple-port';
import template from './data-source.html';
import Port from '@/components/port/port';
import DatasetPanel from '../dataset-panel/dataset-panel';
import { DatasetInfo } from '@/components/dataset-list/dataset-list';
import { systemMessageErrorHandler } from '@/common/util';
import { FetchDatasetOptions } from '@/store/dataset';
import ns from '@/common/namespaces';

@Component({
  template: injectNodeTemplate(template),
  components: {
    DatasetPanel,
  },
})
export default class DataSource extends mixins(Node) {
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

  protected createPorts() {
    this.outputPorts = [
      new MultiplePort({
        data: {
          id: 'out',
          node: this,
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
    }).then(csvStr => {
      // TODO: parse csv string and generate data object
      console.log(csvStr);
      this.portUpdated(this.portMap.out);
    }).catch(systemMessageErrorHandler);
  }
}

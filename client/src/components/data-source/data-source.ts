import { Component } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { Node, injectNodeTemplate } from '@/components/node';
import template from './data-source.html';
import DatasetModal from '@/components/modals/dataset-modal/dataset-modal';
import { DatasetInfo } from '@/store/dataset/types';
import { systemMessageErrorHandler } from '@/common/util';
import { GetDatasetOptions } from '@/store/dataset';
import { parseCsv } from '@/data/parser';
import { SubsetPackage } from '@/data/package';
import { SubsetOutputPort } from '@/components/port';
import * as history from './history';
import TabularDataset from '@/data/tabular-dataset';

export interface DataSourceSave {
  datasetInfo: DatasetInfo | null;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    DatasetModal,
  },
})
export default class DataSource extends Node {
  public isPropagationSource = true;

  protected NODE_TYPE = 'data-source';
  protected DEFAULT_WIDTH = 120;
  protected DEFAULT_HEIGHT = 30;

  @ns.user.State('username') private username!: string;
  @ns.dataset.Action('getDataset') private dispatchGetDataset!: (options: GetDatasetOptions) => Promise<string>;

  private datasetInfo: DatasetInfo | null = null;
  private dataset: TabularDataset | null = null;

  public getDataset(): TabularDataset | null {
    return this.dataset;
  }

  public setDatasetInfo(datasetInfo: DatasetInfo) {
    this.datasetInfo = datasetInfo;
    if (this.datasetInfo) {
      this.fetchDataset();
    } else {
      this.outputPortMap.out.updatePackage(new SubsetPackage());
      this.portUpdated(this.outputPortMap.out);
    }
  }

  /** Data source does not update unless triggered by UI. */
  public update() {
    // Nothing to do
  }

  protected created() {
    this.serializationChain.push(() => ({
      datasetInfo: this.datasetInfo,
    }));
    this.deserializationChain.push(() => {
      if (this.datasetInfo) {
        this.fetchDataset();
      }
    });
  }

  protected createOutputPorts() {
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'out',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  private fetchDataset() {
    if (!this.datasetInfo) {
      console.error('fetchDataset() called when data source has no dataset set');
      return;
    }
    const datasetName = this.datasetInfo.originalname;
    this.dispatchGetDataset({
      username: this.username,
      filename: this.datasetInfo.filename,
    }).then((csv: string) => {
      const outputPort = this.outputPortMap.out;

      const dataset = parseCsv(csv);
      dataset.setName(datasetName);

      this.dataset = dataset;
      outputPort.updatePackage(new SubsetPackage(dataset));
      this.portUpdated(outputPort);
    }).catch(systemMessageErrorHandler(this.$store));
  }

  private onSelectDataset(info: DatasetInfo) {
    this.commitHistory(history.setDatasetInfoEvent(this, info, this.datasetInfo));
    this.setDatasetInfo(info);
  }

  private openDatasetModal() {
    this.activate(); // Make sure that the option panel is mounted before using datasetModal.
    this.$nextTick(() => (this.$refs.datasetModal as DatasetModal).open());
  }
}


import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import ns from '@/store/namespaces';
import template from './aggregation.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import TabularDataset from '@/data/tabular-dataset';

interface AggregationSave {
  serializedDataset: string;
}

@Component({
  template: injectNodeTemplate(template),
  components: {

  },
})
export default class Aggregation extends SubsetNode {
  protected NODE_TYPE = 'aggregation';

  private outputDataset: TabularDataset | null = null;

  protected update() {
  }

  protected created() {
    this.serializationChain.push((): AggregationSave => ({
      serializedDataset: this.outputDataset === null ? 'null' : this.outputDataset.serialize(),
    }));
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as AggregationSave;
      this.outputDataset = TabularDataset.deserialize(save.serializedDataset);
    });
  }

}

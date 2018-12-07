
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './aggregation.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import FormSelect from '@/components/form-select/form-select';
import ColumnList from '@/components/column-list/column-list';
import { SubsetInputPort } from '../port';
import TabularDataset from '@/data/tabular-dataset';
import { ValueType } from '@/data/parser';
import { valueComparator } from '@/data/util';
import { SubsetPackage } from '@/data/package';
import * as history from './history';

export enum ClusteringAlgorithm {
  K_MEANS = 'k-Means',
}

interface ClusteringSave {
  algorithm: ClusteringAlgorithm;
  columns: number[];
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormSelect,
    ColumnList,
  },
})
export default class Clustering extends SubsetNode {
  public isDataMutated = true;

  protected NODE_TYPE = 'clustering';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;

  private algorithm: ClusteringAlgorithm = ClusteringAlgorithm.K_MEANS;
  private columns: number[] = [];

  private warningMessage = '';

  get clusteringAlgorithmOptions(): SelectOption[] {
    return [
      { label: 'k-Means', value: ClusteringAlgorithm.K_MEANS },
    ];
  }

  public setAlgorithm(algorithm: ClusteringAlgorithm) {
    this.algorithm = algorithm;
    this.updateAndPropagate();
  }

  public setColumns(columns: number[]) {
    this.columns = columns;
    this.updateAndPropagate();
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    if (!this.columns.length) {
      this.coverText = 'No columns';
      this.forwardSubset(this.inputPortMap.in as SubsetInputPort, this.outputPortMap.out);
      return;
    }
    this.clustering();
  }

  protected onDatasetChange() {
    this.columns = this.updateColumnsOnDatasetChange(this.columns);
  }

  protected created() {
    this.serializationChain.push((): ClusteringSave => ({
      algorithm: this.algorithm,
      columns: this.columns,
    }));
  }

  private clustering() {
  }

  private onSelectClusteringAlgorithm(algorithm: ClusteringAlgorithm, prevAlgorithm: ClusteringAlgorithm) {
    this.commitHistory(history.selectAlgorithmEvent(this, algorithm, prevAlgorithm));
    this.setAlgorithm(algorithm);
  }

  private onSelectColumns(columns: number[], prevColumns: number[]) {
    this.commitHistory(history.selectColumnsEvent(this, columns, prevColumns));
    this.setColumns(columns);
  }
}

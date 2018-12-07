
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './clustering.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import FormSelect from '@/components/form-select/form-select';
import ColumnList from '@/components/column-list/column-list';
import FormInput from '@/components/form-input/form-input';
import { SubsetInputPort } from '../port';
import TabularDataset from '@/data/tabular-dataset';
import { ValueType } from '@/data/parser';
import { valueComparator } from '@/data/util';
import { SubsetPackage } from '@/data/package';
import * as history from './history';

const ITERATION_INTERVAL_MS = 1000;

export enum ClusteringAlgorithm {
  K_MEANS = 'k-means',
}

interface KMeansOptions {
  k: number;
  outputEachIteration: boolean;
  iterationInterval: number;
}

interface ClusteringSave {
  algorithm: ClusteringAlgorithm;
  columns: number[];
  kMeansOptions: KMeansOptions;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormInput,
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

  private kMeansRunning = false;

  private kMeansOptions: KMeansOptions = {
    k: 3,
    outputEachIteration: false,
    iterationInterval: ITERATION_INTERVAL_MS,
  };
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

  public setKMeansK(k: number) {
    this.kMeansOptions.k = k;
    this.updateAndPropagate();
  }

  public setKMeansIterationInterval(interval: number) {
    this.kMeansOptions.iterationInterval = interval;
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
      kMeansOptions: this.kMeansOptions,
    }));
  }

  private clustering() {
    if (this.algorithm === ClusteringAlgorithm.K_MEANS) {
      this.kMeansClustering();
    }
  }

  private kMeansClustering() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = pkg.getDataset() as TabularDataset;
    const d = this.columns.length;
    const k = this.kMeansOptions.k;
    const itemIndices = pkg.getItemIndices();
    const clusterCounts: number[] = new Array(k).fill(0);
    const clusterSums: number[][] = new Array(k).fill(0).map(() => new Array(d).fill(0));
    const rows: number[][] = itemIndices.map(() => {
      const label = _.random(0, k - 1); // assign a random cluster label
      const row = new Array(d).fill(0);
      row.push(label);
      clusterCounts[label]++;
      return row;
    });
    this.columns.forEach((columnIndex, j) => {
      const [minValue, maxValue] = dataset.getDomain(columnIndex, itemIndices) as [number, number];
      const span = maxValue - minValue;
      itemIndices.forEach((itemIndex, rowIndex) => {
        const value = span === 0 ? 0 : (dataset.getCell(itemIndex, columnIndex) as number - minValue) / span;
        rows[rowIndex][j] = value;
        const label = rows[rowIndex][d];
        clusterSums[label][j] += value;
      });
    });
    const output = () => {
      const newDataset = TabularDataset.fromColumnsAndRows(
        dataset.getColumns().map(column => column.name).concat('ClusterLabel'),
        itemIndices.map((itemIndex, rowIndex) => dataset.getRow(itemIndex).concat(rows[rowIndex][d])),
      );
      this.updateOutput(new SubsetPackage(newDataset));
      this.propagate();
    };

    /**
     * Computes the L2 norm distance between the rowIndex-th item and the label-th cluster centroid.
     */
    const getDistance = (rowIndex: number, label: number): number => {
      let dist = 0;
      for (let j = 0; j < d; j++) {
        const v = rows[rowIndex][j] - clusterSums[label][j] / clusterCounts[label];
        dist += v * v;
      }
      return Math.sqrt(dist);
    };

    const iterate = () => {
      let changed = false;
      const newLabels = rows.map((row, rowIndex) => {
        const prevLabel = row[d];
        let bestDist = getDistance(rowIndex, prevLabel);
        let newLabel = prevLabel;
        for (let label = 0; label < k; label++) {
          if (label === prevLabel) {
            continue;
          }
          const dist = getDistance(rowIndex, label);
          if (dist < bestDist) {
            changed = true;
            newLabel = label;
            bestDist = dist;
          }
        }
        return newLabel;
      });

      if (!changed) {
        this.kMeansRunning = false;
        output();
        return;
      }
      rows.forEach((row, rowIndex) => {
        const label = row[d];
        const newLabel = newLabels[rowIndex];
        if (label === newLabel) {
          return;
        }
        for (let j = 0; j < d; j++) {
          clusterSums[label][j] -= row[j];
          clusterSums[newLabel][j] += row[j];
        }
        clusterCounts[label]--;
        clusterCounts[newLabel]++;
        row[d] = newLabel;
      });
      if (this.kMeansOptions.outputEachIteration) {
        output();
        if (this.kMeansRunning) {
          setTimeout(iterate, this.kMeansOptions.iterationInterval);
        }
      } else {
        iterate();
      }
    };
    this.kMeansRunning = true;
    iterate();
  }

  private onSelectAlgorithm(algorithm: ClusteringAlgorithm, prevAlgorithm: ClusteringAlgorithm) {
    this.commitHistory(history.selectAlgorithmEvent(this, algorithm, prevAlgorithm));
    this.setAlgorithm(algorithm);
  }

  private onSelectColumns(columns: number[], prevColumns: number[]) {
    this.commitHistory(history.selectColumnsEvent(this, columns, prevColumns));
    this.setColumns(columns);
  }

  private stopKMeans() {
    this.kMeansRunning = false;
  }

  private onInputKMeansK(k: number, prevK: number) {
    this.commitHistory(history.inputKMeansKEvent(this, k, prevK));
    this.setKMeansK(k);
  }

  private onInputKMeansIterationInterval(interval: number, prevInterval: number) {
    this.commitHistory(history.inputKMeansIterationIntervalEvent(this, interval, prevInterval));
    this.setKMeansIterationInterval(interval);
  }
}

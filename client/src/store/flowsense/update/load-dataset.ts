import * as util from './util';
import { InjectedQuery, ejectMappableMarker } from '../helper';
import { QueryValue } from '../types';
import FlowsenseUpdateTracker from './tracker';
import DataSource from '@/components/data-source/data-source';

/**
 * Creates a data source and loads the given dataset.
 */
export const loadDataset = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery) => {
  const dataset = ejectMappableMarker(value.loadDataset as string, query.markerMapping);
  const originalname = dataset.value[0];
  const filename = dataset.value[1];
  const createdDataSource = util.createNode(util.getCreateNodeOptions('data-source'));
  (createdDataSource as DataSource).setDatasetInfo({
    originalname,
    filename,
    size: -1,
    lastUsedAt: '',
    createdAt: '',
  });
  tracker.createNode(createdDataSource);
  tracker.toAutoLayout(util.getNearbyNodes(createdDataSource));
  util.propagateNodes([createdDataSource]);
};

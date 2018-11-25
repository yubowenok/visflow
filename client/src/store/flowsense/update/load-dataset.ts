import * as util from './util';
import { InjectedQuery, ejectMappableMarker, QueryTarget } from '../helper';
import { QueryValue } from '../types';
import FlowsenseUpdateTracker from './tracker';
import DataSource from '@/components/data-source/data-source';
import store from '@/store';

/**
 * Creates a data source and loads the given dataset.
 */
export const loadDataset = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                            targets: QueryTarget[]) => {
  const dataset = ejectMappableMarker(value.loadDataset as string, query.markerMapping);
  const originalname = dataset.value[0];
  const filename = dataset.value[1];

  let dataSource: DataSource;
  if (targets.length && targets.filter(target => target.node.nodeType === 'data-source').length) {
    dataSource = (targets.find(target => target.node.nodeType === 'data-source') as QueryTarget).node as DataSource;
  } else {
    dataSource = util.createNode(util.getCreateNodeOptions('data-source')) as DataSource;
    tracker.createNode(dataSource);
  }
  (dataSource as DataSource).setDatasetInfo({
    username: store.state.user.username,
    originalname,
    filename,
    size: -1,
    lastUsedAt: '',
    createdAt: '',
  });
  tracker.toAutoLayout(util.getNearbyNodes(dataSource));
  util.propagateNodes([dataSource]);
};

import * as util from './util';
import { InjectedQuery, ejectMappableMarker, QueryTarget } from '../helper';
import { QueryValue } from '../types';
import { setChartColumns } from './chart';
import FlowsenseUpdateTracker from './tracker';
import DataSource from '@/components/data-source/data-source';
import { Visualization } from '@/components/visualization';
import Edge from '@/components/edge/edge';
import store from '@/store';

const DATA_SOURCE_OFFSET_PX = 300;

/**
 * Creates a data source and loads the given dataset.
 */
export const loadDataset = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                            targets: QueryTarget[]) => {
  const dataset = ejectMappableMarker(value.loadDataset as string, query.markerMapping);
  const originalname = dataset.value[0];
  const filename = dataset.value[1];

  let isDataSourceCreated = false;
  let dataSource: DataSource | null = util.getDataSource(filename);
  if (dataSource === null) {
    dataSource = util.createNode(util.getCreateNodeOptions('data-source')) as DataSource;
    tracker.createNode(dataSource);

    (dataSource as DataSource).setDatasetInfo({
      username: store.state.user.username,
      originalname,
      filename,
      size: -1,
      lastUsedAt: '',
      createdAt: '',
    });
    isDataSourceCreated = true;
  }

  if (targets.length) {
    if (isDataSourceCreated) {
      dataSource.moveBy(-DATA_SOURCE_OFFSET_PX, 0);
    }
    const edge = util.createEdge(dataSource.getSubsetOutputPort(), targets[0].port, false) as Edge;
    tracker.createEdge(edge);

    if (!isDataSourceCreated) {
      // Technical caveat: chart column settings are only supported when there exists a data source that
      // loads the requested dataset. If this is not the case, query injection has no idea of what columns are present
      // and thus columns cannot be successfully set. This would result in a new plot created with default columns,
      // ignoring column specifications.
      setChartColumns(tracker, value, query, targets[0].node as Visualization, dataSource);
    }
  }

  tracker.toAutoLayout(util.getNearbyNodes(dataSource));
  util.propagateNodes([dataSource]);
};

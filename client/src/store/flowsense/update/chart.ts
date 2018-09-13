import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Visualization } from '@/components/visualization';
import { createEdge } from './util';
import { SubsetNode } from '@/components/subset-node';

/**
 * Given a created chart node, fill in its options by parsing QueryValue.
 * Returns the nodes that need layout adjustment.
 */
export const completeChart = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                              sources: QuerySource[], chartTarget: QueryTarget,
                              onlyCreateChart: boolean) => {
  const chartSource = onlyCreateChart ? sources[0].node : tracker.getCreatedNodes()[0];
  if (chartSource) {
    // Create an edge from chartSource to the new chart target.
    const targetPort = chartTarget.port;
    const sourcePort = sources[0].port;
    const edge = createEdge(sourcePort, targetPort, false);
    if (edge === null) {
      tracker.cancel(`error in connecting the visualization node`);
      return;
    }
    tracker.createEdge(edge);
  }

  // First propagate and then apply columns. Otherwise the columns may be overwritten.
  util.propagateNodes(chartTarget.port.getConnectedNodes());

  if (chartSource && value.columns) {
    const chart = chartTarget.node as Visualization;
    const columnIndices = [];
    for (const injectedColumn of value.columns) {
      const columnName = util.ejectMappableMarker(injectedColumn, query.markerMapping).value[0];
      const columnIndex = util.getColumnMarkerIndex(query, chartSource as SubsetNode, injectedColumn);
      if (columnIndex === null) {
        tracker.cancel(`column ${columnName} cannot be found`);
        return;
      }
      columnIndices.push(columnIndex);
    }
    chart.applyColumns(columnIndices);
  }
  tracker.toAutoLayout(util.getNearbyNodes(chartTarget.node));
};

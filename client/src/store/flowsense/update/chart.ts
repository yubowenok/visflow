import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue, FlowsenseDef } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Visualization } from '@/components/visualization';
import { createEdge } from './util';
import { SubsetNode } from '@/components/subset-node';
import LineChart from '@/components/line-chart/line-chart';

/**
 * Given a created chart node, fill in its options by parsing QueryValue.
 * Returns the nodes that need layout adjustment.
 */
export const completeChart = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                              sources: QuerySource[], chartTarget: QueryTarget,
                              onlyCreateChart: boolean) => {
  const chartSource = onlyCreateChart ? sources[0].node : tracker.getNodeToConnectToTarget();
  if (chartSource) {
    // Create an edge from chartSource to the new chart target.
    const targetPort = chartTarget.port;
    const sourcePort = onlyCreateChart ? sources[0].port : (chartSource as SubsetNode).getSubsetOutputPort();
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
    let columnIndices = [];

    for (const injectedColumn of value.columns) {
      if (injectedColumn === FlowsenseDef.ALL_COLUMNS) {
        columnIndices = util.getAllColumns(chartSource as SubsetNode);
        break;
      }
      const columnIndex = util.getColumnMarkerIndex(query, chartSource as SubsetNode, injectedColumn);
      if (columnIndex === null) {
        const columnName = util.ejectMappableMarker(injectedColumn, query.markerMapping).value[0];
        tracker.cancel(`column ${columnName} cannot be found`);
        return;
      }
      columnIndices.push(columnIndex);
    }

    if (value.seriesColumn !== undefined || value.groupByColumn !== undefined) {
      if (value.seriesColumn !== undefined) {
        const seriesColumnIndex = util.getColumnMarkerIndex(query, chartSource as SubsetNode, value.seriesColumn);
        if (seriesColumnIndex === null) {
          const seriesColumnName = util.ejectMappableMarker(value.seriesColumn, query.markerMapping).value[0];
          tracker.cancel(`series column ${seriesColumnName} cannot be found`);
          return;
        }
        columnIndices.push(seriesColumnIndex);
      } else {
        tracker.cancel(`must specify a series column`);
        return;
      }
      if (value.groupByColumn !== undefined) {
        const groupByColumnIndex = util.getColumnMarkerIndex(query, chartSource as SubsetNode, value.groupByColumn);
        if (groupByColumnIndex === null) {
          const groupByColumnName = util.ejectMappableMarker(value.groupByColumn, query.markerMapping).value[0];
          tracker.cancel(`group-by column ${groupByColumnName} cannot be found`);
          return;
        }
        columnIndices.push(groupByColumnIndex);
      }
    }
    chart.applyColumns(columnIndices);
  }
  tracker.toAutoLayout(util.getNearbyNodes(chartTarget.node));
};

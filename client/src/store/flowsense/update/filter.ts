import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue, FilterSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import Edge from '@/components/edge/edge';
import AttributeFilter, { PatternMatchMode, FilterType } from '@/components/attribute-filter/attribute-filter';
import { SubsetNode } from '@/components/subset-node';

const FILTER_OFFSET_PX = 300;

/**
 * Creates a filter.
 */
export const createFilter = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                             sources: QuerySource[], targets: QueryTarget[]) => {
  const filters = value.filters as FilterSpecification[];

  // TODO: Currently handles one filter, but this is left extensible.
  const filterSpec = filters[0];

  const nodeSave: any = {}; // tslint:disable-line no-any
  switch (true) {
    case filterSpec.pattern !== undefined:
      nodeSave.filterType = FilterType.PATTERN;
      nodeSave.patternParams = {
        patterns: [filterSpec.pattern as string],
        mode: PatternMatchMode.SUBSTRING,
        isCaseSensitive: false,
      };
      break;
    case filterSpec.range !== undefined:
      nodeSave.filterType = FilterType.RANGE;
      const range = filterSpec.range as { min?: number | string, max?: number | string };
      nodeSave.rangeParams = {
        min: range.min || null,
        max: range.max || null,
      };
      break;
    case filterSpec.sampling !== undefined:
    case filterSpec.extremum !== undefined:
      nodeSave.amount = filterSpec.amount || 0;
      nodeSave.amountType = filterSpec.amountType || 'percentage';
      nodeSave.groupByColumn = value.groupByColumn || null;
      if (filterSpec.sampling) {
        nodeSave.filterType = FilterType.SAMPLING;
      } else {
        nodeSave.filterType = FilterType.EXTREMUM;
        nodeSave.extremumCriterion = filterSpec.extremum;
      }
      break;
  }
  const source = sources[0].node as SubsetNode;
  const columnIndex = util.getColumnMarkerIndex(query, source, filterSpec.column);
  if (columnIndex === null) {
    tracker.cancel(`column ${filterSpec.column} cannot be found`);
    return;
  }
  nodeSave.column = columnIndex;

  const createdFilter = util.createNode(util.getCreateNodeOptions('attribute-filter'), nodeSave) as AttributeFilter;

  tracker.setNodeToConnectToTarget(createdFilter);
  tracker.createNode(createdFilter);
  const sourcePort = sources[0].port;
  if (!sourcePort) {
    tracker.cancel(`node ${source.getLabel()} does not have connectable output port for a filter`);
    return;
  }
  const targetPort = createdFilter.getInputPort('in');
  const createdEdge = util.createEdge(sourcePort, targetPort, false);
  tracker.createEdge(createdEdge as Edge);

  if (targets.length) {
    const targetNode = targets[0].node as SubsetNode;
    // Shift the visualization to the right to allow space for the union and visual editor.
    targetNode.moveBy(FILTER_OFFSET_PX, 0);
    if (!util.isVisualization(targetNode)) {
      // If the target is a visualization, the edge is created by completeChart.
      // If it is not, we need to connect to it.
      const edge = util.createEdge(createdFilter.getSubsetOutputPort(), targetNode.getSubsetInputPort(), false) as Edge;
      tracker.createEdge(edge);
    }
  }

  util.propagateNodes([source]);
  tracker.toAutoLayout(util.getNearbyNodes(createdFilter));
};

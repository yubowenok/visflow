import * as util from './util';
import { InjectedQuery, QuerySource } from '../helper';
import { QueryValue, FilterSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import Edge from '@/components/edge/edge';
import { PatternMatchMode, FilterType } from '@/components/attribute-filter/attribute-filter';
import { SubsetNode } from '@/components/subset-node';

/**
 * Creates a filter.
 */
export const createFilter = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                             sources: QuerySource[]) => {
  const filters = value.filters as FilterSpecification[];

  // TODO: Currently handles one filter, but this is left extensible.
  const filter = filters[0];

  const nodeSave: any = {}; // tslint:disable-line no-any
  switch (true) {
    case filter.pattern !== undefined:
      nodeSave.filterType = FilterType.PATTERN;
      nodeSave.patternParams = {
        patterns: [filter.pattern as string],
        mode: PatternMatchMode.SUBSTRING,
        isCaseSensitive: false,
      };
      break;
    case filter.range !== undefined:
      nodeSave.filterType = FilterType.RANGE;
      const range = filter.range as { min?: number | string, max?: number | string };
      nodeSave.rangeParams = {
        min: range.min || null,
        max: range.max || null,
      };
      break;
    case filter.sampling !== undefined:
    case filter.extremum !== undefined:
      nodeSave.amount = filter.amount || 0;
      nodeSave.amountType = filter.amountType || 'percentage';
      nodeSave.groupByColumn = value.groupByColumn || null;
      if (filter.sampling) {
        nodeSave.filterType = FilterType.SAMPLING;
      } else {
        nodeSave.filterType = FilterType.EXTREMUM;
        nodeSave.extremumCriterion = filter.extremum;
      }
      break;
  }
  const source = sources[0].node as SubsetNode;
  const columnIndex = util.getColumnMarkerIndex(query, source, filter.column);
  if (columnIndex === null) {
    tracker.cancel(`column ${filter.column} cannot be found`);
    return;
  }
  nodeSave.column = columnIndex;

  const createdNode = util.createNode(util.getCreateNodeOptions('attribute-filter'), nodeSave);

  tracker.setNodeToConnectToTarget(createdNode);
  tracker.createNode(createdNode);
  const sourcePort = sources[0].port;
  if (!sourcePort) {
    tracker.cancel(`node ${source.getLabel()} does not have connectable output port for a filter`);
    return;
  }
  const targetPort = createdNode.getInputPort('in');
  const createdEdge = util.createEdge(sourcePort, targetPort, false);
  tracker.createEdge(createdEdge as Edge);
  util.propagateNodes([source]);
  tracker.toAutoLayout(util.getNearbyNodes(createdNode));
};

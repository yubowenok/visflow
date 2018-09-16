import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue, LinkSpecification, ExtractSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Node } from '@/components/node';
import Edge from '@/components/edge/edge';
import { SubsetNode } from '@/components/subset-node';


/**
 * Creates a constants generator.
 */
export const createConstantsGenerator = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                                         sources: QuerySource[], targets: QueryTarget[]) => {
  if (!sources.length) {
    tracker.cancel('cannot extract constants without source node');
    return;
  }
  const spec = value.extract as ExtractSpecification;
  const sourceNode = sources[0].node;
  const sourcePort = sources[0].port;
  const columnIndex = util.getColumnMarkerIndex(query, sourceNode as SubsetNode, spec.column);
  const constantsGenerator = util.createNode(util.getCreateNodeOptions('constants-generator'), {
    column: columnIndex,
  });
  tracker.createNode(constantsGenerator);
  const edge = util.createEdge(sourcePort, constantsGenerator.getInputPort('in'), false) as Edge;
  tracker.createEdge(edge);

  util.propagateNodes([sourceNode]);
  tracker.toAutoLayout(util.getNearbyNodes(constantsGenerator));
};

import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue, LinkSpecification, EdgeSpecification, SourceNodeDescriptor, TargetNodeDescriptor } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Node } from '@/components/node';
import Edge from '@/components/edge/edge';
import { SubsetNode } from '@/components/subset-node';
import Linker from '@/components/linker/linker';
import { Visualization } from '@/components/visualization';
import { Port } from '@/components/port';
import { checkEdgeConnectivity } from '@/store/dataflow';


const attemptEdge = (type: string, sourceSpec: SourceNodeDescriptor, targetSpec: TargetNodeDescriptor,
                     query: InjectedQuery, tracker: FlowsenseUpdateTracker): Edge | undefined => {
  const source = util.getNodeByLabelOrType(sourceSpec.id, query, tracker);
  if (!source) {
    return;
  }
  let sourcePort = (source as SubsetNode).getSubsetOutputPort();
  if (sourceSpec.isSelection) {
    if (!(source as Visualization).isVisualization) {
      tracker.cancel(`source node ${source.getLabel()} does not have selection port`);
      return;
    }
    sourcePort = (source as Visualization).getSelectionPort();
  }
  const target = util.getNodeByLabelOrType(targetSpec.id, query, tracker);
  if (!target) {
    return;
  }
  const targetPort = (target as SubsetNode).getSubsetInputPort();
  if (type === 'connect') {
    const connectivity = checkEdgeConnectivity(sourcePort, targetPort);
    if (!connectivity.connectable) {
      return;
    }
    const edge = util.createEdge(sourcePort, targetPort, true) as Edge;
    tracker.createEdge(edge);
    return edge;
  } else if (type === 'disconnect') {
    const foundEdge = sourcePort.getAllEdges().filter(e => e.target === targetPort)[0];
    if (!foundEdge) {
      return;
    }
    util.removeEdge(foundEdge, true);
    tracker.removeEdge(foundEdge);
    return foundEdge;
  }
};

/**
 * Adds or removes an edge.
 */
export const editEdge = (tracker: FlowsenseUpdateTracker, spec: EdgeSpecification, query: InjectedQuery) => {
  const node1 = spec.nodes[0];
  const node2 = spec.nodes[1];
  if (!(node2 as SourceNodeDescriptor).isSelection) {
    // try edge from node1 to node2
    if (attemptEdge(spec.type, node1, node2, query, tracker)) {
      return;
    }
  }
  if (!(node1 as SourceNodeDescriptor).isSelection) {
    // try edge from node2 to node1
    if (attemptEdge(spec.type, node2, node1, query, tracker)) {
      return;
    }
  }
  tracker.cancel('no valid edge editing operation can be performed');
};

import * as util from './util';
import { InjectedQuery } from '../helper';
import { NodeSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Node } from '@/components/node';

/**
 * Removes node(s).
 */
export const editNode = (tracker: FlowsenseUpdateTracker, spec: NodeSpecification, query: InjectedQuery) => {
  const nodeSpecs = spec.nodes;
  const nodesToPropagate: Node[] = [];
  for (const nodeSpec of nodeSpecs) {
    const node = util.getNodeByLabelOrType(nodeSpec.id, query, tracker);
    if (node === null) {
      tracker.cancel(`node "${nodeSpec.id}" cannot be found`);
      return;
    }
    const removedEdges = util.removeNode(node as Node, false);
    for (const edge of removedEdges) {
      if (edge.source.node === node) {
        nodesToPropagate.push(edge.target.node);
      }
      tracker.removeEdge(edge);
    }
    tracker.removeNode(node as Node);
  }
  util.propagateNodes(nodesToPropagate);
};

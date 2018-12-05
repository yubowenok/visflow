import * as util from './util';
import { Node } from '@/components/node';
import { InjectedQuery } from '../helper';
import { QueryValue, SetOperatorSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { OutputPort } from '@/components/port';
import Edge from '@/components/edge/edge';
import SetOperator from '@/components/set-operator/set-operator';

/**
 * Creates a set operator.
 */
export const createSetOperator = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery) => {
  let sources: Node[] = [];
  const setOperator = value.setOperator as SetOperatorSpecification;
  let errored = false;
  setOperator.nodes.forEach(spec => {
    const foundNode = util.getNodeByLabelOrType(spec.id, query, tracker);
    if (!foundNode) {
      errored = true;
      return;
    }
    sources.push(foundNode);
  });
  if (errored) {
    return;
  }
  if (sources.length < 2) {
    sources = sources.concat(util.getDefaultSources(2 - sources.length, sources));
  }
  const createdNode = util.createNode(util.getCreateNodeOptions('set-operator'),
    {
      mode: setOperator.type,
    }) as SetOperator;

  tracker.createNode(createdNode);
  for (const sourceNode of sources) {
    const targetPort = createdNode.getSubsetInputPort();
    const sourcePort = sourceNode.findConnectablePort(targetPort) as OutputPort;
    if (!sourcePort) {
      tracker.cancel(`node ${sourceNode.getLabel()} is not connectable to a set operator`);
      return;
    }
    const createdEdge = util.createEdge(sourcePort, targetPort, false);
    tracker.createEdge(createdEdge as Edge);
  }
  util.propagateNodes(sources);
  tracker.toAutoLayout(util.getNearbyNodes(createdNode));
};

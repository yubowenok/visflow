import * as util from './util';
import { Node } from '@/components/node';
import { InjectedQuery } from '../helper';
import { QueryValue, SetOperatorSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { OutputPort } from '@/components/port';
import Edge from '@/components/edge/edge';

/**
 * Creates a set operator.
 */
export const createSetOperator = (value: QueryValue, query: InjectedQuery) => {
  let sources: Node[] = [];
  const setOperator = value.setOperator as SetOperatorSpecification;
  setOperator.nodes.forEach(marker => {
    const label = util.ejectMarker(marker, query.markerMapping).value[0];
    sources.push(util.findNodeWithLabel(label));
  });
  if (sources.length < 2) {
    const focuses = util.focusNodes().filter(focusedNode => sources.indexOf(focusedNode) === -1);
    sources = sources.concat(focuses.slice(0, 2 - sources.length));
  }
  const createdNode = util.createNode(util.getCreateNodeOptions('set-operator'),
    {
      mode: setOperator.type,
    });

  const tracker = new FlowsenseUpdateTracker();
  tracker.createNode(createdNode);
  for (const sourceNode of sources) {
    const targetPort = createdNode.getInputPort('in');
    const sourcePort = sourceNode.findConnectablePort(targetPort) as OutputPort;
    if (sourcePort === null) {
      tracker.cancel(`node ${sourceNode.getLabel()} is not connectable to a set operator`);
      return;
    }
    const createdEdge = util.createEdge(sourcePort, targetPort, false);
    tracker.createEdge(createdEdge as Edge);
  }
  tracker.commit('create set operator');
  util.propagateNodes(sources);
  util.autoLayout(sources.concat([createdNode]), tracker);
};

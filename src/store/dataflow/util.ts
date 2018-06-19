import Node from '@/components/node/node';
import Port from '@/components/port/port';
import _ from 'lodash';

export const checkEdgeConnectivity = (source: Port, target: Port): { connectable: boolean, reason: string } => {
  if (_.find(source.getConnectedPorts(), target)) {
    return {
      connectable: false,
      reason: 'edge already exists',
    };
  }
  if (!source.hasCapacity() || !target.hasCapacity()) {
    return {
      connectable: false,
      reason: 'port already has maximum number of connections',
    };
  }

  const visited: Set<Node> = new Set();
  visited.add(source.node);
  // Use array as queue here. The flow graph is small so the efficiency should be ok.
  const queue: Node[] = [target.node];
  while (queue.length) {
    const from = queue.shift() as Node;
    const outputs = from.getOutputNodes();
    // console.warn(from.id, outputs.map(node => node.id));
    for (const to of outputs) {
      if (visited.has(to)) {
        return {
          connectable: false,
          reason: 'cycles are not allowed in the diagram',
        };
      } else {
        visited.add(to);
        queue.push(to);
      }
    }
  }
  return { connectable: true, reason: '' };
};

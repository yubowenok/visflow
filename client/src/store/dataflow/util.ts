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
  const typeMatched = source.isTypeMatched(target);
  if (!typeMatched.matched) {
    return {
      connectable: false,
      reason: typeMatched.reason,
    };
  }

  const errNoCycle = {
    connectable: false,
    reason: 'cycles are not allowed in the diagram',
  };
  if (source.node === target.node) {
    return errNoCycle;
  }

  const visited: Set<Node> = new Set();
  visited.add(source.node);
  // Use array as queue here. The flow graph is small so the efficiency should be ok.
  const queue: Node[] = [target.node];
  while (queue.length) {
    const from = queue.shift() as Node;
    if (from.isInputOutputDisconnected) {
      continue;
    }
    const outputs = from.getOutputNodes();
    for (const to of outputs) {
      if (visited.has(to)) {
        return errNoCycle;
      } else {
        visited.add(to);
        queue.push(to);
      }
    }
  }
  return { connectable: true, reason: '' };
};

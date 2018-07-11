import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Port from '@/components/port/port';

/**
 * Traverses the downflow of the starting node.
 * Stores the post-traversal order in "order".
 */
const traverse = (node: Node, visited: Set<Node>, order: Node[]) => {
  if (visited.has(node)) {
    return;
  }
  visited.add(node);
  for (const to of node.getOutputNodes()) {
    traverse(to, visited, order);
  }
  order.push(node);
};

const propagate = (nodes: Node[]) => {
  // Obtain a topological order of the diagram.
  const visited = new Set<Node>();
  const order: Node[] = [];
  for (const node of nodes) {
    traverse(node, visited, order);
  }
  order.reverse();
  // Update each node in the topological order.
  for (const node of order) {
    console.log('startUpdate', node.id);
    node.startUpdate();
  }
  // Clear the isUpdated flags of all the nodes.
  for (const node of order) {
    node.clearUpdatedPorts();
  }
};

export const propagatePort = (port: Port) => {
  propagate(port.getConnectedNodes());
};

export const propagateNode = (node: Node) => {
  propagate([node]);
};

export const propagateNodes = (nodes: Node[]) => {
  propagate(nodes);
};

/**
 * @fileOverview Provides helper functions for dataflow modification.
 * The helper functions here should only be imported by the dataflow store.
 */
import { VueConstructor } from 'vue';
import _ from 'lodash';

import { checkEdgeConnectivity } from './util';
import { showSystemMessage } from '@/store/message';
import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Port from '@/components/port/port';
import store from '../index';
import { DataflowState, CreateNodeOptions, CreateEdgeOptions } from '@/store/dataflow/types';
import { getConstructor } from './node-types';
import { propagateNode, propagateNodes } from './propagate';
export * from './propagate';

export const createNode = (state: DataflowState, options: CreateNodeOptions) => {
  const constructor = getConstructor(options.type) as VueConstructor;
  const id = `node-${state.nodeIdCounter++}`;
  const node: Node = new constructor({
    data: {
      id,
      // Floor the coordinates so that nodes are always aligned to integers.
      x: Math.floor(options.centerX),
      y: Math.floor(options.centerY),
    },
    store,
  }) as Node;
  state.canvas.addNode(node);
  state.nodes.push(node);
};

export const createEdge = (state: DataflowState, options: CreateEdgeOptions, propagate: boolean) => {
  const sourcePort = options.sourcePort;
  const targetPort = options.targetPort || (options.targetNode as Node).findConnectablePort(sourcePort);
  if (!targetPort) {
    showSystemMessage('cannot find available port to connect', 'warn');
    return;
  }
  const connectivity = checkEdgeConnectivity(sourcePort, targetPort);
  if (!connectivity.connectable) {
    showSystemMessage(connectivity.reason, 'warn');
    return;
  }
  const edge = new Edge({
    data: {
      // always create edge from output port to input port
      source: !sourcePort.isInput ? sourcePort : targetPort,
      target: !sourcePort.isInput ? targetPort : sourcePort,
    },
    store,
  });
  sourcePort.addIncidentEdge(edge);
  targetPort.addIncidentEdge(edge);
  state.canvas.addEdge(edge);

  if (propagate) {
    propagateNode(edge.target.node);
  }
};

export const removeEdge = (state: DataflowState, edge: Edge, propagate: boolean) => {
  edge.source.removeIncidentEdge(edge);
  edge.target.removeIncidentEdge(edge);

  if (propagate) {
    propagateNode(edge.target.node);
  }

  state.canvas.removeEdge(edge, () => edge.$destroy());
};

export const removeNode = (state: DataflowState, node: Node, propagate: boolean) => {
  const outputNodes = node.getOutputNodes();
  for (const edge of node.getAllEdges()) {
    removeEdge(state, edge, false);
  }
  if (propagate) {
    propagateNodes(outputNodes);
  }

  state.canvas.removeNode(node, () => node.$destroy());
};

export const removeActiveNodes = (state: DataflowState) => {
  const affectedOutputNodes: Set<Node> = new Set();
  const activeNodes = state.nodes.filter(node => node.isActive);
  for (const node of activeNodes) {
    for (const toNode of node.getOutputNodes()) {
      if (_.indexOf(activeNodes, toNode) === -1) {
        affectedOutputNodes.add(toNode);
      }
    }
  }
  console.log('remove ', activeNodes);
  for (const node of activeNodes) {
    removeNode(state, node, false);
  }
  propagateNodes(Array.from(affectedOutputNodes));
};

export const disconnectPort = (state: DataflowState, port: Port, propagate: boolean) => {
  const outputNodes = port.getConnectedNodes();
  for (const edge of port.getAllEdges()) {
    removeEdge(state, edge, false);
  }
  if (propagate) {
    propagateNodes(outputNodes);
  }
};

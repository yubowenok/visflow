/**
 * @fileOverview Provides helper functions for dataflow modification.
 * The helper functions here should only be imported by the dataflow store.
 */
import { VueConstructor } from 'vue';
import _ from 'lodash';

import { checkEdgeConnectivity } from '@/store/dataflow/util';
import { showSystemMessage } from '@/common/util';
import { Node, NodeSave } from '@/components/node';
import Edge, { EdgeSave } from '@/components/edge/edge';
import Port from '@/components/port/port';
import store from '@/store';
import {
  DataflowState,
  CreateNodeOptions,
  CreateEdgeOptions,
  DiagramSave,
} from '@/store/dataflow/types';
import { getConstructor } from '@/store/dataflow/node-types';
import { propagateNode, propagateNodes } from '@/store/dataflow/propagate';
export * from '@/store/dataflow/propagate';
import { getInitialState } from '@/store/dataflow';
import { InputPort, OutputPort } from '@/components/port';
import { DEFAULT_ANIMATION_DURATION_S } from '@/common/constants';

const getNodeDataOnCreate = (options: CreateNodeOptions): {} => {
  const data = {};
  if (options.x !== undefined && options.y !== undefined) {
    _.extend(data, {
      x: options.x,
      y: options.y,
    });
  } else if (options.centerX !== undefined && options.centerY !== undefined) {
    _.extend(data, {
      centerX: options.centerX,
      centerY: options.centerY,
    });
  }
  return data;
};

export const createNode = (state: DataflowState, options: CreateNodeOptions): Node => {
  const constructor = getConstructor(options.type) as VueConstructor;
  const id = `node-${state.nodeIdCounter++}`;
  const dataOnCreate = getNodeDataOnCreate(options);
  const node: Node = new constructor({
    data: {
      id,
      dataOnCreate,
    },
    store,
  }) as Node;
  state.canvas.addNode(node);
  state.nodes.push(node);
  return node;
};

export const createEdge = (state: DataflowState, sourcePort: OutputPort, targetPort: InputPort,
                           propagate: boolean): Edge | null => {
  const connectivity = checkEdgeConnectivity(sourcePort, targetPort);
  if (!connectivity.connectable) {
    showSystemMessage(store, connectivity.reason, 'warn');
    return null;
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
  return edge;
};

export const createEdgeToNode = (state: DataflowState, sourcePort: OutputPort, targetNode: Node,
                                 propagate: boolean): Edge | null => {
  const targetPort = targetNode.findConnectablePort(sourcePort) as InputPort;
  if (!targetPort) {
    showSystemMessage(store, 'cannot find available port to connect', 'warn');
    return null;
  }
  return createEdge(state, sourcePort, targetPort, propagate);
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

export const removeSelectedNodes = (state: DataflowState) => {
  const affectedOutputNodes: Set<Node> = new Set();
  const nodes = state.nodes.filter(node => node.isSelected);
  for (const node of nodes) {
    for (const toNode of node.getOutputNodes()) {
      if (_.indexOf(nodes, toNode) === -1) {
        affectedOutputNodes.add(toNode);
      }
    }
  }
  for (const node of nodes) {
    removeNode(state, node, false);
  }
  propagateNodes(Array.from(affectedOutputNodes));
};

export const disconnectPort = (state: DataflowState, port: Port, propagate: boolean) => {
  const affectedNodes = port.isInput ? [port.node] : port.getConnectedNodes();
  for (const edge of port.getAllEdges()) {
    removeEdge(state, edge, false);
  }
  if (propagate) {
    propagateNodes(affectedNodes);
  }
};

export const resetDataflow = (state: DataflowState) => {
  for (const node of state.nodes) {
    removeNode(state, node, false);
  }
  _.extend(state, _.omit(getInitialState(), 'canvas'));
};

export const serializeDiagram = (state: DataflowState): DiagramSave => {
  const serializedEdges: EdgeSave[] = [];
  for (const node of state.nodes) {
    const edges = node.getOutputEdges();
    for (const edge of edges) {
      serializedEdges.push(edge.serialize());
    }
  }
  return {
    diagramName: state.diagramName,
    nodes: state.nodes.map(node => node.serialize()),
    edges: serializedEdges,
  };
};

export const deserializeDiagram = (state: DataflowState, diagram: DiagramSave) => {
  // First clear the diagram.
  resetDataflow(state);

  const sources = diagram.nodes.map(nodeSave => {
    const node = createNode(state, {
      type: nodeSave.type,
    });
    node.deserialize(nodeSave);
    node.deactivate(); // Avoid all nodes being active.
    return node;
  }).filter(node => node.isPropagationSource);

  for (const edgeSave of diagram.edges) {
    const sourceNode = state.nodes.find(node => node.id === edgeSave.sourceNodeId) as Node;
    const targetNode = state.nodes.find(node => node.id === edgeSave.targetNodeId) as Node;
    const sourcePort = sourceNode.getOutputPort(edgeSave.sourcePortId);
    const targetPort = targetNode.getInputPort(edgeSave.targetPortId);
    createEdge(state, sourcePort, targetPort, false);
  }

  propagateNodes(sources);
};

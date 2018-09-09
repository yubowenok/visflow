import Node from '@/components/node/node';
import Edge, { EdgeSave } from '@/components/edge/edge';
import _ from 'lodash';
import {
  HistoryDiagramEvent,
  HistoryDiagramBatchEvent,
  diagramEvent,
  diagramBatchEvent,
} from '@/store/history/types';
import { DiagramEventType } from '@/store/dataflow/types';
import { DataflowState } from './types';
import * as helper from './helper';
import { NodeSave } from '@/components/node';
import { AutoLayoutResult } from '@/store/dataflow/layout';

interface CreateNodeAnchor {
  id: string;
  x: number;
  y: number;
}

/**
 * When a node is created, its position is set by (dataflowX, dataflowY). Yet during an undo/redo event the canvas
 * may have been panned and using the original dataflowX/Y would result in out-of-date position. We thus find another
 * "anchor" node that exists in the diagram and use its position to compute the relative position of the node being
 * created.
 * TODO: Consider changing the panning to a global translation, so that every node has a fixed position in the diagram.
 * However this may change the interaction implementation as well. Currently the code base always use screen offset to
 * compute positions.
 */
const findCreateNodeAnchor = (node: Node, nodes: Node[]): CreateNodeAnchor => {
  const anchorNode = nodes.find(otherNode => otherNode !== node);
  return anchorNode ? {
    id: anchorNode.id,
    x: anchorNode.getBoundingBox().x,
    y: anchorNode.getBoundingBox().y,
  } : { id: '', x: 0, y: 0 };
};

export const createNodeEvent = (node: Node, nodes: Node[]): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.CREATE_NODE,
    'create node',
    {
      nodeSave: node.serialize(),
      anchor: findCreateNodeAnchor(node, nodes),
    },
    {
      isNodeIcon: true,
      nodeType: node.nodeType,
    },
  );
};

export const createEdgeEvent = (edge: Edge): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.CREATE_EDGE,
    'create edge',
    { edgeSave: edge.serialize() },
    { value: 'fas fa-link' },
  );
};

// Event that removes a single node (not considering its incident edges).
export const removeNodeEvent = (node: Node, nodes: Node[]): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.REMOVE_NODE,
    'remove node',
    {
      nodeSave: node.serialize(),
      anchor: findCreateNodeAnchor(node, nodes),
    },
    { value: 'fas fa-trash' },
  );
};

export const removeNodeAndIncidentEdgesEvent = (node: Node, nodes: Node[]): HistoryDiagramBatchEvent => {
  const edges = node.getAllEdges();
  return diagramBatchEvent(
    DiagramEventType.REMOVE_NODE,
    'remove node',
    edges.map(edge => removeEdgeEvent(edge)).concat([removeNodeEvent(node, nodes)]),
    { value: 'fas fa-trash' },
  );
};

export const removeEdgeEvent = (edge: Edge): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.REMOVE_EDGE,
    'remove edge',
    { edgeSave: edge.serialize() },
    { value: 'fas fa-unlink' },
  );
};

export const removeNodesEvent = (events: HistoryDiagramEvent[]): HistoryDiagramBatchEvent => {
  const countNodes = events.filter(evt => evt.data.nodeSave).length;
  return diagramBatchEvent(
    DiagramEventType.REMOVE_NODES,
    'remove ' + (countNodes > 1 ? 'nodes' : 'node'),
    events,
    { value: 'fas fa-trash' },
  );
};

export const createNodeOnEdgeEvent = (events: HistoryDiagramEvent[]): HistoryDiagramBatchEvent => {
  const nodeEvent = events.filter(evt => evt.data.nodeSave)[0];
  return diagramBatchEvent(
    DiagramEventType.CREATE_NODE_ON_EDGE,
    'create node on edge',
    events,
    { isNodeIcon: true, nodeType: nodeEvent.data.nodeSave.type },
  );
};

export const insertNodeOnEdgeEvent = (events: HistoryDiagramEvent[], node: Node): HistoryDiagramBatchEvent => {
  return diagramBatchEvent(
    DiagramEventType.INSERT_NODE_ON_EDGE,
    'insert node on edge',
    events,
    { isNodeIcon: true, nodeType: node.nodeType },
  );
};

export const disconnectPortEvent = (events: HistoryDiagramEvent[]): HistoryDiagramBatchEvent => {
  return diagramBatchEvent(
    DiagramEventType.DISCONNECT_PORT,
    'disconnect port',
    events,
    { value: 'fas fa-unlink' },
  );
};

export const autoLayoutEvent = (result: AutoLayoutResult): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.AUTO_LAYOUT,
    'auto layout',
    result,
    { value: 'fas fa-th' },
  );
};

const createNodeFromSave = (state: DataflowState, nodeSave: NodeSave, anchor: CreateNodeAnchor) => {
  const anchorNode = state.nodes.find(otherNode => otherNode.id === anchor.id) as Node;
  if (!anchor || !anchorNode) {
    console.error('cannot find anchor node');
  }
  // Make a copy of nodeSave to avoid changing the history storage.
  nodeSave = _.extend({}, nodeSave, {
    dataflowX: nodeSave.dataflowX + anchorNode.getBoundingBox().x - anchor.x,
    dataflowY: nodeSave.dataflowY + anchorNode.getBoundingBox().y - anchor.y,
  });
  const node = helper.createNode(
    state,
    { type: nodeSave.type },
    nodeSave,
  );
  node.deserialize(nodeSave);
  node.activate();
  return node;
};

const removeNodeFromSave = (state: DataflowState, nodeSave: NodeSave) => {
  const nodeToRemove = state.nodes.find(node => node.id === nodeSave.id) as Node;
  helper.removeNode(state, nodeToRemove, true);
};

const createEdgeFromSave = (state: DataflowState, edgeSave: EdgeSave) => {
  const sourceNode = state.nodes.find(node => node.id === edgeSave.sourceNodeId) as Node;
  const targetNode = state.nodes.find(node => node.id === edgeSave.targetNodeId) as Node;
  const sourcePort = sourceNode.getOutputPort(edgeSave.sourcePortId);
  const targetPort = targetNode.getInputPort(edgeSave.targetPortId);
  helper.createEdge(state, sourcePort, targetPort, true);
};

const removeEdgeFromSave = (state: DataflowState, edgeSave: EdgeSave) => {
  const sourceNode = state.nodes.find(node => node.id === edgeSave.sourceNodeId) as Node;
  const edge = sourceNode.getOutputPort(edgeSave.sourcePortId)
    .getAllEdges()
    .find(e => e.target.node.id === edgeSave.targetNodeId && e.target.id === edgeSave.targetPortId) as Edge;
  helper.removeEdge(state, edge, true);
};

const undoCreateNode = (state: DataflowState, { nodeSave }: { nodeSave: NodeSave }) => {
  removeNodeFromSave(state, nodeSave);
};
const redoRemoveNode = undoCreateNode;

const redoCreateNode = (state: DataflowState, { nodeSave, anchor }:
  { nodeSave: NodeSave, anchor: CreateNodeAnchor }) => {
  createNodeFromSave(state, nodeSave, anchor);
};
const undoRemoveNode = redoCreateNode;

const undoCreateEdge = (state: DataflowState, { edgeSave }: { edgeSave: EdgeSave }) => {
  removeEdgeFromSave(state, edgeSave);
};
const redoRemoveEdge = undoCreateEdge;

const redoCreateEdge = (state: DataflowState, { edgeSave }: { edgeSave: EdgeSave }) => {
  createEdgeFromSave(state, edgeSave);
};
const undoRemoveEdge = redoCreateEdge;

const undoPanning = (state: DataflowState, { from, to }: { from: Point, to: Point }) => {
  state.nodes.forEach(node => node.moveBy(from.x - to.x, from.y - to.y));
};

const redoPanning = (state: DataflowState, { from, to }: { from: Point, to: Point }) => {
  state.nodes.forEach(node => node.moveBy(to.x - from.x, to.y - from.y));
};

const undoAutoLayout = (state: DataflowState, result: AutoLayoutResult) => {
  for (const node of state.nodes) {
    if (node.id in result) {
      const { from, to } = result[node.id];
      node.moveBy(from.x - to.x, from.y - to.y);
    }
  }
};

const redoAutoLayout = (state: DataflowState, result: AutoLayoutResult) => {
  for (const node of state.nodes) {
    if (node.id in result) {
      const { from, to } = result[node.id];
      node.moveBy(to.x - from.x, to.y - from.y);
    }
  }
};

export const undoEvents = (state: DataflowState, events: HistoryDiagramEvent[]) => {
  for (const event of events.concat().reverse()) {
    undo(state, event);
  }
};

export const redoEvents = (state: DataflowState, events: HistoryDiagramEvent[]) => {
  for (const event of events) {
    redo(state, event);
  }
};

export const undo = (state: DataflowState, evt: HistoryDiagramEvent) => {
  switch (evt.type) {
    case DiagramEventType.CREATE_NODE:
      undoCreateNode(state, evt.data);
      break;
    case DiagramEventType.REMOVE_NODE:
      undoRemoveNode(state, evt.data);
      break;
    case DiagramEventType.CREATE_EDGE:
      undoCreateEdge(state, evt.data);
      break;
    case DiagramEventType.REMOVE_EDGE:
      undoRemoveEdge(state, evt.data);
      break;
    case DiagramEventType.PANNING:
      undoPanning(state, evt.data);
      break;
    case DiagramEventType.AUTO_LAYOUT:
      undoAutoLayout(state, evt.data);
      break;
    default: // Batch events
      undoEvents(state, (evt as HistoryDiagramBatchEvent).events);
      break;
  }
};

export const redo = (state: DataflowState, evt: HistoryDiagramEvent) => {
  switch (evt.type) {
    case DiagramEventType.CREATE_NODE:
      redoCreateNode(state, evt.data);
      break;
    case DiagramEventType.REMOVE_NODE:
      redoRemoveNode(state, evt.data);
      break;
    case DiagramEventType.CREATE_EDGE:
      redoCreateEdge(state, evt.data);
      break;
    case DiagramEventType.REMOVE_EDGE:
      redoRemoveEdge(state, evt.data);
      break;
    case DiagramEventType.PANNING:
      redoPanning(state, evt.data);
      break;
    case DiagramEventType.AUTO_LAYOUT:
      redoAutoLayout(state, evt.data);
      break;
    default: // Batch events
      redoEvents(state, (evt as HistoryDiagramBatchEvent).events);
      break;
  }
};

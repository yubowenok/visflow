import Node from '@/components/node/node';
import Edge, { EdgeSave } from '@/components/edge/edge';
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

export const createNodeEvent = (node: Node): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.CREATE_NODE,
    'create node',
    { nodeSave: node.serialize() },
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
export const removeNodeEvent = (node: Node): HistoryDiagramEvent => {
  return diagramEvent(
    DiagramEventType.REMOVE_NODE,
    'remove node',
    { nodeSave: node.serialize() },
    { value: 'fas fa-trash' },
  );
};

export const removeNodeAndIncidentEdgesEvent = (node: Node): HistoryDiagramBatchEvent => {
  const edges = node.getAllEdges();
  return diagramBatchEvent(
    DiagramEventType.REMOVE_NODE,
    'remove node',
    edges.map(edge => removeEdgeEvent(edge)).concat([removeNodeEvent(node)]),
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

const createNodeFromSave = (state: DataflowState, nodeSave: NodeSave) => {
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

const redoCreateNode = (state: DataflowState, { nodeSave }: { nodeSave: NodeSave }) => {
  createNodeFromSave(state, nodeSave);
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

const undoEvents = (state: DataflowState, events: HistoryDiagramEvent[]) => {
  for (const event of events.concat().reverse()) {
    undo(state, event);
  }
};

const redoEvents = (state: DataflowState, events: HistoryDiagramEvent[]) => {
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
    default: // Batch events
      redoEvents(state, (evt as HistoryDiagramBatchEvent).events);
      break;
  }
};

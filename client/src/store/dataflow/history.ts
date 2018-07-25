import Node from '@/components/node/node';
import Edge, { EdgeSave } from '@/components/edge/edge';
import {
  HistoryEventLevel,
  HistoryDiagramEvent,
} from '@/store/history/types';
import { DiagramHistoryEventType } from '@/store/dataflow/types';
import { DataflowState } from './types';
import * as helper from './helper';

export const createNodeHistory = (node: Node): HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type: DiagramHistoryEventType.CREATE_NODE,
    message: 'create node',
    data: {
      nodeSave: node.serialize(),
    },
  };
};

export const createEdgeHistory = (edge: Edge): HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type: DiagramHistoryEventType.CREATE_EDGE,
    message: 'create edge',
    data: {
      edgeSave: edge.serialize(),
    },
  };
};

export const removeNodeHistory = (node: Node): HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type: DiagramHistoryEventType.REMOVE_NODE,
    message: 'remove node',
    data: {
      nodeSave: node.serialize(),
    },
  };
};

export const removeEdgeHistory = (edge: Edge): HistoryDiagramEvent => {
  return {
    level: HistoryEventLevel.DIAGRAM,
    type: DiagramHistoryEventType.REMOVE_EDGE,
    message: 'remove edge',
    data: {
      edgeSave: edge.serialize(),
    },
  };
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

const undoCreateEdge = (state: DataflowState, { edgeSave }: { edgeSave: EdgeSave }) => {
  removeEdgeFromSave(state, edgeSave);
};

const redoCreateEdge = (state: DataflowState, { edgeSave }: { edgeSave: EdgeSave }) => {
  createEdgeFromSave(state, edgeSave);
};

export const undo = (state: DataflowState, evt: HistoryDiagramEvent) => {
  switch (evt.type) {
    case DiagramHistoryEventType.CREATE_EDGE:
      undoCreateEdge(state, evt.data);
      break;
  }
};

export const redo = (state: DataflowState, evt: HistoryDiagramEvent) => {
  switch (evt.type) {
    case DiagramHistoryEventType.CREATE_EDGE:
      redoCreateEdge(state, evt.data);
      break;
  }
};

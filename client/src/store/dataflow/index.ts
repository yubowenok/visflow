import { Module } from 'vuex';
import store, { RootState } from '@/store';
import _ from 'lodash';

import { DataflowState, CreateNodeOptions, CreateEdgeOptions } from './types';
import * as helper from './helper';
import * as saveLoad from './save-load';
import * as nodeTypes from './node-types';
import * as history from './history';
export * from './util';

import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Port from '@/components/port/port';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';
import { HistoryDiagramEvent } from '@/store/history/types';


/** It is expected that the number of nodes do not exceed this limit, and we can rotate 300 layers. */
const MAX_NODE_LAYERS = 300;

export const getInitialState = (): DataflowState => ({
  canvas: undefined,
  nodeTypes: nodeTypes.nodeTypes,
  nodes: [],
  numNodeLayers: 0,
  filename: '',
  diagramName: '',
  isDeserializing: false,
});

export const initialState: DataflowState = getInitialState();

const getters = {
  /**
   * Gets the z-index of the largest node layer. This is used to move activated node to the front and above
   * all other nodes.
   */
  topNodeLayer: (state: DataflowState): number => {
    return state.numNodeLayers;
  },

  /**
   * Retrieves the img source for a given type of node.
   */
  getImgSrc: (state: DataflowState): (type: string) => string => {
    return (type: string) => nodeTypes.getImgSrc(type);
  },
};

const mutations = {
  /**
   * Sets the rendering canvas to the global Vue Dataflow instance.
   * This is called exactly once when App component is mounted.
   */
  setCanvas: (state: DataflowState, canvas: DataflowCanvas) => {
    state.canvas = canvas;
  },

  /**
   * Assigns a new layer for a node.
   * This typically happens when a node is clicked so that it appears on top of the other nodes.
   */
  incrementNodeLayer: (state: DataflowState) => {
    if (state.numNodeLayers === MAX_NODE_LAYERS) {
      state.nodes.forEach(node => {
        node.layer = node.layer - MAX_NODE_LAYERS;
      });
      state.numNodeLayers -= MAX_NODE_LAYERS;
    }
    state.numNodeLayers++;
  },

  /**
   * Creates a node without propagation. This assumes the new node does not connect to any other node.
   */
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    const node = helper.createNode(state, options);
    if (store.state.interaction.mouseupEdge) {
      // If the node button is dropped on an edge, attempt to insert the new node onto this edge.
      const result = helper.insertNodeOnEdge(state, node, store.state.interaction.mouseupEdge);
      store.commit('interaction/clearMouseupEdge');
      store.commit('history/commit', history.createNodeOnEdgeEvent([
          history.removeEdgeEvent(result.removedEdge),
          history.createNodeEvent(node),
        ].concat(result.createdEdges.map(edge => history.createEdgeEvent(edge)))),
      );
    } else {
      store.commit('history/commit', history.createNodeEvent(node));
    }
  },

  /** Removes a node and propagates. */
  removeNode: (state: DataflowState, node: Node) => {
    // Commit history before removing the node. Otherwise incident edges would be incorrect.
    store.commit('history/commit', history.removeNodeAndIncidentEdgesEvent(node));
    helper.removeNode(state, node, true);
  },

  /** Removes the nodes that are currently selected. */
  removeSelectedNodes: (state: DataflowState) => {
    const result = helper.removeSelectedNodes(state);
    store.commit('history/commit', history.removeNodesEvent(
      result.removedEdges.map(edge => history.removeEdgeEvent(edge)).concat(
        result.removedNodes.map(node => history.removeNodeEvent(node)),
      ),
    ));
  },

  /** Creates an edge and propagates. */
  createEdge: (state: DataflowState, options: CreateEdgeOptions) => {
    let edge: Edge | null = null;
    if (options.targetNode) {
      edge = helper.createEdgeToNode(state, options.sourcePort, options.targetNode, true);
    } else if (options.targetPort) {
      edge = helper.createEdge(state, options.sourcePort, options.targetPort, true);
    }
    if (edge !== null) {
      store.commit('history/commit', history.createEdgeEvent(edge));
    }
  },

  /** Removes an edge and propagates. */
  removeEdge: (state: DataflowState, edge: Edge) => {
    store.commit('history/commit', history.removeEdgeEvent(edge));
    helper.removeEdge(state, edge, true);
  },

  /**
   * Inerts a node onto the given edge.
   * This happens when the user drags a node on canvas onto an edge on canvas, and is triggered by store/interaction.
   */
  insertNodeOnEdge: (state: DataflowState, { node, edge }: { node: Node, edge: Edge }) => {
    const result = helper.insertNodeOnEdge(state, node, edge);
    store.commit('interaction/clearMouseupEdge');
    const events = [history.removeEdgeEvent(edge)].concat(
      result.createdEdges.map(e => history.createEdgeEvent(e)),
    );
    store.commit('history/commit', history.insertNodeOnEdgeEvent(events, node));
  },

  /** Removes all incident edges to a port and propagates. */
  disconnectPort: (state: DataflowState, port: Port) => {
    const removedEdges = helper.disconnectPort(state, port, true);
    store.commit('history/commit', history.disconnectPortEvent(removedEdges.map(e => history.removeEdgeEvent(e))));
  },

  /** Notifies of port data change and propagates the change. */
  portUpdated: (state: DataflowState, port: Port) => {
    if (state.isDeserializing) {
      console.log('propagation blocked during deserialization from port of node', port.node.id);
      return;
    }
    helper.propagatePort(port);
  },

  /** Notifies of node data change and propagates the change. */
  nodeUpdated: (state: DataflowState, node: Node) => {
    if (state.isDeserializing) {
      console.log('propagation blocked during deserialization from node', node.id);
      return;
    }
    helper.propagateNode(node);
  },

  /** Moves all nodes by (dx, dy). */
  moveDiagram: (state: DataflowState, { dx, dy }: { dx: number, dy: number }) => {
    _.each(state.nodes.filter(node => node.isVisible), node => node.moveBy(dx, dy));
  },

  undo: (state: DataflowState, evt: HistoryDiagramEvent) => {
    history.undo(state, evt);
  },

  redo: (state: DataflowState, evt: HistoryDiagramEvent) => {
    history.redo(state, evt);
  },

  ...saveLoad.mutations,
};

const actions = {
  ...saveLoad.actions,
};

const dataflow: Module<DataflowState, RootState> = {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions,
};

export default dataflow;

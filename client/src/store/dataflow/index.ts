import { Module } from 'vuex';
import store, { RootState } from '@/store';
import _ from 'lodash';

import {
  DataflowState,
  CreateNodeOptions,
  CreateEdgeOptions,
  CreateEdgeBetweenPortAndNodeOptions,
  CreateEdgeFromPortToPortOptions,
  NodeType,
} from './types';
import * as helper from './helper';
import * as saveLoad from './save-load';
import * as nodeTypes from './node-types';
import * as history from './history';
import * as layout from './layout';
export * from './util';

import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import { Port, OutputPort, InputPort } from '@/components/port';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';
import { HistoryDiagramEvent } from '@/store/history/types';
import TabularDataset from '@/data/tabular-dataset';
import DataSource from '@/components/data-source/data-source';


/** It is expected that the number of nodes do not exceed this limit, and we can rotate 500 layers. */
const MAX_NODE_LAYERS = 500;

export const getInitialState = (): DataflowState => ({
  canvas: undefined,
  nodeTypes: nodeTypes.nodeTypes,
  nodes: [],
  numNodeLayers: 0,
  filename: '',
  diagramName: '',
  isDeserializing: false,
  lastDiagramList: null,
  autoSaveTimer: null,
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

  /**
   * Retrieves the supported node types.
   */
  nodeTypes: (state: DataflowState): NodeType[] => {
    return nodeTypes.nodeTypes;
  },

  /**
   * Retrieves the node labels used in the diagram.
   */
  nodeLabels: (state: DataflowState): string[] => {
    return state.nodes.map(node => node.getLabel());
  },

  /**
   * Retrieves the tabular datasets used in the diagram.
   */
  tabularDatasets: (state: DataflowState): TabularDataset[] => {
    return state.nodes.filter(node => node.nodeType === 'data-source' && (node as DataSource).getDataset())
      .map(node => (node as DataSource).getDataset() as TabularDataset);
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
    // When the max node layers is reached, all nodes have their layers decreased by half of the max value.
    // This ensures that all z-indices are still non-negative.
    if (state.numNodeLayers === MAX_NODE_LAYERS) {
      state.nodes.forEach(node => {
        node.layer = node.layer - MAX_NODE_LAYERS / 2;
      });
      state.numNodeLayers -= MAX_NODE_LAYERS / 2;
    }
    state.numNodeLayers++;
  },

  /**
   * Creates a node without propagation. This assumes the new node does not connect to any other node.
   */
  createNode: (state: DataflowState, options: CreateNodeOptions) => {
    const node = helper.createNode(state, options);

    // Clears all selected and activated nodes.
    store.commit('interaction/clickBackground');

    if (store.state.interaction.mouseupEdge) {
      // If the node button is dropped on an edge, attempt to insert the new node onto this edge.
      const result = helper.insertNodeOnEdge(state, node, store.state.interaction.mouseupEdge);
      store.commit('interaction/clearMouseupEdge');
      store.commit('history/commit', history.createNodeOnEdgeEvent([
          history.removeEdgeEvent(result.removedEdge),
          history.createNodeEvent(node, state.nodes),
        ].concat(result.createdEdges.map(edge => history.createEdgeEvent(edge)))),
      );
    } else {
      store.commit('history/commit', history.createNodeEvent(node, state.nodes));
    }
  },

  /** Removes a node and propagates. */
  removeNode: (state: DataflowState, node: Node) => {
    // Commit history before removing the node. Otherwise incident edges would be incorrect.
    store.commit('history/commit', history.removeNodeAndIncidentEdgesEvent(node, state.nodes));
    helper.removeNode(state, node, true);
  },

  /** Removes the nodes that are currently selected. */
  removeSelectedNodes: (state: DataflowState) => {
    const result = helper.removeSelectedNodes(state);
    store.commit('history/commit', history.removeNodesEvent(
      result.removedEdges.map(edge => history.removeEdgeEvent(edge)).concat(
        result.removedNodes.map(node => history.removeNodeEvent(node, state.nodes)),
      ),
    ));
  },

  /** Creates an edge and propagates. */
  createEdge: (state: DataflowState, options: CreateEdgeOptions) => {
    let edge: Edge | null = null;
    if ((options as CreateEdgeFromPortToPortOptions).sourcePort) {
      const portPortOptions = options as CreateEdgeFromPortToPortOptions;
      edge = helper.createEdge(state, portPortOptions.sourcePort, portPortOptions.targetPort, true);
    } else {
      const portNodeOptions = options as CreateEdgeBetweenPortAndNodeOptions;
      if (portNodeOptions.port.isInput) {
        edge = helper.createEdgeFromNode(state, portNodeOptions.node, portNodeOptions.port as InputPort, true);
      } else {
        edge = helper.createEdgeToNode(state, portNodeOptions.port as OutputPort, portNodeOptions.node, true);
      }
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

  autoLayout: (state: DataflowState, movableNodes?: Node[]) => {
    let nodes = movableNodes || store.getters['interaction/selectedNodes'];
    if (nodes.length === 0) {
      nodes = undefined;
    }
    layout.autoLayout(state, nodes, {
      onComplete: (result: layout.AutoLayoutResult, transitionDone) => {
        if (transitionDone) {
          store.commit('history/commit', history.autoLayoutEvent(result));
        }
      },
    });
  },

  /** Turns on the node labels for all nodes. */
  labelAllNodes: (state: DataflowState) => {
    state.nodes.forEach(node => node.setLabelVisible(true));
  },

  /** Toggles the data mutation boundary. */
  toggleDataMutationBoundary: (state: DataflowState, visible: boolean) => {
    helper.dataMutationBoundary(visible);
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

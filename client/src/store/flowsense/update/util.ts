import _ from 'lodash';

import * as dataflowHelper from '@/store/dataflow/helper';
import Edge from '@/components/edge/edge';
import store from '@/store';
import { CreateNodeOptions, DataflowState } from '@/store/dataflow/types';
import { FlowsenseDef } from '@/store/flowsense/types';
import { INDEX_COLUMN } from '@/common/constants';
import { Node } from '@/components/node';
import { OutputPort, InputPort } from '@/components/port';
import { SubsetNode } from '@/components/subset-node';
import { Visualization } from '@/components/visualization';
import { ejectMarker, InjectedQuery, ejectMappableMarker } from '../helper';
import { focusNode, focusNodes } from '@/store/interaction/helper';
import { vectorDistance } from '@/common/vector';

export {
  ejectMarker,
  ejectMappableMarker,
  focusNode,
  focusNodes,
};

const dataflow = (): DataflowState => store.state.dataflow;

export const findNodeWithLabel = (label: string): Node => {
  return dataflow().nodes.filter(node => node.getLabel() === label)[0];
};

/**
 * Returns the default sources for a query, excluding the nodes specified in the exceptions.
 */
export const getDefaultSources = (count: number = 1, exceptions?: Node[]): Node[] => {
  return focusNodes().filter(focusedNode => (exceptions || []).indexOf(focusedNode) === -1).slice(0, count);
};

/**
 * Returns the position where Flowsense is activated. This is the position where the diagram should be extended.
 */
const getActivePosition = (): Point => {
  return {
    x: store.state.flowsense.activePosition.x,
    y: store.state.flowsense.activePosition.y,
  };
};

interface FlowsenseCreateNodeOptions {
  createIndex?: number; // Set this to apply x offset on node by index.
  offsetX?: number; // Set offsetX and offsetY to apply precise offset.
  offsetY?: number;
}

const CREATE_INDEX_X_OFFSET_PX = 100;
/**
 * Returns a create node options object that includes the position where Flowsense should create new node at.
 */
export const getCreateNodeOptions = (type: string, options?: FlowsenseCreateNodeOptions): CreateNodeOptions => {
  options = options || {};
  const position = getActivePosition();
  const createIndex = options.offsetX ? 0 : (options.createIndex || 0);
  return {
    type,
    activate: true,
    dataflowCenterX: position.x + createIndex * CREATE_INDEX_X_OFFSET_PX + (options.offsetX || 0),
    dataflowCenterY: position.y + (options.offsetY || 0),
  };
};

/**
 * Provides createNode wrapper.
 */
export const createNode = (options: CreateNodeOptions, nodeSave?: object): Node => {
  return dataflowHelper.createNode(dataflow(), options, nodeSave);
};

/**
 * Provides createEdge wrapper.
 */
export const createEdge = (sourcePort: OutputPort, targetPort: InputPort, propagate: boolean): Edge | null => {
  return dataflowHelper.createEdge(dataflow(), sourcePort, targetPort, propagate);
};

/**
 * Provides removeEdge wrapper.
 */
export const removeEdge = (edge: Edge, propagate: boolean) => {
  return dataflowHelper.removeEdge(dataflow(), edge, propagate);
};

/**
 * Propagates the nodes in the list.
 */
export const propagateNodes = (nodes: Node[]) => {
  dataflowHelper.propagateNodes(nodes);
};

/**
 * Returns the column index for a injected column marker based on a given node's input dataset.
 * If the node not have input data, or the column cannot be found on the data, null is returned.
 */
export const getColumnMarkerIndex = (query: InjectedQuery, node: SubsetNode, injectedColumn: string): number | null => {
  let columnIndex = injectedColumn === FlowsenseDef.INDEX_COLUMN ? INDEX_COLUMN : null;
  if (injectedColumn !== FlowsenseDef.INDEX_COLUMN && node.hasDataset()) {
    const columnName = ejectMappableMarker(injectedColumn, query.markerMapping).value[0];
    columnIndex = node.getDataset().getColumnIndex(columnName);
  }
  return columnIndex;
};

/**
 * Returns indices of all the columns in a source node.
 */
export const getAllColumns = (node: SubsetNode): number[] => {
  if (node.hasDataset()) {
    return _.range(node.getDataset().numColumns());
  }
  return [];
};

const NEARBY_THRESHOLD_PX = window.innerHeight / 4;
/**
 * Returns a list of nodes that are close to the given node.
 */
export const getNearbyNodes = (qNode: Node): Node[] => {
  const qCenter = qNode.getCenter();
  return dataflow().nodes.filter(node => {
    const center = node.getCenter();
    return vectorDistance(qCenter, center) <= NEARBY_THRESHOLD_PX;
  });
};

export const getAllNodes = (): Node[] => {
  return dataflow().nodes;
};

export const isVisualization = (node: Node): boolean => {
  return (node as Visualization).isVisualization;
};

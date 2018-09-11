import { CreateNodeOptions, DataflowState } from '@/store/dataflow/types';
import store from '@/store';
import { ejectMarker, InjectedQuery } from '../helper';
import { Node } from '@/components/node';
import { OutputPort, InputPort } from '@/components/port';
import Edge from '@/components/edge/edge';
import { focusNode, focusNodes } from '@/store/interaction/helper';
import * as dataflowHelper from '@/store/dataflow/helper';
import { SubsetNode } from '@/components/subset-node';
import { FlowsenseDef } from '@/store/flowsense/types';
import { INDEX_COLUMN } from '@/common/constants';
import { vectorDistance } from '@/common/vector';

export {
  ejectMarker,
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

/**
 * Returns a create node options object that includes the position where Flowsense should create new node at.
 */
export const getCreateNodeOptions = (type: string): CreateNodeOptions => {
  const position = getActivePosition();
  return {
    type,
    activate: true,
    dataflowCenterX: position.x,
    dataflowCenterY: position.y,
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
    const columnName = ejectMarker(injectedColumn, query.markerMapping).value[0];
    columnIndex = node.getDataset().getColumnIndex(columnName);
  }
  return columnIndex;
};

const NEARBY_THRESHOLD_PX = 300;
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

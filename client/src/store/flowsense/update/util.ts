import { CreateNodeOptions, DataflowState } from '@/store/dataflow/types';
import store from '@/store';
import { ejectMarker } from '../helper';
import { Node } from '@/components/node';
import { OutputPort, InputPort } from '@/components/port';
import Edge from '@/components/edge/edge';
import { focusNode, focusNodes } from '@/store/interaction/helper';
import * as dataflowHelper from '@/store/dataflow/helper';
import { autoLayout as dataflowAutoLayout } from '@/store/dataflow/layout';
import FlowsenseUpdateTracker from '@/store/flowsense/update/tracker';

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
 * Provides auto layout wrapper.
 */
export const autoLayout = (nodes: Node[], tracker: FlowsenseUpdateTracker) => {
  dataflowAutoLayout(dataflow(), nodes, result => tracker.autoLayout(nodes, result));
};

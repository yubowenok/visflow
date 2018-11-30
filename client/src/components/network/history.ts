import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Network, { NetworkSelection } from './network';

enum NetworkEventType {
  NETWORK_INTERACTIVE_SELECTION = 'setNetworkSelection',
  SELECT_NODE_ID_COLUMN = 'setNodeIdColumn',
  SELECT_EDGE_SOURCE_COLUMN = 'setEdgeSourceColumn',
  SELECT_EDGE_TARGET_COLUMN = 'setEdgeTargetColumn',
  SELECT_NODE_LABEL_COLUMN = 'setNodeLabelColumn',
  INPUT_LINK_DISTANCE = 'setLinkDistance',
  TOGGLE_NAVIGATING = 'setNavigating',
}

export const selectNodeIdColumnEvent = (node: Network, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.SELECT_NODE_ID_COLUMN,
    'select node ID column',
    node,
    node.setNodeIdColumn,
    column,
    prevColumn,
  );
};

export const selectEdgeSourceColumnEvent = (node: Network, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.SELECT_EDGE_SOURCE_COLUMN,
    'select edge source column',
    node,
    node.setEdgeSourceColumn,
    column,
    prevColumn,
  );
};

export const selectEdgeTargetColumnEvent = (node: Network, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.SELECT_EDGE_TARGET_COLUMN,
    'select edge target column',
    node,
    node.setEdgeTargetColumn,
    column,
    prevColumn,
  );
};

export const selectNodeLabelColumnEvent = (node: Network, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.SELECT_NODE_LABEL_COLUMN,
    'select node label column',
    node,
    node.setNodeLabelColumn,
    column,
    prevColumn,
  );
};

export const inputLinkDistanceEvent = (node: Network, value: number, prevValue: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.INPUT_LINK_DISTANCE,
    'input edge distance',
    node,
    node.setLinkDistance,
    value,
    prevValue,
  );
};

export const toggleNavigatingEvent = (node: Network, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.TOGGLE_NAVIGATING,
    'toggle navigation',
    node,
    node.setNavigating,
    value,
    !value,
  );
};

export const interactiveSelectionEvent = (node: Network, selection: NetworkSelection, prevSelection: NetworkSelection,
                                          message?: string): HistoryNodeOptionEvent => {
  const numNodes = selection.nodeSelection.numItems();
  const numEdges = selection.edgeSelection.numItems();
  if (!message) {
    message = `select ${numNodes} node${numNodes !== 1 ? 's' : ''}`;
    message += ` , ${numEdges} edge${numEdges !== 1 ? 's' : ''}`;
  }
  return nodeOptionEvent(
    NetworkEventType.NETWORK_INTERACTIVE_SELECTION,
    message,
    node,
    node.setNetworkSelection,
    {
      nodeSelection: selection.nodeSelection.serialize(),
      edgeSelection: selection.edgeSelection.serialize(),
    },
    {
      nodeSelection: prevSelection.nodeSelection.serialize(),
      edgeSelection: prevSelection.edgeSelection.serialize(),
    },
  );
};

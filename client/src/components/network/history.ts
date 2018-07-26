import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Network from './network';

enum NetworkEventType {
  SELECT_NODE_ID_COLUMN = 'select-node-id-column',
  SELECT_EDGE_SOURCE_COLUMN = 'select-edge-source-column',
  SELECT_EDGE_TARGET_COLUMN = 'select-edge-target-column',
  SELECT_NODE_LABEL_COLUMN = 'select-node-label-column',
  INPUT_LINK_DISTANCE = 'input-link-distance',
  TOGGLE_NAVIGATING = 'toggle-navigating',
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

export const selectNodeLabelColumn = (node: Network, column: number | null, prevColumn: number | null):
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

export const toggleNavigating = (node: Network, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NetworkEventType.TOGGLE_NAVIGATING,
    'toggle navigation',
    node,
    node.setNavigating,
    value,
    !value,
  );
};

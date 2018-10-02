import {
  HistoryNodeEvent,
  HistoryEventLevel,
  HistoryNodeOptionEvent,
  nodeEvent,
  nodeOptionEvent,
} from '@/store/history/types';
import { Node } from '@/components/node';
import { RootStore } from '@/store/types';
import { getNode } from '@/store/dataflow/helper';

export enum HistoryNodeEventType {
  MOVE = 'move',
  RESIZE = 'resize',
  TOGGLE_ICONIZED = 'toggle-iconized',
  TOGGLE_IN_VIS_MODE = 'toggle-in-vis-mode',
  TOGGLE_LABEL_VISIBLE = 'toggle-label-visible',
}

export const moveNodeEvent = (node: Node, movedNodes: Node[], to: Point, from: Point): HistoryNodeEvent => {
  return {
    level: HistoryEventLevel.NODE,
    type: HistoryNodeEventType.MOVE,
    message: 'move ' + (movedNodes.length > 1 ? 'nodes' : 'node'),
    nodeId: node.id,
    data: {
      movedNodeIds: movedNodes.map(movedNode => movedNode.id),
      from,
      to,
    },
    icon: { value: 'fas fa-arrows-alt' },
  };
};

export const resizeNodeEvent = (node: Node, newView: Box, prevView: Box): HistoryNodeEvent => {
  return nodeEvent(
    HistoryNodeEventType.RESIZE,
    'resize node',
    node,
    { prevView, newView },
    { value: 'fas fa-expand-arrows-alt' },
  );
};

export const toggleIconizedEvent = (node: Node, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistoryNodeEventType.TOGGLE_ICONIZED,
    'toggle iconizing',
    node,
    node.setIconized,
    value,
    !value,
    { value: 'fas fa-expand' },
  );
};

export const toggleInVisModeEvent = (node: Node, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistoryNodeEventType.TOGGLE_IN_VIS_MODE,
    'toggle node in VisMode',
    node,
    node.setInVisMode,
    value,
    !value,
    { value: 'fas fa-tv' },
  );
};

export const toggleLabelVisibleEvent = (node: Node, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    HistoryNodeEventType.TOGGLE_LABEL_VISIBLE,
    'toggle node label',
    node,
    node.setLabelVisible,
    value,
    !value,
    { value: 'fas fa-tag' },
  );
};

export const moveNode = (store: RootStore, node: Node, movedNodes: Node[], to: Point, from: Point) => {
  store.commit('history/commit', moveNodeEvent(node, movedNodes, to, from));
};

export const resizeNode =  (store: RootStore, node: Node, newView: Box, prevView: Box) => {
  store.commit('history/commit', resizeNodeEvent(node, newView, prevView));
};

const undoMoveNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Point = evt.data.from;
  const to: Point = evt.data.to;
  const nodes = store.state.dataflow.nodes.filter(node => evt.data.movedNodeIds.indexOf(node.id) !== -1);
  nodes.forEach(node => node.moveBy(from.x - to.x, from.y - to.y));
};

const redoMoveNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Point = evt.data.from;
  const to: Point = evt.data.to;
  const nodes = store.state.dataflow.nodes.filter(node => evt.data.movedNodeIds.indexOf(node.id) !== -1);
  nodes.forEach(node => node.moveBy(to.x - from.x, to.y - from.y));
};

const undoResizeNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Box = evt.data.prevView;
  const to: Box = evt.data.newView;
  const node = getNode(evt.nodeId);
  node.moveBy(from.x - to.x, from.y - to.y);
  node.setSize(from.width, from.height);
};

const redoResizeNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Box = evt.data.prevView;
  const to: Box = evt.data.newView;
  const node = getNode(evt.nodeId);
  node.moveBy(to.x - from.x, to.y - from.y);
  node.setSize(to.width, to.height);
};

export const undo = (store: RootStore, evt: HistoryNodeEvent) => {
  switch (evt.type) {
    case HistoryNodeEventType.MOVE:
      undoMoveNode(store, evt);
      break;
    case HistoryNodeEventType.RESIZE:
      undoResizeNode(store, evt);
      break;
  }
  const optionEvt = evt as HistoryNodeOptionEvent;
  if (optionEvt.setter || optionEvt.setterName) {
    if (optionEvt.setter) {
      optionEvt.setter(optionEvt.data.prevValue);
    } else { // setter is deserialized from setterName
      const setter = (getNode(evt.nodeId) as any)[optionEvt.setterName]; // tslint:disable-line no-any
      setter(optionEvt.data.prevValue);
    }
  }
};

export const redo = (store: RootStore, evt: HistoryNodeEvent) => {
  switch (evt.type) {
    case HistoryNodeEventType.MOVE:
      redoMoveNode(store, evt);
      break;
    case HistoryNodeEventType.RESIZE:
      redoResizeNode(store, evt);
      break;
  }
  const optionEvt = evt as HistoryNodeOptionEvent;
  if (optionEvt.setter || optionEvt.setterName) {
    if (optionEvt.setter) {
      optionEvt.setter(optionEvt.data.value);
    } else { // setter is deserialized from setterName
      const setter = (getNode(evt.nodeId) as any)[optionEvt.setterName]; // tslint:disable-line no-any
      setter(optionEvt.data.value);
    }
  }
};

import {
  HistoryNodeEvent,
  HistoryEventLevel,
  HistoryNodeOptionEvent,
  nodeEvent,
} from '@/store/history/types';
import { Node } from '@/components/node';
import { RootStore } from '@/store/types';

export enum HistoryNodeEventType {
  MOVE = 'move',
  RESIZE = 'resize',
  ICONIZE = 'iconize',
}

export const moveNodeEvent = (node: Node, selectedNodes: Node[], to: Point, from: Point): HistoryNodeEvent => {
  return {
    level: HistoryEventLevel.NODE,
    type: HistoryNodeEventType.MOVE,
    message: 'move ' + (selectedNodes.length > 1 ? 'nodes' : 'node'),
    node,
    data: {
      selectedNodes,
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

export const moveNode = (store: RootStore, node: Node, selectedNodes: Node[], to: Point, from: Point) => {
  store.commit('history/commit', moveNodeEvent(node, selectedNodes, to, from));
};

export const resizeNode =  (store: RootStore, node: Node, newView: Box, prevView: Box) => {
  store.commit('history/commit', resizeNodeEvent(node, newView, prevView));
};

const undoMoveNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Point = evt.data.from;
  const to: Point = evt.data.to;
  const nodes = evt.data.selectedNodes as Node[];
  nodes.forEach(node => node.moveBy(from.x - to.x, from.y - to.y));
};

const redoMoveNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Point = evt.data.from;
  const to: Point = evt.data.to;
  const nodes = evt.data.selectedNodes as Node[];
  nodes.forEach(node => node.moveBy(to.x - from.x, to.y - from.y));
};

const undoResizeNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Box = evt.data.prevView;
  const to: Box = evt.data.newView;
  evt.node.moveBy(from.x - to.x, from.y - to.y);
  evt.node.setSize(from.width, from.height);
};

const redoResizeNode = (store: RootStore, evt: HistoryNodeEvent) => {
  const from: Box = evt.data.prevView;
  const to: Box = evt.data.newView;
  evt.node.moveBy(to.x - from.x, to.y - from.y);
  evt.node.setSize(to.width, to.height);
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
  if (optionEvt.setter) {
    optionEvt.setter(optionEvt.data.prevValue);
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
  if (optionEvt.setter) {
    optionEvt.setter(optionEvt.data.value);
  }
};

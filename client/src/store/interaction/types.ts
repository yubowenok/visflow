import Node from '@/components/node/node';
import Edge from '@/components/edge/edge';
import Port from '@/components/port/port';

export interface InteractionState {
  // Whether a node is being dragged for repositioning.
  isNodeDragging: boolean;
  // Whether a node button is being dragged out of a node list (from node panel / quick node panel) to be created.
  isNodeListDragging: boolean;

  draggedNode?: Node;
  draggedPort?: Port;
  draggedX1: number;
  draggedY1: number;
  draggedX2: number;
  draggedY2: number;

  lastMouseX: number;
  lastMouseY: number;

  altPressed: boolean;
  shiftPressed: boolean;
  ctrlPressed: boolean;
  metaPressed: boolean;
  altHold: boolean;

  isSystemInVisMode: boolean;

  mouseupEdge: Edge | undefined;

  osCtrlKey: string; // 'ctrl' or 'meta'
  osCtrlKeyChar: string; // '⇧' (ctrl) or '⌘' (meta)
}

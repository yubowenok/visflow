import Node from '@/components/node/node';

export interface DataflowState {
  nodeTypes: NodeType[];
  nodes: Node[];
  edges: Edge[];
  numNodeLayers: number; // number of node layers, each node is on its own layer to define front/back ordering
  nodeIdCounter: number; // for assigning ids to new nodes
}

export interface NodeType {
  id: string;
  title: string;
  imgSrc: string;
  constructor: Function;
}

export interface CreateNodeOptions {
  type: string;
  centerX: number;
  centerY: number;
}
export interface ConnectionInfo {
  nodeId: string;
  portId: string;
}
export interface Node {
  id: string;
  type: string;
}

export interface Edge {
  source: ConnectionInfo;
  target: ConnectionInfo;
}

export interface Port {
  connectedWith: ConnectionInfo | undefined;
}

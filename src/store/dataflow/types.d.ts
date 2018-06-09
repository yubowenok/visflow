import Node from '@/components/node/node';

export interface NodeType {
  id: string;
  title: string;
  imgSrc: string;
  constructor?: Function;
}

export interface DataflowState {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeType[];
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

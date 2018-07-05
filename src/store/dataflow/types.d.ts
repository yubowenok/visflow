import Node from '@/components/node/node';
import Port from '@/components/port/port';
import Edge from '@/components/edge/edge';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';

export interface DataflowState {
  canvas: DataflowCanvas;
  nodeTypes: NodeType[];
  nodes: Node[];
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

export interface CreateEdgeOptions {
  sourcePort: Port;
  targetPort?: Port;
  targetNode?: Node;
}

export interface ConnectionInfo {
  nodeId: string;
  portId: string;
}

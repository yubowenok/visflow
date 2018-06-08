export interface Node {
  id: string;
  x: number;
  y: number;
}

export interface Edge {
  source: {
    nodeId: string,
    portId: string,
  };
  target: {
    nodeId: string,
    portId: string,
  };
}

export interface DataflowState {
  nodes: Node[];
  edges: Edge[];
}

export interface CreateNodeOptions {
  type: string;
  x: number;
  y: number;
}

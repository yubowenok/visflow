import Victor from 'victor';
import { forceSimulation, forceX, forceY, forceLink, forceManyBody, forceCollide } from 'd3-force';

import { DataflowState } from '@/store/dataflow/types';
import { Node } from '@/components/node';
import DataflowCanvas from '@/components/dataflow-canvas/dataflow-canvas';
import store from '@/store';

/**
 * @fileOverview Algorithm to auto adjust flow diagram layout.
 */

const ALPHA_DECAY = .1;
const COLLIDE_ITERATIONS = 100;

/**
 * When the node size exceeds this number, pad the node with fake nodes for expulsion.
 */
const PADDING_THRESHOLD = 100;
const PADDING_NODE_SIZE = 5;

const FORCE_X_STRENGTH = .01;
const FORCE_Y_STRENGTH = .01;
const DEFAULT_CHARGE = -50;
const DEFAULT_MARGIN = 100;

/**
 * Number of padded coordinates on one dimension.
 */
const PADDING_COUNT = 2;

const AUTO_LAYOUT_TRANSITION_S = .5;

interface LayoutNode {
  id: string;
  // (x, y) and (ox, oy) are node center positions.
  x: number; // x/y set by d3 force
  y: number;
  ox: number; // original x/y position, used as d3 force accessor
  oy: number;
  size: number;
  dx?: number;
  dy?: number;
  fx?: number;
  fy?: number;
  width?: number;
  height?: number;
  baseNode?: LayoutNode;
}

interface LayoutLink {
  source: LayoutNode;
  target: LayoutNode;
  distance: number;
  strength: number;
}

// "from" and "to" are node top-left corner positions.
export interface AutoLayoutResult {
  [id: string]: { from: Point, to: Point };
}

interface AutoLayoutOptions {
  onComplete?: (result: AutoLayoutResult, transitionDone: boolean) => void;
  // If noNodeMoving is set, the nodes will not be moved but result with new positions will be returned.
  noNodeMoving?: boolean;
}

/**
 * Auto-adjusts flow diagram layout. Only the nodes in "movableNodes" will be adjusted.
 */
export const autoLayout = (state: DataflowState, movableNodes?: Node[], options?: AutoLayoutOptions) => {
  const onComplete = options && options.onComplete || undefined;
  const noNodeMoving = options && options.noNodeMoving || false;

  const nodeIndex: { [id: string]: number } = {}; // mapping from node id to its force index
  let indexCounter = 0;
  movableNodes = movableNodes || state.nodes;

  const movableNodeIds: Set<string> = new Set(movableNodes.map(node => node.id));
  const layoutNodes: LayoutNode[] = [];
  state.nodes.forEach(node => {
    const box = node.getBoundingBox();
    const center = node.getCenter();
    const layoutNode: LayoutNode = {
      id: node.id,
      x: center.x,
      y: center.y,
      ox: center.x,
      oy: center.y,
      width: box.width,
      height: box.height,
      size: Math.max(box.width, box.height) / 2,
    };
    if (!movableNodeIds.has(node.id)) {
      layoutNode.fx = center.x;
      layoutNode.fy = center.y;
    }
    layoutNodes.push(layoutNode);
    nodeIndex[node.id] = indexCounter++;

    /*
    // Pad repulsive nodes inside a large node area.
    // This is temporarily disabled as forceCollide works equally well.
    if (Math.max(box.width, box.height) > PADDING_THRESHOLD) {
      const deltaX = box.width / PADDING_COUNT;
      const deltaY = box.height / PADDING_COUNT;
      for (let dx = -box.width / 2; dx <= box.width / 2; dx += deltaX) {
        for (let dy = -box.height / 2; dy <= box.height / 2; dy += deltaY) {
          layoutNodes.push({
            id: node.id,
            baseNode: layoutNode,
            x: center.x + dx,
            y: center.y + dy,
            ox: center.x + dx,
            oy: center.y + dy,
            size: PADDING_NODE_SIZE,
            dx,
            dy,
          });
        }
        indexCounter++;
      }
    }
    */
  });
  const links: LayoutLink[] = [];
  for (const node of state.nodes) {
    for (const edge of node.getOutputEdges()) {
      const boxSource = edge.source.node.getBoundingBox();
      const boxTarget = edge.target.node.getBoundingBox();
      const centerSource = edge.source.node.getCenter();
      const centerTarget = edge.target.node.getCenter();
      const distance = new Victor(centerSource.x, centerSource.y)
        .subtract(new Victor(centerTarget.x, centerTarget.y)).length();
      const strength = 2 * Math.min(1, distance / 300);
      const desiredDistance = (Math.max(boxSource.width, boxSource.height) +
        Math.max(boxTarget.width, boxTarget.height)) / 2 + DEFAULT_MARGIN;
      links.push({
        source: layoutNodes[nodeIndex[edge.source.node.id]],
        target: layoutNodes[nodeIndex[edge.target.node.id]],
        distance: desiredDistance,
        strength,
      });
    }
  }

  const canvasHeight = (state.canvas as DataflowCanvas).getHeight();
  const force = forceSimulation(layoutNodes)
    .alphaDecay(ALPHA_DECAY)
    .force('x', forceX<LayoutNode>().x(node => node.ox)
      .strength(FORCE_X_STRENGTH))
    .force('y', forceY<LayoutNode>().y(node => node.oy)
      .strength(node =>
        // Prevent the nodes from moving vertically when they are too away
        // from the vertical center.
        Math.max(FORCE_Y_STRENGTH, Math.min(1, Math.abs(node.y - canvasHeight / 2) / canvasHeight)),
      ))
    .force('link', forceLink(links).distance(link => link.distance)) // .strength(link => link.strength)
    .force('charge', forceManyBody<LayoutNode>().strength(node => DEFAULT_CHARGE * (node.baseNode ? 3 : 1)))
    .force('collide', forceCollide<LayoutNode>().radius(node => node.size).iterations(COLLIDE_ITERATIONS));

  const alphaDiff = force.alpha() - force.alphaMin();
  force.on('tick', () => {
    const curAlphaDiff = force.alpha() - force.alphaMin();
    if (curAlphaDiff <= 0) {
      store.commit('modals/endProgress');
      const result = getAutoLayoutResult(layoutNodes);

      if (!noNodeMoving) {
        updateLayout(state, layoutNodes, () => {
          if (onComplete) {
            onComplete(result, true);
          }
        });
      } else {
        resetLayout(state, layoutNodes);
      }

      if (onComplete) {
        onComplete(result, noNodeMoving || false);
      }
    }
    updateFixedPoints(layoutNodes);
    store.commit('modals/setProgressPercentage', (1 - curAlphaDiff / alphaDiff) * 100);
  });
  store.commit('modals/startProgress', 'Computing layout');
  force.restart();
};

/**
 * Collects the layout changes. The result includes all nodes even if the nodes are not moved.
 * "from" and "to" positions are given as the top-left corner of nodes.
 */
const getAutoLayoutResult = (layoutNodes: LayoutNode[]): AutoLayoutResult => {
  const result: AutoLayoutResult = {};
  for (const layoutNode of layoutNodes) {
    if (layoutNode.baseNode) {
      continue;
    }
    const width = layoutNode.width as number;
    const height = layoutNode.height as number;
    result[layoutNode.id] = {
      from: { x: layoutNode.ox - width / 2, y: layoutNode.oy - height / 2 },
      to: { x: layoutNode.x - width / 2, y: layoutNode.y - height / 2 },
    };
  }
  return result;
};

/**
 * Updates the coordinates of the fixed points, relative to their anchor points.
 */
const updateFixedPoints = (layoutNodes: LayoutNode[]) => {
  for (const layoutNode of layoutNodes) {
    if (layoutNode.baseNode) {
      layoutNode.x = layoutNode.baseNode.x + (layoutNode.dx as number);
      layoutNode.y = layoutNode.baseNode.y + (layoutNode.dy as number);
    }
  }
};

/**
 * Resets the layout as it was before the auto layout.
 * This is called when options.noNodeMoving is set on autoLayout().
 */
const resetLayout = (state: DataflowState, layoutNodes: LayoutNode[]) => {
  for (const layoutNode of layoutNodes) {
    if (layoutNode.baseNode) {
      continue; // skip fixed points padded
    }
    const node = state.nodes.find(dataflowNode => dataflowNode.id === layoutNode.id) as Node;
    node.moveTo(layoutNode.ox - (layoutNode.width as number) / 2,
      layoutNode.oy - (layoutNode.height as number) / 2);
  }
};

/**
 * Updates the nodes' positions with the computed layout.
 */
const updateLayout = (state: DataflowState, layoutNodes: LayoutNode[], onComplete: () => void) => {
  let movedCount = 0;
  const done = () => {
    if (--movedCount === 0) {
      onComplete();
    }
  };
  for (const layoutNode of layoutNodes) {
    if (layoutNode.baseNode) {
      continue; // skip fixed points padded
    }
    movedCount++;
    const node = state.nodes.find(dataflowNode => dataflowNode.id === layoutNode.id) as Node;
    node.moveToWithTransition(layoutNode.x - (layoutNode.width as number) / 2,
      layoutNode.y - (layoutNode.height as number) / 2,
      AUTO_LAYOUT_TRANSITION_S, done);
  }
};

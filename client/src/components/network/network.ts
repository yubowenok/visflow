import { Component, Watch } from 'vue-property-decorator';
import _ from 'lodash';
import { forceSimulation, Simulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { event as d3Event, select } from 'd3-selection';
import { line, curveBasis, curveLinearClosed } from 'd3-shape';
import { zoom, ZoomBehavior, zoomIdentity, zoomTransform } from 'd3-zoom';
import Victor from 'victor';

import template from './network.html';
import {
  drawBrushBox,
  getBrushBox,
  injectVisualizationTemplate,
  isPointInBox,
  multiplyVisuals,
  Visualization,
} from '@/components/visualization';
import ColumnSelect from '@/components/column-select/column-select';
import FormInput from '@/components/form-input/form-input';
import { VisualProperties } from '@/data/visuals';
import { SELECTED_COLOR } from '@/common/constants';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import { SubsetSelection } from '@/data/package';
import { getTransform, fadeOut, areSegmentsIntersected } from '@/common/util';
import TabularDataset from '@/data/tabular-dataset';
import { mirrorPoint } from '@/common/vector';
import { getColumnSelectOptions } from '@/data/util';
import * as history from './history';

// A mouse must move at least this distance to be considered a zoom.
const ZOOM_DISTANCE_THRESHOLD = 5;

const NODE_LABEL_SIZE_PX = 12;
const NODE_LABEL_X_OFFSET_PX = 10;
const NODE_LABEL_Y_OFFSET_PX = NODE_LABEL_SIZE_PX / 2;
const NODE_SIZE_PX = 6;

const EDGE_ARROW_LENGTH = 10;
const EDGE_CURVE_SHIFT = .1;

const FORCE_FRICTION = .25;

const ZOOM_EXTENT: [number, number] = [.01, 8];

const DEFAULT_NODE_VISUALS: VisualProperties = {
  color: '#555',
  border: 'black',
  width: 2,
  size: 5,
};

const DEFAULT_EDGE_VISUALS: VisualProperties = {
  width: 1.5,
  color: '#333',
};

const SELECTED_NODE_VISUALS: VisualProperties = {
  color: 'white',
  border: SELECTED_COLOR,
};

const SELECTED_EDGE_VISUALS: VisualProperties = {
  color: SELECTED_COLOR,
};

interface NetworkSave {
  nodeIdColumn: number | null;
  edgeSourceColumn: number | null;
  edgeTargetColumn: number | null;
  nodeLabelColumn: number | null;
  linkDistance: number;
  isNavigating: boolean;
  nodeSelection: number[];
  edgeSelection: number[];
  zoomScale: number;
  zoomTranslate: [number, number];

  lastNodeDatasetHash: string;
  lastEdgeDatasetHash: string;
}

interface NetworkNodeProps {
  index: number;
  label: string;
  visuals: VisualProperties;
  hasVisuals: boolean;
  selected: boolean;
  node: NetworkNode;
}

interface NetworkEdgeProps {
  index: number;
  visuals: VisualProperties;
  hasVisuals: boolean;
  selected: boolean;
  source: NetworkNode;
  target: NetworkNode;
}

interface NetworkNode {
  nodeIndex: number; // Note that "index" is reserved by d3.forceSimulation
  label: string;
  x: number;
  y: number;
}

interface NetworkEdge {
  edgeIndex: number; // Note that "index" is reserved by d3.forceLink
  source: NetworkNode;
  target: NetworkNode;
}


@Component({
  template: injectVisualizationTemplate(template),
  components: {
    ColumnSelect,
    FormInput,
  },
})
export default class Network extends Visualization {
  protected NODE_TYPE = 'network';

  private nodeIdColumn: number | null = null;
  private edgeSourceColumn: number | null = null;
  private edgeTargetColumn: number | null = null;
  private nodeLabelColumn: number | null = null;
  private linkDistance = 30;
  private isNavigating = true;

  private nodeSelection: SubsetSelection = new SubsetSelection();
  private edgeSelection: SubsetSelection = new SubsetSelection();

  // References to rendered node objects.
  private nodes: { [index: number]: NetworkNode } = {};
  // References to rendered edge objects.
  private edges: { [index: number]: NetworkEdge } = {};

  private nodeProps: NetworkNodeProps[] = [];
  private edgeProps: NetworkEdgeProps[] = [];
  private zoomScale: number = 1.;
  private zoomTranslate: [number, number] = [0, 0];
  private zoomBahavior: ZoomBehavior<Element, {}> | null = null;

  private nodeDataset: TabularDataset | null = null;
  private edgeDataset: TabularDataset | null = null;
  private lastNodeDatasetHash: string = '';
  private lastEdgeDatasetHash: string = '';

  private zoomStartPosition: Point = { x: 0, y: 0};

  private force: Simulation<NetworkNode, undefined> | null = null;
  private isFirstForce = true; // Used to avoid resetting transform on deserialization.

  get nodeColumnSelectOptions(): SelectOption[] {
    return getColumnSelectOptions(this.nodeDataset);
  }

  get edgeColumnSelectOptions(): SelectOption[] {
    return getColumnSelectOptions(this.edgeDataset);
  }

  public onKeys(keys: string) {
    if (keys === 'n') {
      this.toggleNavigating();
    }
    this.onKeysBase(keys);
  }

  public setNodeIdColumn(column: number) {
    this.nodeIdColumn = column;
    this.draw();
  }

  public setEdgeSourceColumn(column: number) {
    this.edgeSourceColumn = column;
    this.draw();
  }

  public setEdgeTargetColumn(column: number) {
    this.edgeTargetColumn = column;
    this.draw();
  }

  public setNodeLabelColumn(column: number) {
    this.nodeLabelColumn = column;
    this.draw();
  }

  public setLinkDistance(value: number) {
    this.linkDistance = value;
    this.draw();
  }

  public setNavigating(value: boolean) {
    this.isNavigating = value;
    this.draw();
  }

  /**
   * As a network node has two heterogeneous node and edge tables. We must check them separately.
   */
  protected checkDataset(): boolean {
    if (this.hasNoDataset()) {
      this.coverText = 'No Node/Edge Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.nodeDataset = this.inputPortMap.node.getSubsetPackage().getDataset() as TabularDataset;
    this.edgeDataset = this.inputPortMap.edge.getSubsetPackage().getDataset() as TabularDataset;
    // See subset-node-base.ts for a description of how to use dataset hashes.
    if (this.nodeDataset.getHash() !== this.lastNodeDatasetHash ||
      this.edgeDataset.getHash() !== this.lastEdgeDatasetHash) {
      this.lastNodeDatasetHash = this.nodeDataset.getHash();
      this.lastEdgeDatasetHash = this.edgeDataset.getHash();
      this.onDatasetChange();
    }
    this.coverText = '';
    return true;
  }

  protected hasNoDataset(): boolean {
    return !this.inputPortMap.node.isConnected() || !this.inputPortMap.node.getSubsetPackage().hasDataset() ||
      !this.inputPortMap.edge.isConnected() || !this.inputPortMap.edge.getSubsetPackage().hasDataset();
  }

  protected onDatasetChange() {
    // nothing
  }

  protected created() {
    this.serializationChain.push((): NetworkSave => ({
      nodeIdColumn: this.nodeIdColumn,
      edgeSourceColumn: this.edgeSourceColumn,
      edgeTargetColumn: this.edgeTargetColumn,
      nodeLabelColumn: this.nodeLabelColumn,
      linkDistance: this.linkDistance,
      isNavigating: this.isNavigating,
      nodeSelection: this.nodeSelection.serialize(),
      edgeSelection: this.edgeSelection.serialize(),
      zoomScale: this.zoomScale,
      zoomTranslate: this.zoomTranslate,

      lastNodeDatasetHash: this.lastNodeDatasetHash,
      lastEdgeDatasetHash: this.lastEdgeDatasetHash,
    }));

    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as NetworkSave;
      this.nodeSelection = new SubsetSelection(save.nodeSelection);
      this.edgeSelection = new SubsetSelection(save.edgeSelection);
      this.applyZoomTransform();
    });
  }

  /**
   * Creates zoom handler on mounted.
   */
  protected onMounted() {
    const svg = select<Element, {}>(this.$refs.svg as SVGSVGElement);
    const z = zoom()
      .scaleExtent(ZOOM_EXTENT)
      .on('start', this.onZoomStart) // Zoom will block mouse event. This avoids option panel getting stuck.
      .on('zoom', this.onZoom)
      .on('end', this.onZoomEnd)
      .filter(() => this.isNavigating);
    this.zoomBahavior = z;
    svg.call(z);
    this.setZoomTransform(); // Set the saved zoom transform to zoomBehavior
  }

  protected createInputPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'node',
          node: this,
        },
        store: this.$store,
      }),
      new SubsetInputPort({
        data: {
          id: 'edge',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected createOutputPorts() {
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'nodeSelection',
          node: this,
          isSelection: true,
        },
        store: this.$store,
      }),
      new SubsetOutputPort({
        data: {
          id: 'node',
          node: this,
        },
        store: this.$store,
      }),
      new SubsetOutputPort({
        data: {
          id: 'edgeSelection',
          node: this,
          isSelection: true,
        },
        store: this.$store,
      }),
      new SubsetOutputPort({
        data: {
          id: 'edge',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected draw() {
    if (this.nodeIdColumn === null || this.edgeSourceColumn === null || this.edgeTargetColumn === null) {
      this.coverText = 'Please select node/edge columns';
      return;
    }
    this.coverText = '';
    this.processNetwork();
    this.computeProps();
    this.drawNetwork();
    this.startForce();
    this.moveSelectedNodesAndEdgesToFront();
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.computeProps();
      this.drawNetwork();
      this.propagateSelection();
    }
    drawBrushBox(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  protected updateNoDatasetOutput() {
    this.outputPortMap.node.clear();
    this.outputPortMap.nodeSelection.clear();
    this.outputPortMap.edge.clear();
    this.outputPortMap.edgeSelection.clear();
  }

  protected computeForwarding() {
    this.forwardSubset(this.inputPortMap.node, this.outputPortMap.node);
    this.forwardSubset(this.inputPortMap.edge, this.outputPortMap.edge);
  }

  protected propagateSelection() {
    this.portUpdated(this.outputPortMap.nodeSelection);
    this.portUpdated(this.outputPortMap.edgeSelection);
  }

  protected computeSelection() {
    const nodePkg = this.inputPortMap.node.getSubsetPackage();
    this.outputPortMap.nodeSelection.updatePackage(nodePkg.subset(this.nodeSelection.getItems()));
    const edgePkg = this.inputPortMap.edge.getSubsetPackage();
    this.outputPortMap.edgeSelection.updatePackage(edgePkg.subset(this.edgeSelection.getItems()));
  }

  protected selectAll() {
    if (this.hasNoDataset()) {
      return;
    }
    const nodes = this.inputPortMap.node.getSubsetPackage().getItemIndices();
    this.nodeSelection.addItems(nodes);
    const edges = this.inputPortMap.edge.getSubsetPackage().getItemIndices();
    this.edgeSelection.addItems(edges);
    this.draw();
    this.computeSelection();
    this.propagateSelection();
  }

  protected deselectAll() {
    if (this.hasNoDataset()) {
      return;
    }
    this.nodeSelection.clear();
    this.edgeSelection.clear();
    this.draw();
    this.computeSelection();
    this.propagateSelection();
  }

  protected isSelectionEmpty(): boolean {
    return !this.nodeSelection.numItems() && !this.edgeSelection.numItems();
  }

  protected isDraggable(evt: MouseEvent, ui?: JQueryUI.DraggableEventUIParams) {
    if (this.isContentVisible && this.isNavigating) {
      return false; // If the network is in navigation mode, then node drag is disabled.
    }
    return this.isDraggableBase(evt);
  }

  protected isBrushable(): boolean {
    return !this.isNavigating;
  }

  protected onResize() {
    if (!this.hasNoDataset() && !this.isAnimating && this.isExpanded) {
      console.log('render', this.NODE_TYPE);
      // Do not call draw() which would restart force and reset transform.
      this.drawNetwork();
    }
  }

  protected onEnlargeClose() {
    this.draw();
  }

  private processNetwork() {
    this.validateNetwork();
    this.processNodes();
    this.processEdges();
  }

  private validateNetwork() {
    const newNodes: Set<number> = new Set(this.inputPortMap.node.getSubsetPackage().getItemIndices());
    const deletedNodes: Set<number> = new Set();
    for (const index in this.nodes) {
      if (!newNodes.has(+index)) {
        deletedNodes.add(+index);
        delete this.nodes[index];
      }
    }
    const newEdges: Set<number> = new Set(this.inputPortMap.edge.getSubsetPackage().getItemIndices());
    for (const index in this.edges) {
      if (!newEdges.has(+index) ||
      deletedNodes.has(this.edges[index].source.nodeIndex) || deletedNodes.has(this.edges[index].target.nodeIndex)) {
        delete this.edges[index];
      }
    }
  }

  private processNodes() {
    // Eliminate randomness in initial layout.
    function* rand(): IterableIterator<number> {
      let randValue = 3;
      while (true) {
        randValue = randValue * 997 + 317;
        randValue %= 1003;
        yield randValue;
      }
    }
    const coordinate = rand();
    const nodeDataset = this.getNodeDataset();
    const pkg = this.inputPortMap.node.getSubsetPackage();
    pkg.getItemIndices().forEach(nodeIndex => {
      const hasNode = nodeIndex in this.nodes;
      this.nodes[nodeIndex] = {
        nodeIndex,
        label: this.nodeLabelColumn !== null ? nodeDataset.getCell(nodeIndex, this.nodeLabelColumn).toString() : '',
        x: !hasNode ? coordinate.next().value % this.svgWidth : this.nodes[nodeIndex].x,
        y: !hasNode ? coordinate.next().value % this.svgHeight : this.nodes[nodeIndex].y,
      };
    });
  }

  private processEdges() {
    const nodeIdToIndex: { [id: string]: number } = {};
    const nodeDataset = this.getNodeDataset();
    _.each(this.nodes, node => {
      const id = nodeDataset.getCell(node.nodeIndex, this.nodeIdColumn as number).toString();
      nodeIdToIndex[id] = node.nodeIndex;
    });
    const pkg = this.inputPortMap.edge.getSubsetPackage();
    const edgeDataset = this.getEdgeDataset();
    pkg.getItemIndices().forEach(edgeIndex => {
      const sourceId = edgeDataset.getCell(edgeIndex, this.edgeSourceColumn as number);
      const targetId = edgeDataset.getCell(edgeIndex, this.edgeTargetColumn as number);
      const sourceIndex = nodeIdToIndex[sourceId];
      const targetIndex = nodeIdToIndex[targetId];

      if (sourceIndex === undefined || targetIndex === undefined ||
        sourceIndex === targetIndex) {
        // The edge has undefined nodes, or it is self-loop, ignore.
        // TODO: display a warning in the option panel.
        delete this.edges[edgeIndex];
        return;
      }
      this.edges[edgeIndex] = {
        edgeIndex,
        source: this.nodes[sourceIndex],
        target: this.nodes[targetIndex],
      };
    });
  }

  private computeProps() {
    this.computeNodeProps();
    this.computeEdgeProps();
  }

  private computeNodeProps() {
    const pkg = this.inputPortMap.node.getSubsetPackage();
    const dataset = this.getNodeDataset();
    this.nodeProps = _.toArray(this.nodes).map(node => {
      const index = node.nodeIndex;
      const visuals = pkg.getItem(index).visuals;
      const props: NetworkNodeProps = {
        index,
        label: this.nodeLabelColumn !== null ? dataset.getCell(index, this.nodeLabelColumn).toString() : '',
        hasVisuals: !_.isEmpty(visuals),
        visuals: _.extend({}, DEFAULT_NODE_VISUALS, visuals),
        selected: this.nodeSelection.hasItem(index),
        node,
      };
      if (props.selected) {
        _.extend(props.visuals, SELECTED_NODE_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
  }

  private computeEdgeProps() {
    const pkg = this.inputPortMap.edge.getSubsetPackage();
    this.edgeProps = _.toArray(this.edges).map(edge => {
      const index = edge.edgeIndex;
      const visuals = pkg.getItem(index).visuals;
      const props: NetworkEdgeProps = {
        index,
        hasVisuals: !_.isEmpty(visuals),
        visuals: _.extend({}, DEFAULT_EDGE_VISUALS, visuals),
        selected: this.edgeSelection.hasItem(index),
        source: edge.source,
        target: edge.target,
      };
      if (props.selected) {
        _.extend(props.visuals, SELECTED_EDGE_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
  }

  /**
   * Network uses two-stage drawing. First stage is "append" that creates the elements on the canvas. The second stage
   * is "update" that sets the elements' properties. When forced, we call "update" methods.
   */
  private drawNetwork() {
    this.appendNodes();
    this.appendEdges();
    this.appendNodeLabels();
    this.updateNetwork();
  }

  private appendNodes() {
    const nodes = select(this.$refs.nodes as SVGGElement).selectAll<SVGCircleElement, NetworkNodeProps>('circle')
      .data(this.nodeProps, d => d.index.toString());
    nodes.enter().append('circle');
    fadeOut(nodes.exit());
  }

  private appendEdges() {
    const edges = select(this.$refs.edges as SVGGElement).selectAll<SVGGElement, NetworkEdgeProps>('g')
      .data(this.edgeProps, d => d.index.toString());
    const enteredEdges = edges.enter().append('g');
    enteredEdges.append('path').classed('edge', true);
    enteredEdges.append('path').classed('arrow', true);
    fadeOut(edges.exit());
  }

  private appendNodeLabels() {
    if (this.nodeLabelColumn === null) {
      fadeOut(select(this.$refs.nodeLabels as SVGGElement).selectAll('*'));
      return;
    }
    const labels = select(this.$refs.nodeLabels as SVGGElement).selectAll<SVGTextElement, NetworkNodeProps>('text')
      .data(this.nodeProps, d => d.index.toString());
    labels.enter().append('text');
    fadeOut(labels.exit());
  }

  private updateNetwork() {
    this.updateNodes();
    this.updateEdges();
    this.updateNodeLabels();
  }

  private updateNodes() {
    const nodes = select(this.$refs.nodes as SVGGElement).selectAll<SVGCircleElement, NetworkNodeProps>('circle');
    nodes
      .attr('has-visuals', d => d.hasVisuals)
      .attr('selected', d => d.selected)
      .attr('transform', d => getTransform([d.node.x, d.node.y]))
      .attr('r', d => (d.visuals.size as number) / this.zoomScale)
      .style('stroke', d => d.visuals.border as string)
      .style('stroke-width', d => (d.visuals.width as number) / this.zoomScale + 'px')
      .style('fill', d => d.visuals.color as string)
      .style('opacity', d => d.visuals.opacity as number);
  }

  private updateEdges() {
    const edges = select(this.$refs.edges as SVGGElement).selectAll<SVGGElement, NetworkEdgeProps>('g')
      .attr('has-visuals', d => d.hasVisuals)
      .attr('selected', d => d.selected);

    // Creates a shifted point around the middle of the edge to be the control
    // point of the edge's curve.
    const getShiftPoint = (p: Victor, q: Victor): Victor => {
      const m = p.clone().add(q).multiplyScalar(.5);
      let d = p.clone().subtract(q);
      d = new Victor(-d.y, d.x).normalize().multiplyScalar(d.length() * EDGE_CURVE_SHIFT);
      return m.add(d);
    };

    // Creates a stroke that looks like an arrow.
    const getArrowPoints = (p: Victor, q: Victor): Victor[] => {
      const m = getShiftPoint(p, q);
      const ds = p.clone().subtract(q).normalize();
      const dm = m.clone().subtract(q).normalize();
      const p1 = q.clone().add(dm.multiplyScalar(NODE_SIZE_PX / this.zoomScale));
      const p2 = p1.clone().add(ds.multiplyScalar(EDGE_ARROW_LENGTH / this.zoomScale));
      const p3 = mirrorPoint(p2, p1, m);
      return [p1, p2, p3];
    };

    const dCurve = line<Victor>().curve(curveBasis).x(d => d.x).y(d => d.y);
    edges.select<SVGPathElement>('path.edge')
      .style('stroke', d => d.visuals.color as string)
      .style('stroke-width', d => (d.visuals.width as number) / this.zoomScale + 'px')
      .style('opacity', d => d.visuals.opacity as number)
      .attr('d', d => {
        const s = new Victor(d.source.x, d.source.y);
        const t = new Victor(d.target.x, d.target.y);
        return dCurve([s, getShiftPoint(s, t), t]);
      });

    const dLine = line<Victor>().curve(curveLinearClosed).x(d => d.x).y(d => d.y);
    edges.select<SVGPathElement>('path.arrow')
      .style('stroke', d => d.visuals.color as string)
      .style('stroke-width', d => (d.visuals.width as number) / this.zoomScale + 'px')
      .style('fill', d => d.visuals.color as string)
      .style('opacity', d => d.visuals.opacity as number)
      .attr('d', d => dLine(getArrowPoints(new Victor(d.source.x, d.source.y), new Victor(d.target.x, d.target.y))));
  }

  private updateNodeLabels() {
    if (this.nodeLabelColumn === null) {
      return;
    }
    const labels = select(this.$refs.nodeLabels as SVGGElement).selectAll<SVGTextElement, NetworkNodeProps>('text');
    labels
      .text(d => d.label)
      .style('font-size', () => NODE_LABEL_SIZE_PX / this.zoomScale)
      .attr('transform', d => getTransform([
        d.node.x + NODE_LABEL_X_OFFSET_PX / this.zoomScale,
        d.node.y + NODE_LABEL_Y_OFFSET_PX / this.zoomScale,
      ]));
  }

  private startForce() {
    if (this.force) {
      this.force.stop();
    }
    if (!this.isFirstForce) {
      this.resetTransform();
    }
    this.isFirstForce = false;

    this.force = forceSimulation(_.toArray(this.nodes))
      .force('link', forceLink(_.toArray(this.edges)).distance(this.linkDistance))
      .force('charge', forceManyBody())
      .force('center', forceCenter(this.svgWidth / 2, this.svgHeight / 2))
      .velocityDecay(FORCE_FRICTION)
      .on('tick', this.updateNetwork);

    this.force.restart();
  }

  private onZoomStart() {
    if (!this.isNavigating || !d3Event.sourceEvent) {
      return;
    }
    this.zoomStartPosition = {
      x: d3Event.sourceEvent.pageX,
      y: d3Event.sourceEvent.pageY,
    };
  }

  private onZoom() {
    if (!this.isNavigating) {
      return;
    }
    const transform: { x: number, y: number, k: number } = d3Event.transform;
    const translate: [number, number] = [transform.x, transform.y];
    const scale = transform.k;
    this.zoomScale = scale;
    this.zoomTranslate = translate;
    this.applyZoomTransform();

    // Update the network the scale stroke width and text size proportionally.
    this.updateNetwork();
  }

  private onZoomEnd() {
    if (!this.isNavigating || !d3Event.sourceEvent) {
      return;
    }
    const [x, y] = [d3Event.sourceEvent.pageX, d3Event.sourceEvent.pageY];
    const distance = Math.abs(x - this.zoomStartPosition.x) + Math.abs(y - this.zoomStartPosition.y);
    if (distance < ZOOM_DISTANCE_THRESHOLD) {
      // If the user clicks the node, it is not a valid zoom and we call the click handler to respond to
      // node selection correctly.
      this.onClick();
    } else {
      this.select(); // Regardless, zooming always selects the node.
    }
  }

  private computeBrushedItems(brushPoints: Point[]) {
    if (!this.isShiftPressed || !brushPoints.length) {
      this.nodeSelection.clear();
      this.edgeSelection.clear();
      if (!brushPoints.length) {
        return;
      }
    }
    // Applies the current zoom transform to a cooridnate.
    const applyTransform = (x: number, y: number): Point => {
      return {
        x: x * this.zoomScale + this.zoomTranslate[0],
        y: y * this.zoomScale + this.zoomTranslate[1],
      };
    };

    const box = getBrushBox(brushPoints);
    _.each(this.nodes, node => {
      if (isPointInBox(applyTransform(node.x, node.y), box)) {
        this.nodeSelection.addItem(node.nodeIndex);
      }
    });
    const boxPoints = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height},
      { x: box.x, y: box.y + box.height},
    ];
    // Check box intersecting with straight line segment.
    // Note: curve is drawn slightly curved but intersection check does not consider curves.
    _.each(this.edges, edge => {
      const p = applyTransform(edge.source.x, edge.source.y);
      const q = applyTransform(edge.target.x, edge.target.y);
      for (let i = 0; i < 4; i++) {
        if (areSegmentsIntersected(p, q, boxPoints[i], boxPoints[(i + 1) % 4])) {
          this.edgeSelection.addItem(edge.edgeIndex);
          return;
        }
      }
    });
  }

  private moveSelectedNodesAndEdgesToFront() {
    const $nodes = $(this.$refs.nodes as SVGGElement);
    $nodes.children('circle[has-visuals=true]').appendTo(this.$refs.nodes as SVGGElement);
    $nodes.children('circle[selected=true]').appendTo(this.$refs.nodes as SVGGElement);
    const $edges = $(this.$refs.edges as SVGGElement);
    $edges.children('g[has-visuals=true]').appendTo(this.$refs.edges as SVGGElement);
    $edges.children('g[selected=true]').appendTo(this.$refs.edges as SVGGElement);
  }

  private getNodeDataset(): TabularDataset {
    return this.nodeDataset as TabularDataset;
  }

  private getEdgeDataset(): TabularDataset {
    return this.edgeDataset as TabularDataset;
  }

  private toggleNavigating() {
    this.isNavigating = !this.isNavigating;
  }

  /**
   * Applies the current zoom transform.
   */
  private setZoomTransform() {
    if (!this.zoomBahavior) {
      return;
    }
    select<Element, {}>(this.$refs.svg as SVGSVGElement)
      .call(this.zoomBahavior.transform,
        zoomIdentity.translate(this.zoomTranslate[0], this.zoomTranslate[1]).scale(this.zoomScale));
  }


  /**
   * Applies the zoom transform on all child render groups (nodes, edges, node labels).
   */
  private applyZoomTransform() {
    select(this.$refs.svg as SVGSVGElement).selectAll('.zoom-group')
      .attr('transform', getTransform(this.zoomTranslate, this.zoomScale));
  }

  private resetTransform() {
    this.zoomScale = 1;
    this.zoomTranslate = [0, 0];
    this.setZoomTransform();
    this.applyZoomTransform();
  }

  @Watch('isNavigating')
  private onNavigatingChange() {
    if (this.isNavigating) {
      this.setZoomTransform();
    }
  }

  private onInputNodeIdColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectNodeIdColumnEvent(this, column, prevColumn));
    this.draw();
  }

  private onInputEdgeSourceColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectEdgeSourceColumnEvent(this, column, prevColumn));
    this.draw();
  }

  private onInputEdgeTargetColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectEdgeTargetColumnEvent(this, column, prevColumn));
    this.draw();
  }

  private onInputNodeLabelColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectNodeLabelColumn(this, column, prevColumn));
    this.computeProps();
    this.drawNetwork();
  }

  private onInputLinkDistance(value: number, prevValue: number) {
    this.commitHistory(history.inputLinkDistanceEvent(this, value, prevValue));
    this.draw();
  }

  private onChangeLinkDistance(value: number, prevValue: number) {
    this.commitHistory(history.inputLinkDistanceEvent(this, value, prevValue));
    this.linkDistance = value;
    this.draw();
  }

  private onToggleNavigating(value: boolean) {
    this.commitHistory(history.toggleNavigating(this, value));
  }
}

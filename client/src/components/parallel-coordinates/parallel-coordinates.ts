import { Component } from 'vue-property-decorator';
import { select, Selection } from 'd3-selection';
import { axisLeft } from 'd3-axis';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import _ from 'lodash';
import $ from 'jquery';

import ColumnList from '@/components/column-list/column-list';
import template from './parallel-coordinates.html';
import {
  DEFAULT_PLOT_MARGINS,
  drawBrushLasso,
  getScale,
  injectVisualizationTemplate,
  LABEL_OFFSET_PX,
  multiplyVisuals,
  PlotMargins,
  Scale,
  Visualization,
  AnyScale,
} from '@/components/visualization';
import { fadeOut, getTransform, areSegmentsIntersected } from '@/common/util';
import { SELECTED_COLOR } from '@/common/constants';
import { VisualProperties } from '@/data/visuals';
import { isContinuousDomain } from '@/data/util';
import * as history from './history';

const DEFAULT_NUM_COLUMNS = 6;
const ORDINAL_DOMAIN_LENGTH_THRESHOLD = 10;

interface ParallelCoordinatesSave {
  columns: number[];
  areTicksVisible: boolean;
  areAxesLabelsVisible: boolean;
  axisMargin: boolean;
  useDatasetRange: boolean;
}

interface ParallelCoordinatesItemProps {
  index: number;
  values: Array<number | string>;
  hasVisuals: boolean;
  selected: boolean;
  visuals: VisualProperties;
}

const DEFAULT_ITEM_VISUALS: VisualProperties = {
  color: 'black',
  width: 1.5,
  border: 'none',
  opacity: .15,
};

const SELECTED_ITEM_VISUALS: VisualProperties = {
  color: SELECTED_COLOR,
  opacity: .75,
};

@Component({
  template: injectVisualizationTemplate(template),
  components: {
    ColumnList,
  },
})
export default class ParallelCoordinates extends Visualization {
  protected NODE_TYPE = 'parallel-coordinates';
  protected DEFAULT_WIDTH = 450;
  protected DEFAULT_HEIGHT = 250;

  private columns: number[] = [];
  private xScale!: Scale;
  private yScales!: Scale[];
  private margins: PlotMargins = { ...DEFAULT_PLOT_MARGINS, left: 30, bottom: 20 };
  private areTicksVisible = true;
  private areAxesLabelsVisible = true;
  private axisMargin = true;
  private useDatasetRange = false;

  public setColumns(columns: number[]) {
    this.columns = columns;
    this.draw();
  }

  public setUseDatasetRange(value: boolean) {
    this.useDatasetRange = value;
    this.draw();
  }

  public setAxisMargin(value: boolean) {
    this.axisMargin = value;
    this.draw();
  }

  public applyColumns(columns: number[]) {
    columns = _.uniq(columns);
    if (!columns.length) {
      this.findDefaultColumns();
    } else {
      this.columns = columns;
    }
    if (this.hasDataset()) {
      this.draw();
    }
  }

  protected created() {
    this.serializationChain.push((): ParallelCoordinatesSave => ({
      columns: this.columns,
      areTicksVisible: this.areTicksVisible,
      areAxesLabelsVisible: this.areAxesLabelsVisible,
      axisMargin: this.axisMargin,
      useDatasetRange: this.useDatasetRange,
    }));
  }

  protected draw() {
    if (!this.columns.length) {
      this.coverText = 'Please choose columns';
      return;
    }
    this.coverText = '';
    this.computeScales();
    this.updateLeftMargin();
    const itemProps = this.getItemProps();
    this.drawLines(itemProps);
    this.drawAxes();
  }

  protected findDefaultColumns() {
    if (!this.hasDataset()) {
      return;
    }
    const dataset = this.getDataset();
    this.columns = dataset.getColumns()
      .filter(column => {
        return isContinuousDomain(column.type) ||
          dataset.getDomain(column.index).length <= ORDINAL_DOMAIN_LENGTH_THRESHOLD;
      })
      .slice(0, DEFAULT_NUM_COLUMNS)
      .map(column => column.index);
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.drawLines(this.getItemProps());
      this.propagateSelection();
    }
    drawBrushLasso(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  private computeBrushedItems(brushPoints: Point[]) {
    if (!brushPoints.length) {
      return;
    }
    const [start, end] = [_.first(brushPoints), _.last(brushPoints)] as [Point, Point];
    if (start.x === end.x && start.y === end.y) {
      return;
    }
    if (!this.isShiftPressed) {
      this.selection.clear();
    }
    const dataset = this.getDataset();
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    for (const itemIndex of items) {
      if (this.selection.hasItem(itemIndex)) {
        continue;
      }
      const points: Point[] = dataset.rowOnSubColumns(itemIndex, this.columns, { forScale: true })
        .map((value, axisIndex) => ({ x: this.xScale(axisIndex), y: this.yScales[axisIndex](value) }));
      let hit = false;
      for (let axisIndex = 0; axisIndex < this.columns.length - 1 && !hit; axisIndex++) {
        for (let i = 0; i < brushPoints.length - 1 && !hit; i++) {
          if (areSegmentsIntersected(points[axisIndex], points[axisIndex + 1], brushPoints[i], brushPoints[i + 1])) {
            hit = true;
            this.selection.addItem(itemIndex);
          }
        }
      }
    }
  }

  private computeScales() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const yRange = [this.svgHeight - this.margins.bottom, this.margins.top];
    const dataset = this.getDataset();
    this.yScales = this.columns.map(columnIndex => {
      return getScale(
        dataset.getColumnType(columnIndex),
        dataset.getDomain(columnIndex, this.useDatasetRange ? undefined : pkg.getItemIndices()),
        yRange,
        { domainMargin: this.axisMargin ? undefined : 0 },
      );
    });

    this.xScale = scaleLinear()
      .domain([0, this.columns.length - 1])
      .range([this.margins.left, this.svgWidth - this.margins.right]) as Scale;
    this.updateLeftMargin();
  }

  private updateLeftMargin() {
    if (!this.columns.length) {
      this.margins.left = DEFAULT_PLOT_MARGINS.left;
      (this.xScale as AnyScale).range([this.margins.left, this.svgWidth - this.margins.right]);
      return;
    }
    // Axes are drawn with transition, which would affect the width computation.
    this.isTransitionDisabled = true;
    this.drawAxis(0, this.columns[0]);
    this.updateMargins(() => {
      const maxTickWidth = _.max($(this.$refs.axes as SVGGElement)
        .find(`#axis-${this.columns[0]} > .tick > text, #axis-${this.columns[0]} > .label`)
        .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
      this.margins.left = DEFAULT_PLOT_MARGINS.left + maxTickWidth;
      (this.xScale as AnyScale).range([this.margins.left, this.svgWidth - this.margins.right]);
      this.isTransitionDisabled = false;
    });
  }

  private getItemProps(): ParallelCoordinatesItemProps[] {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const items = pkg.getItems();
    const itemProps: ParallelCoordinatesItemProps[] = items.map(item => {
      const props: ParallelCoordinatesItemProps = {
        index: item.index,
        values: this.getDataset().rowOnSubColumns(item.index, this.columns, { forScale: true }),
        visuals: _.extend({}, DEFAULT_ITEM_VISUALS, item.visuals),
        hasVisuals: !_.isEmpty(item.visuals),
        selected: this.selection.hasItem(item.index),
      };
      if (this.selection.hasItem(item.index)) {
        _.extend(props.visuals, SELECTED_ITEM_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
    return itemProps;
  }

  private drawLines(itemProps: ParallelCoordinatesItemProps[]) {
    const l = line<number | string>()
      .x((p, axisIndex) => this.xScale(axisIndex))
      .y((p, axisIndex) => this.yScales[axisIndex](p));
    let lines = select(this.$refs.lines as SVGGElement).selectAll<SVGPathElement, ParallelCoordinatesItemProps>('path')
      .data(itemProps, d => d.index.toString());

    fadeOut(lines.exit());

    lines = lines.enter().append<SVGPathElement>('path')
      .attr('id', d => d.index.toString())
      .merge(lines)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('is-selected', d => d.selected);

    const updatedLines = this.isTransitionFeasible(itemProps.length) ? lines.transition() : lines;
    updatedLines
      .attr('d', d => l(d.values))
      .style('stroke', d => d.visuals.color as string)
      .style('stroke-width', d => d.visuals.width + 'px')
      .style('opacity', d => d.visuals.opacity as number);

    this.moveSelectedLinesToFront();
  }

  private moveSelectedLinesToFront() {
    const gLines = this.$refs.lines as SVGGElement;
    const $lines = $(gLines);
    $lines.children('path[has-visuals=true]').appendTo(gLines);
    $lines.children('path[is-selected=true]').appendTo(gLines);
  }

  private drawAxes() {
    const exitAxes = select(this.$refs.axes as SVGGElement).selectAll<SVGGElement, number>('g.axis')
      .data(this.columns, columnIndex => columnIndex.toString())
      .exit();
    fadeOut(exitAxes);
    this.columns.forEach((columnIndex, axisIndex) => {
      this.drawAxis(axisIndex, columnIndex);
    });
  }

  private drawAxis(axisIndex: number, columnIndex: number) {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const yScale = this.yScales[axisIndex];
    const id = 'axis-' + columnIndex.toString();
    const axis = axisLeft(yScale)
      .tickValues(this.areTicksVisible && pkg.numItems() ? yScale.domain() : []);
    const svgAxes: Selection<SVGGElement, string, null, undefined> = select(this.$refs.axes as SVGGElement);
    let g = svgAxes.select<SVGGElement>('#' + id);
    const gTransform = getTransform([this.xScale(axisIndex), 0]);
    if (g.empty()) {
      g = svgAxes.append<SVGGElement>('g').datum(columnIndex.toString())
        .attr('id', id)
        .classed('axis', true)
        .attr('transform', gTransform);
    }
    g.call(axis);
    // Axes transition does not depend on the number of data items.
    const updatedG = this.isTransitionFeasible(0) ? g.transition() : g;
    updatedG
      .style('opacity', 1)
      .attr('transform', gTransform);

    if (this.areAxesLabelsVisible) {
      let label = g.select<SVGTextElement>('.label');
      const labelTransform = getTransform([0, this.svgHeight - LABEL_OFFSET_PX]);
      if (label.empty()) {
        label = g.append('text')
          .classed('label', true)
          .attr('transform', labelTransform);
      }
      const updatedLabel = this.isTransitionFeasible(0) ? label.transition() : label;
      updatedLabel
        .style('opacity', 1)
        .attr('transform', labelTransform)
        .text(this.getDataset().getColumnName(columnIndex));
    } else {
      fadeOut(g.select('.label'));
    }
  }

  private onSelectColumns(columns: number[], prevColumns: number[]) {
    this.commitHistory(history.selectColumnsEvent(this, columns, prevColumns));
    this.setColumns(columns);
  }

  private onToggleAxisMargin(value: boolean) {
    this.commitHistory(history.toggleAxisMarginEvent(this, value));
    this.setAxisMargin(value);
  }

  private onToggleUseDatasetRange(value: boolean) {
    this.commitHistory(history.toggleUseDatasetRangeEvent(this, value));
    this.setUseDatasetRange(value);
  }
}

import { Component } from 'vue-property-decorator';
import { select } from 'd3-selection';
import { line, curveBasis } from 'd3-shape';
import _ from 'lodash';
import $ from 'jquery';

import template from './line-chart.html';
import {
  DEFAULT_PLOT_MARGINS,
  drawBrushBox,
  getScale,
  injectVisualizationTemplate,
  PlotMargins,
  Scale,
  Visualization,
  drawAxis,
  multiplyVisuals,
  AnyScale,
  getBrushBox,
  isPointInBox,
} from '@/components/visualization';
import ColumnSelect from '@/components/column-select/column-select';
import { VisualProperties } from '@/data/visuals';
import { SELECTED_COLOR, INDEX_COLUMN } from '@/common/constants';
import { getColumnSelectOptions, valueComparator } from '@/data/util';
import { getTransform, fadeOut } from '@/common/util';
import * as history from './history';

const DOMAIN_MARGIN = .1;
const LABEL_OFFSET_PX = 5;
const LEGEND_X_OFFSET_PX = 10;
const LEGEND_Y_OFFSET_PX = 15;
const LEGEND_LABEL_X_OFFSET_PX = 15;
const LEGEND_LABEL_Y_OFFSET_PX = 10;

const DEFAULT_ITEM_VISUALS: VisualProperties = {
  color: '#333',
  border: 'black',
  size: 3,
  width: 1.5,
  opacity: 1,
};

const SELECTED_ITEM_VISUALS: VisualProperties = {
  color: 'white',
  border: SELECTED_COLOR,
};

const SELECTED_LINE_VISUALS: VisualProperties = {
  color: SELECTED_COLOR,
  width: 2,
};

interface LineChartSave {
  seriesColumn: number | null;
  valueColumn: number | null;
  groupByColumn: number | null;
  arePointsVisible: boolean;
  isCurveDrawing: boolean;
  areLegendsVisible: boolean;
  areXAxisTicksVisible: boolean;
  areYAxisTicksVisible: boolean;
}

interface LineChartLineProps {
  lineIndex: number;
  itemIndices: number[];
  points: Array<[number | string, number | string]>;
  visuals: VisualProperties;
  hasVisuals: boolean;
  selected: boolean;
  label: string;
}

interface LineChartItemProps {
  index: number;
  x: number | string;
  y: number | string;
  hasVisuals: boolean;
  visuals: VisualProperties;
  selected: boolean;
}


@Component({
  template: injectVisualizationTemplate(template),
  components: {
    ColumnSelect,
  },
})
export default class LineChart extends Visualization {
  protected NODE_TYPE = 'line-chart';
  protected DEFAULT_WIDTH = 400;
  protected DEFAULT_HEIGHT = 250;

  private seriesColumn: number | null = null;
  private valueColumn: number | null = null;
  private groupByColumn: number | null = null;
  private arePointsVisible = false;
  private isCurveDrawing = false;
  private areLegendsVisible = true;
  private areXAxisTicksVisible = true;
  private areYAxisTicksVisible = true;

  private areSeriesValuesDuplicated = false;

  private margins: PlotMargins = _.extend({}, DEFAULT_PLOT_MARGINS, { bottom: 25 });

  private xScale!: Scale;
  private yScale!: Scale;

  private itemProps: LineChartItemProps[] = [];
  private lineProps: LineChartLineProps[] = [];

  get columnSelectOptionsWithIndexColumn(): SelectOption[] {
    return [{ label: '[index]', value: INDEX_COLUMN } as SelectOption]
      .concat(getColumnSelectOptions(this.dataset));
  }

  public setSeriesColumn(column: number | null) {
    this.seriesColumn = column;
    this.draw();
  }

  public setValueColumn(column: number | null) {
    this.valueColumn = column;
    this.draw();
  }

  public setGroupByColumn(column: number | null) {
    this.groupByColumn = column;
    this.draw();
  }

  public setPointsVisible(value: boolean) {
    this.arePointsVisible = value;
    this.draw();
  }

  public setCurveDrawing(value: boolean) {
    this.isCurveDrawing = value;
    this.draw();
  }

  public setLegendsVisible(value: boolean) {
    this.areLegendsVisible = value;
    this.draw();
  }

  public setXAxisTicksVisible(value: boolean) {
    this.areXAxisTicksVisible = value;
    this.draw();
  }

  public setYAxisTicksVisible(value: boolean) {
    this.areYAxisTicksVisible = value;
    this.draw();
  }

  public applyColumns(columns: number[]) {
    if (columns.length === 0) {
      this.findDefaultColumns();
      return;
    }
    if (columns.length >= 1) {
      this.valueColumn = columns[0];
    }
    if (columns.length >= 2) {
      this.seriesColumn = columns[1];
    }
    if (columns.length >= 3) {
      this.groupByColumn = columns[2];
    }
    this.draw();
  }

  protected created() {
    this.serializationChain.push((): LineChartSave => ({
      seriesColumn: this.seriesColumn,
      valueColumn: this.valueColumn,
      groupByColumn: this.groupByColumn,
      arePointsVisible: this.arePointsVisible,
      isCurveDrawing: this.isCurveDrawing,
      areLegendsVisible: this.areLegendsVisible,
      areXAxisTicksVisible: this.areXAxisTicksVisible,
      areYAxisTicksVisible: this.areYAxisTicksVisible,
    }));
  }

  protected findDefaultColumns() {
    if (!this.dataset) {
      return;
    }
    this.seriesColumn = this.updateColumnOnDatasetChange(this.seriesColumn);
    this.valueColumn = this.updateColumnOnDatasetChange(this.valueColumn);
    this.groupByColumn = this.updateColumnOnDatasetChange(this.groupByColumn);
  }

  protected draw() {
    if (this.seriesColumn === null) {
      this.coverText = 'Please select series column';
      return;
    }
    if (this.valueColumn === null) {
      this.coverText = 'Please select value column';
      return;
    }
    this.coverText = '';

    this.computeScales();
    this.computeItemProps();
    this.computeLineProps();
    this.updateLeftMargin();
    this.updateBottomMargin();
    this.drawXAxis();
    this.drawYAxis();
    this.drawLegends();
    this.drawLines();
    this.drawPoints();
    this.moveSelectedLinesToFront();
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.computeItemProps();
      this.computeLineProps();
      this.drawLines();
      this.drawPoints();
      this.drawLegends();
      this.propagateSelection();
    }
    drawBrushBox(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  private computeBrushedItems(brushPoints: Point[]) {
    if (!this.isShiftPressed || !brushPoints.length) {
      this.selection.clear(); // reset selection if shift key is not down
      if (!brushPoints.length) {
        return;
      }
    }
    const box = getBrushBox(brushPoints);

    // Mapping from item to group index.
    const itemLineIndex: { [itemIndex: number]: number } = {};
    this.lineProps.forEach(props => {
      props.itemIndices.forEach(itemIndex => itemLineIndex[itemIndex] = props.lineIndex);
    });

    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = this.getDataset();
    const selectedLineIndices: Set<number> = new Set();
    const itemIndices = pkg.getItemIndices();
    itemIndices.forEach(itemIndex => {
      if (this.selection.hasItem(itemIndex)) {
        selectedLineIndices.add(itemLineIndex[itemIndex]);
      }
    });
    for (const itemIndex of itemIndices) {
      const lineIndex = itemLineIndex[itemIndex];
      if (selectedLineIndices.has(lineIndex)) {
        continue;
      }
      const point = {
        x: this.xScale(this.seriesColumn === INDEX_COLUMN ?
          itemIndex : dataset.getCellForScale(itemIndex, this.seriesColumn as number)),
        y: this.yScale(dataset.getCellForScale(itemIndex, this.valueColumn as number)),
      };
      if (isPointInBox(point, box)) {
        selectedLineIndices.add(itemLineIndex[itemIndex]);
      }
    }
    for (const itemIndex of itemIndices) {
      if (selectedLineIndices.has(itemLineIndex[itemIndex])) {
        this.selection.addItem(itemIndex);
      }
    }
  }

  private moveSelectedLinesToFront() {
    const $lines = $(this.$refs.lines as SVGGElement);
    $lines.children('path[has-visuals=true]').appendTo(this.$refs.lines as SVGGElement);
    $lines.children('path[is-selected=true]').appendTo(this.$refs.lines as SVGGElement);
  }

  private computeScales() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = this.getDataset();
    this.yScale = getScale(
      dataset.getColumnType(this.valueColumn as number),
      dataset.getDomain(this.valueColumn as number, pkg.getItemIndices()),
      [this.svgHeight - this.margins.bottom, this.margins.top],
    );
    this.xScale = getScale(
      dataset.getColumnType(this.seriesColumn as number),
      dataset.getDomain(this.seriesColumn as number, pkg.getItemIndices()),
      [this.margins.left, this.svgWidth - this.margins.right],
    );
  }

  private computeItemProps() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = this.getDataset();
    this.itemProps = pkg.getItems().map(item => {
      const props: LineChartItemProps = {
        index: item.index,
        x: this.seriesColumn === INDEX_COLUMN ? item.index : dataset.getCellForScale(item, this.seriesColumn as number),
        y: dataset.getCellForScale(item, this.valueColumn as number),
        visuals: _.extend({}, DEFAULT_ITEM_VISUALS, item.visuals),
        hasVisuals: !_.isEmpty(item.visuals),
        selected: this.selection.hasItem(item.index),
      };
      if (props.selected) {
        _.extend(props, SELECTED_ITEM_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
  }

  private computeLineProps() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = this.getDataset();
    const itemGroups = pkg.groupItems(this.groupByColumn);
    this.sortItems(itemGroups);
    this.lineProps = itemGroups.map((itemIndices, groupIndex) => {
      const props: LineChartLineProps = {
        lineIndex: groupIndex,
        itemIndices,
        points: [],
        label: this.groupByColumn === INDEX_COLUMN || this.groupByColumn === null ? '' :
          dataset.getCell(itemIndices[0], this.groupByColumn as number).toString(),
        visuals: _.clone(DEFAULT_ITEM_VISUALS),
        hasVisuals: false,
        selected: false,
      };

      let groupSelected = false;
      itemIndices.forEach(itemIndex => {
        const item = pkg.getItem(itemIndex);
        _.extend(props.visuals, item.visuals);
        props.points.push([
          this.seriesColumn === INDEX_COLUMN ? itemIndex :
            dataset.getCellForScale(itemIndex, this.seriesColumn as number),
          dataset.getCellForScale(itemIndex, this.valueColumn as number),
        ]);
        props.hasVisuals = props.hasVisuals || !_.isEmpty(item.visuals);
        groupSelected = groupSelected || this.selection.hasItem(itemIndex);
      });

      if (groupSelected) {
        props.selected = true;
        _.extend(props.visuals, SELECTED_LINE_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
  }

  /**
   * Sorts data items in each group based on seriesColumn.
   */
  private sortItems(itemGroups: number[][]) {
    const dataset = this.getDataset();
    let seriesCollided = false;
    const seriesColumn = this.seriesColumn as number;
    const isIndexColumn = seriesColumn === INDEX_COLUMN;
    const columnType = dataset.getColumnType(seriesColumn);
    const comparator = valueComparator(columnType);
    itemGroups.forEach(itemIndices => {
      itemIndices.sort((a, b) => isIndexColumn ? a - b :
        comparator(dataset.getCell(a, seriesColumn), dataset.getCell(b, seriesColumn)));
      for (let i = 1; !seriesCollided && i < itemIndices.length; i++) {
        const itemIndex = itemIndices[i];
        const prevIndex = itemIndices[i - 1];
        const curValue = isIndexColumn ? itemIndex : dataset.getCell(itemIndex, seriesColumn);
        const prevValue = isIndexColumn ? itemIndex : dataset.getCell(prevIndex, seriesColumn);
        if (comparator(curValue, prevValue) === 0) {
          seriesCollided = true;
        }
      }
    });
    this.areSeriesValuesDuplicated = seriesCollided;
  }

  private updateLeftMargin() {
    this.drawYAxis();
    if (this.areLegendsVisible) {
      this.drawLegends();
    }
    this.updateMargins(() => {
      const maxTickWidth = _.max($(this.$refs.yAxis as SVGGElement)
        .find('.y > .tick > text')
        .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
      this.margins.left = DEFAULT_PLOT_MARGINS.left + maxTickWidth;

      if (this.areLegendsVisible) {
        const maxLegendWidth = _.max($(this.$refs.legends as SVGGElement)
          .find('> g')
          .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
        this.margins.left += maxLegendWidth + LEGEND_LABEL_X_OFFSET_PX + LEGEND_X_OFFSET_PX;
      }
      (this.xScale as AnyScale).range([this.margins.left, this.svgWidth - this.margins.right]);
    });
  }

  private updateBottomMargin() {
    this.drawXAxis();
    this.updateMargins(() => {
      const maxTickHeight = _.max($(this.$refs.xAxis as SVGGElement)
        .find('.x > .tick > text')
        .map((index: number, element: SVGGraphicsElement) => element.getBBox().height)) || 0;
      this.margins.bottom = DEFAULT_PLOT_MARGINS.bottom + maxTickHeight;
      (this.yScale as AnyScale).range([this.svgHeight - this.margins.bottom, this.margins.top]);
    });
  }

  private drawLines() {
    // const points: { [index: number]: { x: string | number, y: string | number } } = {};
    const l = line<[number | string, number | string]>()
      .x(point => this.xScale(point[0]))
      .y(point => this.yScale(point[1]));
    if (this.isCurveDrawing) {
      l.curve(curveBasis);
    }
    // this.itemProps.forEach(props => points[props.index] = { x: props.x, y: props.y });
    let lines = select(this.$refs.lines as SVGGElement).selectAll<SVGPathElement, LineChartLineProps>('path')
      .data(this.lineProps, d => d.lineIndex.toString());
    fadeOut(lines.exit());
    lines = lines.enter().append<SVGPathElement>('path')
      .attr('id', d => d.lineIndex)
      .merge(lines)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('is-selected', d => d.selected);

    const updatedLines = this.isTransitionFeasible(this.itemProps.length) ? lines.transition() : lines;
    updatedLines
      .style('stroke', d => d.visuals.color as string)
      .style('stroke-width', d => d.visuals.width + 'px')
      .style('opacity', d => d.visuals.opacity as number)
      .attr('d', d => l(d.points));
  }

  private drawPoints() {
    if (!this.arePointsVisible) {
      fadeOut(select(this.$refs.points as SVGGElement).selectAll('*'));
      return;
    }
    let points = select(this.$refs.points as SVGGElement).selectAll<SVGCircleElement, LineChartItemProps>('circle')
      .data(this.itemProps, d => d.index.toString());
    fadeOut(points.exit());
    points = points.enter().append<SVGCircleElement>('circle')
      .merge(points)
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', d => d.visuals.size as number)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('is-selected', d => d.selected);

    const updatedPoints = this.isTransitionFeasible(this.itemProps.length) ? points.transition() : points;
    updatedPoints
      .style('fill', d => d.visuals.color as string)
      .style('stroke', d => d.visuals.border as string)
      .style('stroke-width', d => d.visuals.width + 'px')
      .style('opacity', d => d.visuals.opacity as number);
  }

  private drawXAxis() {
    drawAxis(this.$refs.xAxis as SVGElement, this.xScale, {
      classes: 'x',
      orient: 'bottom',
      ticks: !this.areXAxisTicksVisible ? 0 : undefined,
      transform: getTransform([0, this.svgHeight - this.margins.bottom]),
      label: {
        text: this.getDataset().getColumnName(this.seriesColumn as number),
        transform: getTransform([this.svgWidth - this.margins.right, -LABEL_OFFSET_PX]),
      },
    });
  }

  private drawYAxis() {
    drawAxis(this.$refs.yAxis as SVGElement, this.yScale, {
      classes: 'y',
      orient: 'left',
      ticks: !this.areYAxisTicksVisible ? 0 : undefined,
      transform: getTransform([this.margins.left, 0]),
      label: {
        text: this.getDataset().getColumnName(this.valueColumn as number),
        transform: getTransform([LABEL_OFFSET_PX, this.margins.top], 1, 90),
      },
    });
  }

  private drawLegends() {
    const svgLegends = select(this.$refs.legends as SVGGElement);
    if (!this.areLegendsVisible || this.groupByColumn === INDEX_COLUMN || this.groupByColumn === null) {
      fadeOut(svgLegends.selectAll('*'));
      return;
    }
    const boxes = svgLegends.selectAll<SVGGElement, LineChartLineProps>('g').data(this.lineProps);
    fadeOut(boxes.exit());

    const enteredBoxes = boxes.enter().append<SVGGElement>('g')
      .attr('transform', (props, index) =>
        getTransform([LEGEND_X_OFFSET_PX, (index + 1) * LEGEND_Y_OFFSET_PX]));

    const labelTransform = getTransform([LEGEND_LABEL_X_OFFSET_PX, LEGEND_LABEL_Y_OFFSET_PX]);
    enteredBoxes.append('rect'); // color box
    enteredBoxes.append('text'); // label
    const updatedBoxes = enteredBoxes.merge(boxes);
    updatedBoxes.select('rect')
      .style('fill', d => d.visuals.color as string);
    updatedBoxes.select('text')
      .attr('transform', labelTransform)
      .text(d => d.label);
  }

  private onInputSeriesColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectSeriesColumnEvent(this, column, prevColumn));
    this.setSeriesColumn(column);
  }

  private onInputValueColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectValueColumnEvent(this, column, prevColumn));
    this.setValueColumn(column);
  }

  private onInputGroupByColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectGroupByColumnEvent(this, column, prevColumn));
    this.setGroupByColumn(column);
  }

  private onTogglePointsVisible(value: boolean) {
    this.commitHistory(history.togglePointsVisibleEvent(this, value));
    this.setPointsVisible(value);
  }

  private onToggleCurveDrawing(value: boolean) {
    this.commitHistory(history.toggleCurveDrawingEvent(this, value));
    this.setCurveDrawing(value);
  }

  private onToggleLegendsVisible(value: boolean) {
    this.commitHistory(history.toggleLegendsVisibleEvent(this, value));
    this.setLegendsVisible(value);
  }

  private onToggleXAxisTicksVisible(value: boolean) {
    this.commitHistory(history.toggleXAxisTicksVisibleEvent(this, value));
    this.setXAxisTicksVisible(value);
  }

  private onToggleYAxisTicksVisible(value: boolean) {
    this.commitHistory(history.toggleYAxisTicksVisibleEvent(this, value));
    this.setYAxisTicksVisible(value);
  }
}

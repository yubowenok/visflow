import { Component } from 'vue-property-decorator';
import { select } from 'd3-selection';
import Victor from 'victor';
import _ from 'lodash';
import $ from 'jquery';

import {
  Visualization,
  injectVisualizationTemplate,
  multiplyVisuals,
  Scale,
  AnyScale,
  getScale,
  drawAxis,
  DEFAULT_PLOT_MARGINS,
  LABEL_OFFSET_PX,
  PlotMargins,
  drawBrushBox,
  getBrushBox,
  isPointInBox,
} from '@/components/visualization';
import template from './scatterplot.html';
import ColumnSelect from '@/components/column-select/column-select';
import { SELECTED_COLOR } from '@/common/constants';
import { isNumericalType } from '@/data/util';
import { fadeOut, getTransform } from '@/common/util';
import { VisualProperties } from '@/data/visuals';
import * as history from './history';

const DOMAIN_MARGIN = .1;
interface ScatterplotSave {
  xColumn: number | null;
  yColumn: number | null;
  areXAxisTicksVisible: boolean;
  areYAxisTicksVisible: boolean;
  axisMargin: boolean;
  useDatasetRange: boolean;
  transparentBackground: boolean;
}

interface ScatterplotItemProps {
  index: number;
  x: number | string;
  y: number | string;
  visuals: VisualProperties;
  hasVisuals: boolean;
  selected: boolean;
}

const DEFAULT_ITEM_VISUALS: VisualProperties = {
  color: '#333',
  border: 'black',
  width: 1,
  size: 5,
  opacity: 1,
};

const SELECTED_ITEM_VISUALS: VisualProperties = {
  color: 'white',
  border: SELECTED_COLOR,
};

@Component({
  template: injectVisualizationTemplate(template),
  components: {
    ColumnSelect,
  },
})
export default class Scatterplot extends Visualization {
  protected NODE_TYPE = 'scatterplot';
  protected HAS_SETTINGS = true; // allow transparent background

  private xColumn: number | null = null;
  private yColumn: number | null = null;
  private margins: PlotMargins = { ...DEFAULT_PLOT_MARGINS, bottom: 20 };
  private xScale!: Scale;
  private yScale!: Scale;
  private itemProps: ScatterplotItemProps[] = [];

  // When set, xScale ane yScale will be set to the dataset's domains
  private useDatasetRange = false;
  // Whether to have margin at the two sides of the axes.
  private axisMargin = true;
  private areXAxisTicksVisible = true;
  private areYAxisTicksVisible = true;

  // advanced settings
  private transparentBackground = false;

  public setXColumn(column: number) {
    this.xColumn = column;
    this.draw();
  }

  public setYColumn(column: number) {
    this.yColumn = column;
    this.draw();
  }

  public setTransitionDisabled(value: boolean) {
    this.isTransitionDisabled = value;
  }

  public applyColumns(columns: number[]) {
    if (columns.length === 0) {
      this.findDefaultColumns();
    } else if (columns.length === 1) {
      this.xColumn = this.yColumn = columns[0];
    } else {
      this.xColumn = columns[0];
      this.yColumn = columns[1];
    }
    this.draw();
  }

  public setUseDatasetRange(value: boolean) {
    this.useDatasetRange = value;
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

  public setAxisMargin(value: boolean) {
    this.axisMargin = value;
    this.draw();
  }

  public setTransparentBackground(value: boolean) {
    this.backgroundColor = value ? 'none' : 'white';
  }

  protected created() {
    this.serializationChain.push((): ScatterplotSave => ({
      xColumn: this.xColumn,
      yColumn: this.yColumn,
      useDatasetRange: this.useDatasetRange,
      axisMargin: this.axisMargin,
      areXAxisTicksVisible: this.areXAxisTicksVisible,
      areYAxisTicksVisible: this.areYAxisTicksVisible,
      transparentBackground: this.transparentBackground,
    }));
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as ScatterplotSave;
      if (save.transparentBackground) {
        this.setTransparentBackground(true);
      }
    });
  }

  protected draw() {
    if (!this.hasDataset()) {
      return;
    }
    if (this.xColumn === null || this.yColumn === null) {
      this.coverText = 'Please choose columns';
      return;
    }
    this.coverText = '';
    this.computeItemProps();
    this.computeScales();
    this.updateLeftMargin();
    this.updateBottomMargin();
    // Drawing must occur after scale computations.
    this.drawXAxis();
    this.drawYAxis();
    this.drawPoints();
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.computeItemProps();
      this.drawPoints();
      this.propagateSelection();
    }
    drawBrushBox(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  protected findDefaultColumns() {
    if (!this.hasDataset()) {
      return;
    }
    const dataset = this.getDataset();
    const numericalColumns = dataset.getColumns().filter(column => isNumericalType(column.type)).slice(0, 2)
      .map(column => column.index);
    if (this.xColumn !== null) {
      this.xColumn = this.updateColumnOnDatasetChange(this.xColumn);
    } else {
      this.xColumn = numericalColumns.shift() || null;
    }
    if (this.yColumn !== null) {
      this.yColumn = this.updateColumnOnDatasetChange(this.yColumn);
    } else {
      this.yColumn = numericalColumns.shift() || null;
    }
  }

  private computeBrushedItems(brushPoints: Point[]) {
    if (brushPoints.length <= 1) {
      return; // ignore clicks
    }
    if (!this.isShiftPressed || !brushPoints.length) {
      this.selection.clear(); // reset selection if shift key is not down
      if (!brushPoints.length) {
        return;
      }
    }
    const box = getBrushBox(brushPoints);
    this.itemProps.forEach(props => {
      const point = { x: this.xScale(props.x), y: this.yScale(props.y) };
      const clickToPointDistance = new Victor(point.x, point.y)
        .subtract(new Victor(brushPoints[0].x, brushPoints[0].y)).length();
      if (isPointInBox(point, box) || clickToPointDistance <= (props.visuals.size  as number) / 2) {
        this.selection.addItem(props.index);
      }
    });
  }

  private computeItemProps() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const items = pkg.getItems();
    this.itemProps = items.map(item => {
      const props: ScatterplotItemProps = {
        index: item.index,
        x: this.getDataset().getCellForScale(item, this.xColumn as number),
        y: this.getDataset().getCellForScale(item, this.yColumn as number),
        visuals: _.extend({}, DEFAULT_ITEM_VISUALS, item.visuals),
        hasVisuals: !_.isEmpty(item.visuals),
        selected: this.selection.hasItem(item.index),
      };
      if (props.selected) {
        _.extend(props.visuals, SELECTED_ITEM_VISUALS);
        multiplyVisuals(props.visuals);
      }
      return props;
    });
  }

  private drawPoints() {
    const useTransition = this.isTransitionFeasible(this.itemProps.length);
    const svgPoints = select(this.$refs.points as SVGGElement);
    let points = svgPoints.selectAll<SVGGraphicsElement, ScatterplotItemProps>('circle')
      .data(this.itemProps, d => d.index.toString());

    if (useTransition) {
      fadeOut(points.exit());
    } else {
      points.exit().remove();
    }

    points = points.enter().append<SVGGraphicsElement>('circle')
      .attr('id', d => d.index.toString())
      .merge(points)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('is-selected', d => d.selected);

    const updatedPoints = useTransition ? points.transition() : points;
    updatedPoints
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', d => (d.visuals.size as number / 2) + 'px')
      .style('fill', d => d.visuals.color as string)
      .style('stroke', d => d.visuals.border as string)
      .style('stroke-width', d => d.visuals.width + 'px')
      .style('opacity', d => d.visuals.opacity as number);

    this.moveSelectedPointsToFront();
  }

  /**
   * Moves the selected points so that they appear above the other points to be clearly visible.
   * Elements that appear later in an SVG are rendered on the top.
   */
  private moveSelectedPointsToFront() {
    const gPoints = this.$refs.points as SVGGElement;
    const $points = $(gPoints);
    $points.children('circle[has-visuals=true]').appendTo(gPoints);
    $points.children('circle[is-selected=true]').appendTo(gPoints);
  }

  private computeScales() {
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    const dataset = this.getDataset();
    const xDomain = dataset.getDomain(this.xColumn as number, this.useDatasetRange ? undefined : items);
    const yDomain = dataset.getDomain(this.yColumn as number, this.useDatasetRange ? undefined : items);
    [this.xScale, this.yScale] = [
      getScale(dataset.getColumnType(this.xColumn as number), xDomain,
        [this.margins.left, this.svgWidth - this.margins.right], {
          domainMargin: this.axisMargin ? DOMAIN_MARGIN : 0,
        }),
      getScale(dataset.getColumnType(this.yColumn as number), yDomain,
        [this.svgHeight - this.margins.bottom, this.margins.top], {
          domainMargin: this.axisMargin ? DOMAIN_MARGIN : 0,
        }),
    ];
  }

  private drawXAxis() {
    drawAxis(this.$refs.xAxis as SVGElement, this.xScale, {
      classes: 'x',
      orient: 'bottom',
      ticks: !this.areXAxisTicksVisible ? 0 : undefined,
      transform: getTransform([0, this.svgHeight - this.margins.bottom]),
      label: {
        text: this.getDataset().getColumnName(this.xColumn as number),
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
        text: this.getDataset().getColumnName(this.yColumn as number),
        transform: getTransform([LABEL_OFFSET_PX, this.margins.top], 1, 90),
      },
    });
  }

  /**
   * Determines the maximum length of the y axis ticks and sets the left margin accordingly.
   */
  private updateLeftMargin() {
    this.drawYAxis();
    this.updateMargins(() => {
      const maxTickWidth = _.max($(this.$refs.yAxis as SVGGElement)
        .find('.y > .tick > text')
        .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
      this.margins.left = DEFAULT_PLOT_MARGINS.left + maxTickWidth;
      (this.xScale as AnyScale).range([this.margins.left, this.svgWidth - this.margins.right]);
    });
  }

  /**
   * Determines the bottom margin depending on whether X axis ticks are shown.
   */
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

  private onSelectXColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectXColumnEvent(this, column, prevColumn));
    this.setXColumn(column);
  }

  private onSelectYColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectYColumnEvent(this, column, prevColumn));
    this.setYColumn(column);
  }

  private onToggleTransitionDisabled(value: boolean) {
    this.commitHistory(history.toggleTransitionDisabledEvent(this, value));
    this.setTransitionDisabled(value);
  }

  private onToggleUseDatasetRange(value: boolean) {
    this.commitHistory(history.toggleUseDatasetRangeEvent(this, value));
    this.setUseDatasetRange(value);
  }

  private onToggleXAxisTicksVisible(value: boolean) {
    this.commitHistory(history.toggleXAxisTicksVisibleEvent(this, value));
    this.setXAxisTicksVisible(value);
  }

  private onToggleYAxisTicksVisible(value: boolean) {
    this.commitHistory(history.toggleYAxisTicksVisibleEvent(this, value));
    this.setYAxisTicksVisible(value);
  }

  private onToggleAxisMargin(value: boolean) {
    this.commitHistory(history.toggleAxisMarginEvent(this, value));
    this.setAxisMargin(value);
  }

  private onToggleTransparentBackground(value: boolean) {
    this.commitHistory(history.toggleTransparentBackgroundEvent(this, value));
    this.setTransparentBackground(value);
  }
}

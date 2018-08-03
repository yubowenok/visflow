import { Component } from 'vue-property-decorator';
import _ from 'lodash';
import Victor from 'victor';
import { select } from 'd3-selection';

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
  xColumn: number;
  yColumn: number;
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

  private xColumn: number = 0;
  private yColumn: number = 0;
  private margins: PlotMargins = { ...DEFAULT_PLOT_MARGINS, bottom: 20 };
  private xScale!: Scale;
  private yScale!: Scale;
  private itemProps: ScatterplotItemProps[] = [];

  public setXColumn(column: number) {
    this.xColumn = column;
    this.draw();
  }

  public setYColumn(column: number) {
    this.yColumn = column;
    this.draw();
  }

  protected created() {
    this.serializationChain.push((): ScatterplotSave => ({
      xColumn: this.xColumn,
      yColumn: this.yColumn,
    }));
  }

  protected draw() {
    if (this.xColumn === null || this.yColumn === null) {
      this.coverText = 'Please choose columns';
      return;
    }
    this.coverText = '';
    this.computeItemProps();
    this.computeScales();
    this.updateLeftMargin();
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

  protected onDatasetChange() {
    const dataset = this.getDataset();
    const numericalColumns = dataset.getColumns().filter(column => isNumericalType(column.type)).slice(0, 2);
    this.xColumn = numericalColumns.length >= 1 ? numericalColumns[0].index : 0;
    this.yColumn = numericalColumns.length >= 2 ? numericalColumns[1].index : 0;
  }

  private computeBrushedItems(brushPoints: Point[]) {
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
      if (isPointInBox(point, box) || clickToPointDistance < (props.visuals.size as number)) {
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
        x: this.getDataset().getCellForScale(item, this.xColumn),
        y: this.getDataset().getCellForScale(item, this.yColumn),
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
    const svgPoints = select(this.$refs.points as SVGGElement);
    let points = svgPoints.selectAll<SVGGraphicsElement, ScatterplotItemProps>('circle')
      .data(this.itemProps, d => d.index.toString());

    fadeOut(points.exit());

    points = points.enter().append<SVGGraphicsElement>('circle')
      .attr('id', d => d.index.toString())
      .merge(points)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('selected', d => d.selected);

    const updatedPoints = this.isTransitionFeasible(this.itemProps.length) ? points.transition() : points;
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
    $points.children('circle[selected=true]').appendTo(gPoints);
  }

  private computeScales() {
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    const dataset = this.getDataset();
    const xDomain = dataset.getDomain(this.xColumn, items);
    const yDomain = dataset.getDomain(this.yColumn, items);
    [this.xScale, this.yScale] = [
      getScale(dataset.getColumnType(this.xColumn), xDomain,
        [this.margins.left, this.svgWidth - this.margins.right], {
          domainMargin: DOMAIN_MARGIN,
        }),
      getScale(dataset.getColumnType(this.yColumn), yDomain,
        [this.svgHeight - this.margins.bottom, this.margins.top], {
          domainMargin: DOMAIN_MARGIN,
        }),
    ];
  }

  private drawXAxis() {
    drawAxis(this.$refs.xAxis as SVGElement, this.xScale, {
      classes: 'x',
      orient: 'bottom',
      transform: getTransform([0, this.svgHeight - this.margins.bottom]),
      label: {
        text: this.getDataset().getColumnName(this.xColumn),
        transform: getTransform([this.svgWidth - this.margins.right, -LABEL_OFFSET_PX]),
      },
    });
  }

  private drawYAxis() {
    drawAxis(this.$refs.yAxis as SVGElement, this.yScale, {
      classes: 'y',
      orient: 'left',
      transform: getTransform([this.margins.left, 0]),
      label: {
        text: this.getDataset().getColumnName(this.yColumn),
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

  private onSelectXColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectXColumnEvent(this, column, prevColumn));
    this.setXColumn(column);
  }

  private onSelectYColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectYColumnEvent(this, column, prevColumn));
    this.setYColumn(column);
  }
}

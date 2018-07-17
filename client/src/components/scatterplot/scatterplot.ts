import { Component } from 'vue-property-decorator';
import _ from 'lodash';
import { select, Selection } from 'd3-selection';

import {
  Visualization,
  injectVisualizationTemplate,
  multiplyVisuals,
  Scale,
  AnyScale,
  getScale,
  drawAxis,
  DEFAULT_PLOT_MARGINS,
  LABEL_OFFSET,
  PlotMargins,
  drawBrushBox,
  getBrushBox,
  isPointInBox,
} from '@/components/visualization';
import template from './scatterplot.html';
import TabularDataset from '@/data/tabular-dataset';
import ColumnSelect from '@/components/column-select/column-select';
import { SELECTED_COLOR } from '@/common/constants';
import { isNumericalType } from '@/data/util';
import { fadeOut, getTransform, elementContains } from '@/common/util';
import { VisualProperties } from '@/data/package/subset-package';

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

const defaultItemVisuals = (): VisualProperties => ({
  color: '#333',
  borderColor: 'black',
  borderWidth: 1,
  size: 3,
  opacity: 1,
});

const selectedItemVisuals = (): VisualProperties => ({
  color: 'white',
  borderColor: SELECTED_COLOR,
});

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
  private margins: PlotMargins = { ...DEFAULT_PLOT_MARGINS, left: 30, bottom: 20 };
  private xScale!: Scale;
  private yScale!: Scale;

  get initialXColumn(): number | null {
    return this.dataset ? this.xColumn : null;
  }

  get initialYColumn(): number | null {
    return this.dataset ? this.yColumn : null;
  }

  protected created() {
    this.serializationChain.push(() => ({
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
    const itemProps = this.getItemProps();
    this.computeScales();
    this.updateLeftMargin();
    // Drawing must occur after scale computations.
    this.drawXAxis();
    this.drawYAxis();
    this.drawPoints(itemProps);
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.drawPoints(this.getItemProps());
      this.propagateSelection();
    }
    drawBrushBox(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  protected onDatasetChange() {
    const dataset = this.dataset as TabularDataset;
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
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    for (const itemIndex of items) {
      const x = this.xScale(this.getDataset().getValue(itemIndex, this.xColumn));
      const y = this.yScale(this.getDataset().getValue(itemIndex, this.yColumn));
      if (isPointInBox({ x, y }, box)) {
        this.selection.addItem(itemIndex);
      }
    }
  }

  private getItemProps(): ScatterplotItemProps[] {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const items = pkg.getItems();
    const itemProps: ScatterplotItemProps[] = items.map(item => {
      const props: ScatterplotItemProps = {
        index: item.index,
        x: this.getDataset().getValue(item, this.xColumn),
        y: this.getDataset().getValue(item, this.yColumn),
        visuals: _.extend(defaultItemVisuals(), item.visuals),
        hasVisuals: !_.isEmpty(item.visuals),
        selected: this.selection.hasItem(item.index),
      };
      if (this.selection.hasItem(item.index)) {
        _.extend(props.visuals, selectedItemVisuals());
        multiplyVisuals(props.visuals);
      }
      return props;
    });
    return itemProps;
  }

  private drawPoints(itemProps: ScatterplotItemProps[]) {
    const svgPoints = select(this.$refs.points as SVGElement);
    let points = (svgPoints.selectAll('circle') as Selection<SVGElement, ScatterplotItemProps, SVGElement, {}>);
    points = points.data(itemProps, d => d.index.toString());

    fadeOut(points.exit());

    points = points.enter().append<SVGElement>('circle')
      .attr('id', d => d.index.toString())
      .merge(points)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('selected', d => d.selected);

    const updatedPoints = this.isTransitionFeasible(itemProps.length) ? points.transition() : points;
    updatedPoints
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', d => d.visuals.size + 'px')
      .style('fill', d => d.visuals.color as string)
      .style('stroke', d => d.visuals.borderColor as string)
      .style('stroke-width', d => d.visuals.borderWidth as number)
      .style('opacity', d => d.visuals.opacity as number);

    this.moveSelectedPointsToFront();
  }

  /**
   * Moves the selected points so that they appear above the other points to be clearly visible.
   * Elements that appear later in an SVG are rendered on the top.
   */
  private moveSelectedPointsToFront() {
    const $points = $(this.$refs.points);
    $points.children('circle[has-visuals=false]').appendTo(this.$refs.points as SVGGElement);
    $points.children('circle[selected=true]').appendTo(this.$refs.points as SVGGElement);
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
        transform: getTransform([this.svgWidth - this.margins.right, -LABEL_OFFSET]),
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
        transform: getTransform([LABEL_OFFSET, this.margins.top], 1, 90),
      },
    });
  }

  /**
   * The left margin of a scatterplot depends on the longest tick label of the chosen column.
   * We render the axis once and fetch the SVG elements to determine this width, and then set xScale's range
   * to reflect the new left margin.
   */
  private updateLeftMargin() {
    this.drawYAxis();
    $(this.$refs.content).show(); // getBBox() requires the SVG to be visible to return valid sizes
    const maxTickWidth = _.max($(this.$refs.yAxis as SVGGElement)
      .find('.y > .tick > text')
      .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
    this.margins.left = DEFAULT_PLOT_MARGINS.left + maxTickWidth;
    (this.xScale as AnyScale).range([this.margins.left, this.svgWidth - this.margins.right]);
  }

  private onSelectXColumn(columnIndex: number) {
    this.xColumn = columnIndex;
    this.draw();
  }

  private onSelectYColumn(columnIndex: number) {
    this.yColumn = columnIndex;
    this.draw();
  }
}

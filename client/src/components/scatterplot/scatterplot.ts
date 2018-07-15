import { Vue, Component } from 'vue-property-decorator';
import _ from 'lodash';
import { select, Selection } from 'd3-selection';
import { scaleLinear, ScaleLinear } from 'd3-scale';

import {
  Visualization,
  injectVisualizationTemplate,
  multiplyVisuals,
  Scale,
} from '@/components/visualization';
import template from './scatterplot.html';
import TabularDataset from '@/data/tabular-dataset';
import { SELECTED_COLOR } from '@/common/constants';
import { isNumericalType } from '@/data/util';
import { fadeOut } from '@/common/util';
import { VisualProperties } from '@/data/package/subset-package';

interface ScatterplotSave {
  columnX: number;
  columnY: number;
}

interface ScatterplotItemProps {
  index: number;
  x: number;
  y: number;
  visuals: VisualProperties;
  bound: boolean;
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
})
export default class Scatterplot extends Visualization {
  protected NODE_TYPE = 'scatterplot';

  private xColumn: number = 0;
  private yColumn: number = 0;
  private xScale: Scale = scaleLinear();
  private yScale: Scale = scaleLinear();

  protected created() {
    this.serializationChain.push(() => ({
      columnX: this.xColumn,
      columnY: this.yColumn,
    }));
  }

  protected onDatasetChange() {
    const dataset = this.dataset as TabularDataset;
    const numericalColumns = dataset.getColumns().filter(column => isNumericalType(column.type)).slice(0, 2);
    this.xColumn = numericalColumns.length >= 1 ? numericalColumns[0].index : 0;
    this.yColumn = numericalColumns.length >= 2 ? numericalColumns[1].index : 0;
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.renderScatterplot();
  }

  private getItemProps(): ScatterplotItemProps[] {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = this.dataset as TabularDataset;
    const items = pkg.getItems();
    const itemProps: ScatterplotItemProps[] = items.map(item => {
      const props: ScatterplotItemProps = {
        index: item.index,
        x: +this.getDataset().getValue(item, this.xColumn),
        y: +this.getDataset().getValue(item, this.yColumn),
        visuals: _.extend(defaultItemVisuals(), item.visuals),
        bound: _.isEmpty(item.visuals),
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

  private renderScatterplot() {
    const itemProps = this.getItemProps();
    this.drawPoints(itemProps);
  }

  private drawPoints(itemProps: ScatterplotItemProps[]) {
    const svg = select(this.$refs.svg as SVGElement);
    let points = svg.selectAll('circle') as Selection<SVGElement, ScatterplotItemProps, SVGElement, {}>;
    points.data<ScatterplotItemProps>(itemProps, d => '' + d.index);

    fadeOut(points.exit());

    points = points.enter().append<SVGElement>('circle')
      .attr('id', d => d.index)
      .merge(points)
      .attr('bound', d => d.bound)
      .attr('selected', d => d.selected);

    const updatedPoints = this.isTransitionFeasible(itemProps.length) ? points.transition() : points;
    updatedPoints
      // .attr('cx', d => this.xScale(d.x))
      // .attr('cy', d => this.yScale(d.y))
      .attr('r', d => d.visuals.size + 'px')
      .style('fill', d => d.visuals.color as string)
      .style('stroke', d => d.visuals.borderColor as string)
      .style('stroke-width', d => d.visuals.borderWidth as number)
      .style('opacity', d => d.visuals.opacity as number);
  }

  private computeScales() {
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    const dataset = this.getDataset();
    const xDomain = dataset.getDomain(this.xColumn, items);
    const yDomain = dataset.getDomain(this.yColumn, items);
    // this.xScale.domain(xDomain).range([0, this.width]);
    // this.yScale.domain(yDomain).range([0, this.height]);
  }
}

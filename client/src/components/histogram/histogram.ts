import { Component } from 'vue-property-decorator';
import { histogram, Bin } from 'd3-array';
import { scaleLinear, ScaleBand } from 'd3-scale';
import { select } from 'd3-selection';
import _ from 'lodash';

import {
  injectVisualizationTemplate,
  Visualization,
  drawBrushBox,
  getBrushBox,
  Scale,
  PlotMargins,
  DEFAULT_PLOT_MARGINS,
  AnyScale,
  getScale,
  drawAxis,
  LABEL_OFFSET_PX,
  multiplyVisuals,
  OrdinalScaleType,
} from '@/components/visualization';
import FormInput from '@/components/form-input/form-input';
import template from './histogram.html';
import { isNumericalType, isContinuousDomain } from '@/data/util';
import { ValueType } from '@/data/parser';
import { VisualProperties, visualsComparator } from '@/data/visuals';
import { SELECTED_COLOR } from '@/common/constants';
import { getTransform, fadeOut } from '@/common/util';
import ColumnSelect from '@/components/column-select/column-select';
import * as history from './history';
import { SubsetSelection } from '@/data/package';

const DOMAIN_MARGIN = .2;
const BAR_INTERVAL = 1;

export interface HistogramSelection {
  selection: SubsetSelection;
  selectedBars: Set<string>;
}

interface HistogramSave {
  column: number | null;
  numBins: number;
  selectedBars: string[];
}

interface HistogramBinProps {
  id: string;
  x0: number;
  x1: number;
  y: number;
  bars: HistogramBarProps[];
}

interface HistogramBarProps {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  originalVisuals: VisualProperties; // Original visual properties are kept intact during rendering.
  visuals: VisualProperties; // Rendered isual properties can be modified based on whether bars are selected.
  members: number[];
  hasVisuals: boolean;
  selected: boolean;
}

interface HistogramValueBinProps {
  value: number;
  index: number;
}

const DEFAULT_ITEM_VISUALS: VisualProperties = {
  color: '#555',
  opacity: 1,
};

const SELECTED_ITEM_VISUALS: VisualProperties = {
  color: 'white',
  border: SELECTED_COLOR,
  width: 1.5,
};

@Component({
  template: injectVisualizationTemplate(template),
  components: {
    FormInput,
    ColumnSelect,
  },
})
export default class Histogram extends Visualization {
  protected NODE_TYPE = 'histogram';
  protected DEFAULT_WIDTH = 350;
  protected DEFAULT_HEIGHT = 200;

  private column: number | null = null;
  private numBins = 10;
  private xScale!: Scale;
  private yScale!: Scale;
  private valueBins: Array<Bin<HistogramValueBinProps, number>> = [];
  private bins: HistogramBinProps[] = [];
  private selectedBars: Set<string> = new Set();
  private prevSelectedBars: Set<string> = new Set();

  private margins: PlotMargins = _.extend({}, DEFAULT_PLOT_MARGINS, { bottom: 20 });

  /**
   * Disables the num bins input when the chosen column is not continuous.
   */
  get isNumBinsDisabled(): boolean {
    return !this.hasNoDataset() && this.column != null &&
      !isContinuousDomain(this.getDataset().getColumnType(this.column));
  }

  public setHistogramSelection({ selection, selectedBars }: { selection: number[], selectedBars: string[] }) {
    this.selection.setItems(selection);
    this.selectedBars = new Set(selectedBars);
    this.onSelectionUpdate();
  }

  public setColumn(column: number) {
    this.column = column;
    this.draw();
  }

  public setNumBins(value: number) {
    this.numBins = value;
    this.draw();
  }

  protected created() {
    this.serializationChain.push((): HistogramSave => ({
      column: this.column,
      numBins: this.numBins,
      selectedBars: Array.from(this.selectedBars),
    }));
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as HistogramSave;
      this.selectedBars = new Set(save.selectedBars);
    });
  }
  protected onDatasetChange() {
    const dataset = this.getDataset();
    const numericalColumns = dataset.getColumns().filter(column => isNumericalType(column.type));
    this.column = numericalColumns.length ? numericalColumns[0].index : null;
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.drawHistogram();
      this.propagateSelection();
    }
    drawBrushBox(this.$refs.brush as SVGElement, !isBrushStop ? brushPoints : []);
  }

  protected executeSelectAll() {
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    this.selection.addItems(items);
    this.bins.forEach(bin => {
      bin.bars.forEach(bar => {
        this.selectedBars.add(bar.id);
      });
    });
  }

  protected executeDeselectAll() {
    this.selectedBars.clear();
    this.selection.clear();
  }

  protected commitSelectionHistory(message: string) {
    if (_.isEqual(this.selectedBars, this.prevSelectedBars)) {
      return;
    }
    this.commitHistory(history.interactiveSelectionEvent(this,
      { selection: this.selection, selectedBars: this.selectedBars },
      { selection: this.prevSelection, selectedBars: this.prevSelectedBars },
      message,
    ));
  }

  protected recordPrevSelection() {
    this.prevSelection = this.selection.clone();
    this.prevSelectedBars = _.clone(this.selectedBars);
  }

  protected draw() {
    this.drawHistogram();
    this.drawXAxis();
    this.drawYAxis();
  }

  private drawHistogram() {
    // First compute the x scale which is solely based on data.
    this.computeXScale();
    // Then compute histogram bins using D3.
    this.computeBins();
    // Based on the bins we can compute the y scale.
    this.computeYScale();
    this.updateLeftMargin();

    this.assignItemsIntoBins();
    this.applyItemProps();

    this.drawBars();
    this.moveSelectedBarsToFront();
  }

  private moveSelectedBarsToFront() {
    const svgBars = $(this.$refs.bars);
    svgBars.find('rect[has-visuals=true]').each((index, element) => {
      $(element).appendTo($(element as HTMLElement).closest('g'));
    });
    svgBars.find('rect[selected=true]').each((index, element) => {
      $(element).appendTo($(element as HTMLElement).closest('g'));
    });
  }

  private computeBrushedItems(brushPoints: Point[]) {
    if (!this.isShiftPressed || !brushPoints.length) {
      this.selection.clear(); // reset selection if shift key is not down
      this.selectedBars.clear();
      if (!brushPoints.length) {
        return;
      }
    }
    const box = getBrushBox(brushPoints);
    this.bins.forEach(bin => {
      const xl = bin.x0;
      const xr = bin.x1;
      if (xr < box.x || xl > box.x + box.width) {
        return;
      }
      bin.bars.forEach(bar => {
        const yl = this.yScale(bar.y + bar.dy);
        const yr = this.yScale(bar.y);
        if (yr < box.y || yl > box.y + box.height) {
          return;
        }
        this.selectedBars.add(bar.id);
        this.selection.addItems(bar.members);
      });
    });
  }

  private computeXScale() {
    const items = this.inputPortMap.in.getSubsetPackage().getItemIndices();
    const dataset = this.getDataset();
    const xDomain = dataset.getDomain(this.column as number, items);
    this.xScale = getScale(dataset.getColumnType(this.column as number), xDomain,
      [this.margins.left, this.svgWidth - this.margins.right],
      { domainMargin: DOMAIN_MARGIN, ordinal: { type: OrdinalScaleType.BAND, paddingInner: 0, paddingOuter: .5 } },
    );
  }

  private computeBins() {
    // Histogram uses the xScale's range (screen range) as its domain to subdivide bins.
    const range = this.xScale.range() as number[];
    // Bins value for histogram layout.
    let thresholds: number[] = [];

    const dataset = this.getDataset();
    const columnType = dataset.getColumnType(this.column as number);
    const continuousDomain = isContinuousDomain(columnType);
    if (continuousDomain) {
      // If xScale domain has only a single value, the ticks will return empty
      // array. That is bins = [].
      thresholds = (this.xScale as AnyScale).ticks(this.numBins).map(value => this.xScale(value));
      // Map dates to POSIX.
      if (columnType === ValueType.DATE) {
        // range = range.map(date => new Date(date).getTime());
        // thresholds = thresholds.map(date => new Date(date).getTime());
      }
    } else if (!continuousDomain) {
      const ordinals = this.xScale.domain();
      thresholds = ordinals.map(value => this.xScale(value)) as number[];
      thresholds.push(this.xScale(_.last(ordinals) as string) + (this.xScale as ScaleBand<string>).bandwidth());
    }
    const pkg = this.inputPortMap.in.getSubsetPackage();

    const values = pkg.getItemIndices().map(itemIndex => {
      const value = dataset.getCellForScale(itemIndex, this.column as number);
      return {
        value: this.xScale(value),
        index: itemIndex,
      };
    });

    this.valueBins = histogram<HistogramValueBinProps, number>()
      .value(d => d.value)
      .domain(range as [number, number])
      .thresholds(thresholds)(values);
  }

  private computeYScale() {
    this.yScale = scaleLinear()
      .domain([0, _.max(this.valueBins.map(d => d.length)) as number])
      .nice()
      .range([this.svgHeight - this.margins.bottom, this.margins.top]) as Scale;
  }

  private assignItemsIntoBins() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    this.bins = this.valueBins.map((valueBin, binIndex) => {
      // Get d3 histogram coordinates.
      const x0 = valueBin.x0;
      const x1 = valueBin.x1;
      const binLength = valueBin.length;

      const sorted = valueBin.map(item => ({
        visuals: pkg.getItem(item.index).visuals,
        index: item.index,
      })).sort((a, b) => visualsComparator(a.visuals, b.visuals));

      const bars: HistogramBarProps[] = [];
      let y = 0;
      let groupCount = 0;
      for (let j = 0; j < sorted.length; j++) {
        let k = j;
        const members = [];
        // Get all group members with the same rendering properties.
        while (k < sorted.length && visualsComparator(sorted[k].visuals, sorted[j].visuals) === 0) {
          members.push(sorted[k++].index);
        }
        bars.push({
          id: 'g' + (++groupCount),
          x: x0,
          y,
          dx: x1 - x0,
          dy: k - j,
          originalVisuals: sorted[j].visuals,
          visuals: sorted[j].visuals,
          hasVisuals: false,
          selected: false,
          members,
        });
        y += k - j; // The current accumulative bar height
        j = k - 1;
      }
      return {
        id: 'b' + binIndex,
        x0,
        x1,
        y: binLength,
        bars,
      };
    });
  }

  private applyItemProps() {
    this.bins.forEach(bin => {
      bin.bars.forEach(bar => {
        const id = bin.id + ',' + bar.id;
        _.extend(bar, {
          id,
          visuals: _.extend({}, DEFAULT_ITEM_VISUALS, bar.originalVisuals),
          hasVisuals: !_.isEmpty(bar.originalVisuals),
          selected: this.selectedBars.has(id),
        });
        if (this.selectedBars.has(id)) {
          _.extend(bar.visuals, SELECTED_ITEM_VISUALS);
          multiplyVisuals(bar.visuals);
        }
      });
    });
  }

  private drawBars() {
    const numItems = this.inputPortMap.in.getSubsetPackage().numItems();

    const binTransform = (bin: HistogramBinProps) => getTransform([bin.x0, 0]);
    let bins = select(this.$refs.bars as SVGGElement).selectAll<SVGGElement, HistogramBinProps>('g')
      .data(this.bins);
    fadeOut(bins.exit());
    bins = bins.enter().append<SVGGElement>('g')
      .attr('id', d => d.id)
      .style('opacity', 0)
      .attr('transform', binTransform)
      .merge(bins);

    const updatedBins = this.isTransitionFeasible(numItems) ? bins.transition() : bins;
    updatedBins
      .attr('transform', binTransform)
      .style('opacity', 1);

    const barTransform = (group: HistogramBarProps) =>
      getTransform([BAR_INTERVAL, Math.floor(this.yScale(group.y + group.dy))]);

    let bars = bins.selectAll<SVGGraphicsElement, HistogramBarProps>('rect')
      .data(d => d.bars, bar => bar.id);

    fadeOut(bars.exit());

    bars = bars.enter().append<SVGGraphicsElement>('rect')
      .style('opacity', 0)
      .attr('id', d => d.id)
      .attr('transform', barTransform)
      .merge(bars)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('selected', d => d.selected);

    const updatedBars = this.isTransitionFeasible(numItems) ? bars.transition() : bars;
    updatedBars
      .attr('transform', barTransform)
      .attr('width', group => {
        const width = group.dx - BAR_INTERVAL;
        // In case interval is larger than width. At least 1 pixel wide.
        return width < 0 ? 1 : width;
      })
      .attr('height', group => {
        return Math.ceil(this.yScale(0) - this.yScale(group.dy));
      })
      .style('fill', d => d.visuals.color as string)
      .style('stroke', d => d.visuals.border as string)
      .style('stroke-width', d => d.visuals.width + 'px')
      .style('opacity', d => d.visuals.opacity as number);
  }

  private drawXAxis() {
    drawAxis(this.$refs.xAxis as SVGElement, this.xScale, {
      classes: 'x',
      orient: 'bottom',
      transform: getTransform([0, this.svgHeight - this.margins.bottom]),
      label: {
        text: this.getDataset().getColumnName(this.column as number),
        transform: getTransform([
          this.svgWidth - this.margins.right,
          -this.svgHeight + this.margins.bottom + this.margins.top + LABEL_OFFSET_PX,
        ]),
      },
    });
  }

  private drawYAxis() {
    drawAxis(this.$refs.yAxis as SVGElement, this.yScale, {
      classes: 'y',
      orient: 'left',
      transform: getTransform([this.margins.left, 0]),
    });
  }

  /**
   * Determines the maximum length of the y axis ticks and sets the left margin accordingly.
   */
  private updateLeftMargin() {
    this.drawYAxis();
    const prevLeftMargin = this.margins.left;
    this.updateMargins(() => {
      const maxTickWidth = _.max($(this.$refs.yAxis as SVGGElement)
      .find('.y > .tick > text')
      .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
      this.margins.left = DEFAULT_PLOT_MARGINS.left + maxTickWidth;
      if (this.margins.left !== prevLeftMargin) {
        // Bins are based on left margin, we must update the bins if left margin changes.
        this.computeXScale();
        this.computeBins();
      }
    });
  }

  private onSelectColumn(column: number, prevColumn: number | null) {
    this.commitHistory(history.selectColumnEvent(this, column, prevColumn));
    this.setColumn(column);
  }

  private onInputNumBins(value: number, prevValue: number) {
    this.commitHistory(history.inputNumBinsEvent(this, value, prevValue));
    this.setNumBins(value);
  }
}

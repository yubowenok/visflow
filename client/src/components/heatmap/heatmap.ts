import { Component } from 'vue-property-decorator';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import _ from 'lodash';

import template from './heatmap.html';
import {
  Visualization,
  injectVisualizationTemplate,
  Scale,
  PlotMargins,
  DEFAULT_PLOT_MARGINS,
  getScale,
  multiplyVisuals,
  drawBrushBox,
  getBrushBox,
  AnyScale,
} from '@/components/visualization';
import { fadeOut, getTransform } from '@/common/util';
import { getColorScale } from '@/common/color-scale';
import { SELECTED_COLOR } from '@/common/constants';
import { valueComparator, isContinuousDomain } from '@/data/util';
import { VisualProperties } from '@/data/visuals';
import ColorScaleSelect from '@/components/color-scale-select/color-scale-select';
import ColumnList from '@/components/column-list/column-list';
import ColumnSelect from '@/components/column-select/column-select';

const DEFAULT_NUM_COLUMNS = 6;
const ROW_LABEL_X_OFFSET_PX = 8;
const COLUMN_LABEL_Y_OFFSET_PX = 8;
const LABEL_SIZE_X_PX = 6;
const LABEL_SIZE_Y_PX = 9;

const DEFAULT_ITEM_VISUALS = {
  color: '#555',
};

const SELECTED_ITEM_VISUALS = {
  border: SELECTED_COLOR,
  color: '#333',
  width: 1.5,
};

interface HeatmapSave {
  columns: number[];
  sortByColumn: number | null;
  colorScaleId: string;
  rowLabelColumn: number | null;
  areColumnLabelsVisible: boolean;
}

interface HeatmapItemProps {
  index: number;
  visuals: VisualProperties;
  label: string;
  hasVisuals: boolean;
  selected: boolean;
  cells: HeatmapCellProps[];
}

interface HeatmapCellProps {
  columnIndex: number;
  color: string;
}

@Component({
  template: injectVisualizationTemplate(template),
  components: {
    ColorScaleSelect,
    ColumnList,
    ColumnSelect,
  },
})
export default class Heatmap extends Visualization {
  protected NODE_TYPE = 'heatmap';
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 350;

  private columns: number[] = [];
  private sortByColumn: number | null = null;
  private colorScaleId: string = 'red-green';
  private rowLabelColumn: number | null = null;
  private areColumnLabelsVisible = true;
  private areColumnLabelsVertical = false;
  private areColumnLabelsVerticalChanged = false;

  // Scale in column direction
  private xScale!: Scale;
  // Scale in row direction
  private yScale!: Scale;
  // Scales from column values to [0, 1].
  private columnScales!: Scale[];

  private itemProps: HeatmapItemProps[] = [];

  private margins: PlotMargins = _.clone(DEFAULT_PLOT_MARGINS);

  protected created() {
    this.serializationChain.push((): HeatmapSave => ({
      columns: this.columns,
      sortByColumn: this.sortByColumn,
      colorScaleId: this.colorScaleId,
      rowLabelColumn: this.rowLabelColumn,
      areColumnLabelsVisible: this.areColumnLabelsVisible,
    }));
  }

  protected onDatasetChange() {
    const dataset = this.getDataset();
    this.columns = dataset.getColumns()
      .filter(column => isContinuousDomain(column.type))
      .slice(0, DEFAULT_NUM_COLUMNS)
      .map(column => column.index);
  }

  protected draw() {
    this.drawHeatmap();
    this.drawColumnLabels();
  }

  protected brushed(brushPoints: Point[], isBrushStop?: boolean) {
    if (isBrushStop) {
      this.computeBrushedItems(brushPoints);
      this.computeSelection();
      this.drawHeatmap();
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
    this.itemProps.forEach((props, rowIndex) => {
      const yl = this.yScale(rowIndex + 1);
      const yr = this.yScale(rowIndex);
      if (yr >= box.y && yl <= box.y + box.height) {
        this.selection.addItem(props.index);
      }
    });
  }

  private drawHeatmap() {
    this.computeScales();
    this.computeItemProps(); // Must be before updating left margin. Otherwise label strings are unknown.
    this.updateLeftMargin();
    this.updateTopMargin();
    this.drawGrid();
    this.moveSelectedRowsToFront();

    // Row labels are drawn based on xScale which may change for heatmap.
    this.drawRowLabels();
  }

  private moveSelectedRowsToFront() {
    const $grid = $(this.$refs.grid);
    $grid.find('g[has-visuals=true]').appendTo(this.$refs.grid as SVGGElement);
    $grid.find('g[selected=true]').appendTo(this.$refs.grid as SVGGElement);
  }

  private computeItemProps() {
    const dataset = this.getDataset();
    const colorScale = getColorScale(this.colorScaleId);
    const items = this.inputPortMap.in.getSubsetPackage().getItems();

    if (this.sortByColumn !== null) {
      const columnType = dataset.getColumnType(this.sortByColumn);
      items.sort((a, b) => {
        const aValue = dataset.getCell(a.index, this.sortByColumn as number);
        const bValue = dataset.getCell(b.index, this.sortByColumn as number);
        return valueComparator(columnType)(aValue, bValue);
      });
    }

    this.itemProps = items.map(item => {
      const props: HeatmapItemProps = {
        index: item.index,
        label: this.rowLabelColumn !== null ? dataset.getCell(item, this.rowLabelColumn).toString() : '',
        cells: this.columns.map((columnIndex, gridColumnIndex) => {
          const value = dataset.getCellForScale(item, columnIndex);
          return {
            columnIndex,
            color: colorScale(this.columnScales[gridColumnIndex](value)),
          };
        }),
        visuals: _.clone(item.visuals),
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

  private computeScales() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const numItems = pkg.numItems();
    this.xScale = scaleLinear()
      .domain([0, this.columns.length])
      .range([this.margins.left, this.svgWidth - this.margins.right]) as Scale;
    this.yScale = scaleLinear()
      .domain([0, numItems])
      .range([this.svgHeight - this.margins.bottom, this.margins.top]) as Scale;

    const dataset = this.getDataset();
    this.columnScales = this.columns.map(columnIndex => {
      return getScale(
        dataset.getColumnType(columnIndex),
        dataset.getDomain(columnIndex, pkg.getItemIndices()),
        [0, 1],
      );
    });
  }

  private updateLeftMargin() {
    if (this.rowLabelColumn !== null) {
      this.updateMargins(() => {
        this.drawRowLabels();
        const maxLabelWidth = _.max($(this.$refs.rowLabels as SVGGElement).find('.label')
          .map((index: number, element: SVGGraphicsElement) => element.getBBox().width)) || 0;
        this.margins.left = DEFAULT_PLOT_MARGINS.left + maxLabelWidth;
      });
    } else {
      this.margins.left = DEFAULT_PLOT_MARGINS.left;
    }
    (this.xScale as AnyScale).range([this.margins.left, this.svgWidth - this.margins.right]);
  }

  private updateTopMargin() {
    this.margins.top = DEFAULT_PLOT_MARGINS.top;
    if (this.areColumnLabelsVisible) {
      // TODO: we are not using virtual rendering to determine the maximum label length here.
      const dataset = this.getDataset();
      const columnWidth = (this.svgWidth - this.margins.left - this.margins.right) / this.columns.length;
      const maxColumnNameLength = _.max(this.columns.map(columnIndex =>
        dataset.getColumnName(columnIndex).length)) || 0;
      const oldVertical = this.areColumnLabelsVertical;
      if (columnWidth < maxColumnNameLength * LABEL_SIZE_X_PX) {
        this.areColumnLabelsVertical = true;
        this.margins.top += LABEL_SIZE_X_PX * maxColumnNameLength;
      } else {
        this.areColumnLabelsVertical = false;
        this.margins.top += LABEL_SIZE_Y_PX + COLUMN_LABEL_Y_OFFSET_PX;
      }
      if (this.areColumnLabelsVertical !== oldVertical) {
        this.areColumnLabelsVerticalChanged = true;
      }
    }
    (this.yScale as AnyScale).range([this.svgHeight - this.margins.bottom, this.margins.top]);
  }

  private drawGrid() {
    let rows = select(this.$refs.grid as SVGGElement).selectAll<SVGGElement, HeatmapItemProps>('g')
      .data(this.itemProps, d => d.index.toString());
    fadeOut(rows.exit());
    rows = rows.enter().append<SVGGElement>('g')
      .style('opacity', 0)
      .attr('id', d => d.index)
      .merge(rows)
      .attr('has-visuals', d => d.hasVisuals)
      .attr('selected', d => d.selected);

    const updatedRows = this.isTransitionFeasible(this.itemProps.length) ? rows.transition() : rows;
    updatedRows
      .style('stroke', d => d.visuals.border as string)
      .style('stroke-width', d => d.visuals.width + 'px')
      .attr('transform', (d, index) => getTransform([0, this.yScale(index + 1)]))
      .style('opacity', 1);

    const cellWidth = Math.ceil(this.xScale(1) - this.xScale(0));
    const cellHeight = Math.ceil(this.yScale(0) - this.yScale(1));
    const cellTransform = (cell: HeatmapCellProps, index: number) => getTransform([this.xScale(index), 0]);

    let cells = rows.selectAll<SVGRectElement, HeatmapCellProps>('rect')
      .data(d => d.cells, d => d.columnIndex.toString());
    fadeOut(cells.exit());
    cells = cells.enter().append<SVGRectElement>('rect')
      .style('opacity', 0)
      .attr('id', d => d.columnIndex)
      .attr('transform', cellTransform)
      .merge(cells);

    const updatedCells = this.isTransitionFeasible(this.itemProps.length) ? cells.transition() : cells;
    updatedCells
      .attr('fill', d => d.color)
      .attr('transform', cellTransform)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .style('opacity', 1);
  }

  private drawRowLabels() {
    const svgRowLabels = select(this.$refs.rowLabels as SVGGElement);
    if (this.rowLabelColumn === null) {
      fadeOut(svgRowLabels.selectAll('*'));
      return;
    }
    const cellHeight = this.yScale(0) - this.yScale(1);
    const labelTransform = (row: HeatmapItemProps, index: number) => getTransform([
      this.margins.left - ROW_LABEL_X_OFFSET_PX,
      this.yScale(index + 1) + cellHeight / 2,
    ]);
    let labels = svgRowLabels.selectAll<SVGTextElement, HeatmapItemProps>('text')
      .data(this.itemProps, d => d.index.toString());

    fadeOut(labels.exit());

    labels = labels.enter().append<SVGTextElement>('text')
      .attr('id', d => d.index)
      .attr('transform', labelTransform)
      .classed('label', true)
      .merge(labels)
      .text(d => d.label);

    const updatedLabels = this.isTransitionFeasible(this.itemProps.length) ? labels.transition() : labels;
    updatedLabels
      .style('fill', d => d.visuals.color as string)
      .style('stroke', d => d.visuals.border as string)
      .attr('transform', labelTransform);
  }

  private drawColumnLabels() {
    const svgColumnLabels = select(this.$refs.columnLabels as SVGGElement);
    if (!this.areColumnLabelsVisible) {
      fadeOut(svgColumnLabels.selectAll('*'));
      return;
    }

    let labelTransform: (columnIndex: number, index: number) => string;
    svgColumnLabels.classed('vertical', this.areColumnLabelsVertical);
    if (this.areColumnLabelsVertical) {
      labelTransform = (columnIndex, gridColumnIndex) => getTransform(
        [this.xScale(gridColumnIndex + .5) + LABEL_SIZE_Y_PX / 2, this.margins.top - COLUMN_LABEL_Y_OFFSET_PX],
        1,
        -90,
      );
    } else {
      labelTransform = (columnIndex, gridColumnIndex) => getTransform(
        [this.xScale(gridColumnIndex + .5), this.margins.top - COLUMN_LABEL_Y_OFFSET_PX],
      );
    }

    const dataset = this.getDataset();
    let labels = svgColumnLabels.selectAll<SVGTextElement, number>('.label')
      .data(this.columns, columnIndex => columnIndex.toString());

    fadeOut(labels.exit());

    labels = labels.enter().append<SVGTextElement>('text')
      .attr('id', d => d.toString())
      .classed('label', true)
      .attr('transform', labelTransform)
      .merge(labels)
      .text(d => dataset.getColumnName(d));

    let updatedLabels = this.isTransitionFeasible(this.columns.length) ? labels.transition() : labels;
    if (this.areColumnLabelsVerticalChanged) {
      this.areColumnLabelsVerticalChanged = false;
      let counter = updatedLabels.size();
      updatedLabels = updatedLabels.transition()
        .on('end', () => {
          if (--counter === 0) {
            this.drawColumnLabels();
          }
        });
    }
    updatedLabels.attr('transform', labelTransform);
  }
}

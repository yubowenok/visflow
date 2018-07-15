import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import { dateDisplay } from '@/common/util';
import { SubsetPackage } from '@/data/package';
import DataTable, { DEFAULT_LENGTH_MENU } from '@/components/data-table/data-table';
import TabularDataset, { TabularRow, ColumnSelectOption } from '@/data/tabular-dataset';
import template from './table.html';
import { Visualization, injectVisualizationTemplate } from '@/components/visualization';
import ColumnList from '@/components/column-list/column-list';

const DEFAULT_MAX_COLUMNS = 10;
// Approximate height of the datatables excluding its scroll body.
const DATATABLE_WRAPPER_HEIGHT_PX = 70;

export interface TableSave {
  columns: number[]; // Columns to show in the table
}

@Component({
  template: injectVisualizationTemplate(template),
  components: {
    DataTable,
    ColumnList,
  },
})
export default class Table extends Visualization {
  protected NODE_TYPE = 'table';
  protected MIN_WIDTH = 270;
  protected MIN_HEIGHT = 150;
  protected ALT_DRAG_ELEMENT = '.dataTables_scroll';

  private pageLength: number = 10;

  private tableConfig: DataTables.Settings = {};
  private rowIds: number[] = [];

  // Columns to show from the dataset.
  private columns: number[] = [];

  get initialSelectedColumns(): number[] {
    return this.dataset ? this.columns : [];
  }

  protected created() {
    this.serializationChain.push(() => ({
      columns: this.columns,
    }));
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.renderTable();
  }

  protected onDatasetChange() {
    const dataset = this.dataset as TabularDataset;
    // Choose the first a few columns to show.
    this.columns = _.range(Math.min(dataset.numColumns(), DEFAULT_MAX_COLUMNS));
  }

  protected onResize() {
    this.updateScrollBodyHeight();
  }

  protected onEnlarge() {
    this.renderTable();
  }

  private renderTable() {
    if (!this.dataset) {
      console.warn('render empty table');
      this.tableConfig = {};
      return;
    }

    const pkg = this.inputPortMap.in.getPackage() as SubsetPackage;
    const dataset = pkg.getDataset() as TabularDataset;

    const items = pkg.getItemIndices();
    const rows = dataset.subRowsOnSubColumns(items, this.columns, { indexColumn: true });
    const columns = [ { title: '#' } ] // Data item index column, which is also used to show visuals
      .concat(this.columns.map(columnIndex => {
        return { title: dataset.getColumn(columnIndex).name };
      }));
    const columnDefs: DataTables.ColumnDefsSettings[] = [{
      targets: 0,
      orderable: false,
      render: (index: number) => {
        const item = pkg.getItem(index);
        return `<span class="table-prop" style="
          ${item.visuals.color ? 'background-color: ' + item.visuals.color : ''};
          ${item.visuals.borderColor ? 'border: 1px solid ' + item.visuals.borderColor : ''};
        ></span>`;
      },
    }];

    // Use date column sorter
    this.columns.forEach((column: number, index: number) => {
      if (dataset.isDateColumn(column)) {
        columnDefs.push({
          targets: index + 1, // +1 to accomodate the index column in the beginning
          render: dateDisplay,
        });
      }
    });

    const component = this;
    this.tableConfig = {
      data: rows,
      columnDefs,
      stateSave: true,
      columns,
      order: [],
      scrollX: true,
      pagingType: 'full',
      select: {
        style: 'os',
        info: false,
      },
      pageLength: this.pageLength,
      lengthMenu: DEFAULT_LENGTH_MENU,
      language: {
        emptyTable: 'No Data Items',
      },
      createdRow: (row, data) => {
        if (!data) {
          return; // Handle empty table
        }
        const itemIndex = (data as TabularRow)[0] as number;
        if (component.selection.hasItem(itemIndex)) {
          $(row).addClass('selected');
        }
      },
      infoCallback(this: DataTables.JQueryDataTables) {
        const pageInfo = this.api().page.info();
        if (pageInfo.pages === 0) {
          return '';
        }
        return `Page ${pageInfo.page + 1}/${pageInfo.pages}`;
      },
      drawCallback: this.updateScrollBodyHeight,
    };

    this.rowIds = items; // mapping from row to data id
    this.outputPortMap.out.updatePackage(pkg.clone());
    this.computeSelection();
  }

  private onSelectColumns(columnIndices: number[]) {
    // ColumnList will fire selectColumns event on initial selected assignment (passed by initialSelectedColumns).
    // We ignore this update by checking equality of the two column arrays.
    if (!_.isEqual(columnIndices, this.columns)) {
      // console.log(this.columns, columnIndices);
      this.columns = columnIndices;
      this.renderTable();
    }
  }

  private onItemSelect(items: number[]) {
    this.selection.addItems(items);
    this.computeSelection();
    this.propagateSelection();
  }

  private onItemDeselect(items: number[]) {
    this.selection.removeItems(items);
    this.computeSelection();
    this.propagateSelection();
  }

  /**
   * Uses a dynamic height for DataTables scroll body. This overcomes the limitation that the default DataTables
   * scrollY option can only take a fixed height.
   */
  private updateScrollBodyHeight() {
    const content = $(this.$refs.content);
    const height = this.height - (content.find('.dataTables_scrollHead').height() as number) -
      DATATABLE_WRAPPER_HEIGHT_PX;
    content.find('.dataTables_scrollBody')
      .css({
        'max-height': height,
        'height': height,
      });
  }
}

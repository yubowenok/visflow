import { Component } from 'vue-property-decorator';

import { dateDisplay } from '@/common/util';
import { injectNodeTemplate } from '@/components/node';
import { SubsetPackage } from '@/data/package';
import DataTable, { DEFAULT_LENGTH_MENU } from '@/components/data-table/data-table';
import TabularDataset, { TabularRow } from '@/data/tabular-dataset';
import template from './table.html';
import Visualization, { VisualizationSave } from '@/components/visualization/visualization';
import ColumnList from '@/components/column-list/column-list';

export interface TableSave extends VisualizationSave {
  columns: number[]; // Dimensions
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    DataTable,
    ColumnList,
  },
})
export default class Table extends Visualization {
  protected NODE_TYPE = 'table';
  protected containerClasses = ['node', 'visualization', 'table'];
  protected MIN_WIDTH = 270;
  protected MIN_HEIGHT = 150;

  // Columns to show from the dataset.
  private columns: number[] = [];
  private tableConfig: DataTables.Settings = {};
  private pageLength: number = 10;

  protected update() {
    if (this.checkNoDataset()) {
      return;
    }

    const input = this.inputPorts[0]; // single input
    const pkg = input.getPackage() as SubsetPackage;
    const dataset = pkg.getDataset() as TabularDataset;

    // this.columns = [0, 1, 2];

    const rows = dataset.subRowsOnSubColumns(pkg.getItemIndices(), this.columns, { indexColumn: true });
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
        style: 'multi',
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
          $(row).addClass('sel');
        }
      },
      initComplete: () => {
        /*
        var search = this.content.find('.dataTables_filter input');
          // Enter something in the search box to trigger table column resize.
          // Otherwise the width may not be correct due to vertical scroll bar.
          search.val('a').trigger('keyup');
          search.val('').trigger('keyup');
        */
      },
      infoCallback(this: DataTables.JQueryDataTables) {
        const pageInfo = this.api().page.info();
        if (pageInfo.pages === 0) {
          return '';
        }
        return `Page ${pageInfo.page + 1}/${pageInfo.pages}`;
      },
    };
  }

  private onItemSelect() {

  }

  private onItemDeselect() {

  }
}

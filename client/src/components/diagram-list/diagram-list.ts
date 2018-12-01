import { Component, Vue } from 'vue-property-decorator';
import $ from 'jquery';

import ns from '@/store/namespaces';
import DataTable from '@/components/data-table/data-table';
import { DiagramInfo } from '@/store/dataflow/types';
import { dateDisplay } from '@/common/util';

@Component({
  components: {
    DataTable,
  },
})
export default class DiagramList extends Vue {
  @ns.dataflow.Action('listDiagram') private dispatchListDiagram!: () => Promise<DiagramInfo[]>;
  @ns.dataflow.Action('deleteDiagram') private dispatchDeleteDiagram!: (filename: string) => Promise<void>;

  private selectable: boolean = true;
  private list: DiagramInfo[] = [];
  private errorMessage = '';

  get tableConfig(): DataTables.Settings {
    const diagramList = this;
    return {
      columns: [
        { title: 'Name' },
        { title: 'Last Updated' },
        { title: '', orderable: false },
      ],
      columnDefs: [
        {
          targets: 1,
          type: 'date',
          render: (updatedAt: Date) => dateDisplay(updatedAt.toLocaleString()),
        },
        {
          targets: 2,
          render: (filename: string) => {
            return '<button class="btn btn-outline-secondary trash"' +
              `data-filename="${filename}">` +
              '<i class="fas fa-trash"></i></button>';
          },
          width: '10px',
        },
      ],
      drawCallback() {
        // Deletes the dataset on button click
        $(this).find('button.trash')
          .off('click') // turn off the handler in case of redrawing the same element
          .click(evt => {
            const filename = $(evt.target).data('filename') as string;
            diagramList.deleteDiagram(filename);
            evt.stopPropagation();
          });
      },
      data: this.list.map(diagram => [
        diagram.diagramName,
        new Date(diagram.updatedAt),
        diagram.filename,
      ]),
      lengthChange: false,
      pageLength: 5,
      select: this.selectable ? 'single' : false,
      order: [1, 'desc'],
      searching: true,
      info: false,
      language: {
        emptyTable: 'You have no saved diagrams',
      },
    };
  }

  public getList() {
    this.dispatchListDiagram()
      .then(res => this.list = res)
      .catch(err => this.errorMessage = err);
  }

  private deleteDiagram(filename: string) {
    this.dispatchDeleteDiagram(filename)
      .then(this.getList)
      .catch(err => this.errorMessage = err);
  }

  private onDiagramSelect(indexes: number[]) {
    this.$emit('selectDiagram', this.list[indexes[0]]);
  }

  private onDiagramDeselect(indexes: number[]) {
    this.$emit('deselectDiagram');
  }
}

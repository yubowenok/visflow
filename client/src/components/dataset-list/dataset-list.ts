import { Component, Vue, Watch, Prop } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import DataTable from '@/components/data-table/data-table';
import { fileSizeDisplay, dateDisplay } from '@/common/util';
import { DatasetInfo } from '@/store/dataset/types';

@Component({
  components: {
    DataTable,
  },
})
export default class DatasetLit extends Vue {
  @ns.user.State('username') private username!: string;
  @ns.dataset.Action('listDataset') private dispatchListDataset!: () => Promise<DatasetInfo[]>;
  @ns.dataset.Action('deleteDataset') private dispatchDeleteDataset!: (filename: string) => Promise<void>;

  @Prop()
  private selectable!: boolean;

  private list: DatasetInfo[] = [];
  private errorMessage = '';

  get tableConfig(): DataTables.Settings {
    const datasetList = this;
    return {
      columns: [
        { title: 'Name' },
        { title: 'Size' },
        { title: 'Last Used'},
        { title: 'Uploaded' },
        { title: '', orderable: false },
      ],
      columnDefs: [
        {
          targets: 1,
          render: (size: number) => fileSizeDisplay(size),
        },
        {
          targets: 2,
          type: 'date',
          render: (lastUsedAt: Date) => dateDisplay(lastUsedAt.toLocaleString()),
        },
        {
          targets: 3,
          type: 'date',
          render: (createdAt: Date) => dateDisplay(createdAt.toLocaleString()),
        },
        {
          targets: 4,
          render: (filename: string, type: string, row: string[]) => {
            const username = row[5];
            return '<button class="btn btn-outline-secondary trash"' +
              `data-filename="${filename}" ${this.username !== username ? 'disabled' : ''}>` +
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
            datasetList.deleteDataset(filename);
            evt.stopPropagation();
          });
      },
      data: this.list.map(info => [
        info.originalname,
        info.size,
        new Date(info.lastUsedAt),
        new Date(info.createdAt),
        info.filename,
        info.username,
      ]),
      lengthChange: false,
      pageLength: 5,
      select: this.selectable ? 'single' : false,
      order: [2, 'desc'],
      searching: true,
      info: false,
      language: {
        emptyTable: 'You have no uploaded datasets',
      },
    };
  }

  public getList() {
    this.dispatchListDataset()
      .then(res => this.list = res)
      .catch((err: string) => this.errorMessage = err);
  }

  private deleteDataset(filename: string) {
    this.dispatchDeleteDataset(filename)
      .then(this.getList)
      .catch((err: string) => this.errorMessage = err);
  }

  private onDatasetSelect(indexes: number[]) {
    this.$emit('selectDataset', this.list[indexes[0]]);
  }

  private onDatasetDeselect(indexes: number[]) {
    this.$emit('deselectDataset');
  }

  @Watch('username')
  private onUsernameChange() {
    this.getList();
  }
}

import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

import DataTable from '../data-table/data-table';
import { axiosPost, errorMessage, fileSizeDisplay } from '@/common/util';

const user = namespace('user');

interface DatasetInfo {
  originalname: string;
  filename: string;
  size: number;
  updatedAt: string;
}

@Component({
  components: {
    DataTable,
  },
})
export default class DatasetLit extends Vue {
  @user.State('username') private username!: string;

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
        { title: 'Last Updated' },
        { title: '', orderable: false },
      ],
      columnDefs: [
        {
          targets: 1,
          render: (size: number) => fileSizeDisplay(size),
        },
        {
          targets: 2,
          render: (updatedAt: Date) => updatedAt.toLocaleString(),
        },
        {
          targets: 3,
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
          .click((evt: JQuery.Event) => {
            const filename = $(evt.target).data('filename') as string;
            datasetList.deleteDataset(filename);
            evt.stopPropagation();
          });
      },
      data: this.list.map(info => [
        info.originalname,
        info.size,
        new Date(info.updatedAt),
        info.filename,
      ]),
      lengthChange: false,
      select: this.selectable ? 'single' : false,
      order: [2, 'desc'],
      searching: false,
      info: false,
      language: {
        emptyTable: 'You have no uploaded datasets',
      },
    };
  }

  public getList() {
    if (this.username === '') {
      this.list = [];
      return;
    }
    axiosPost<DatasetInfo[]>('/dataset/list')
      .then(res => this.list = res.data)
      .catch(err => this.errorMessage = errorMessage(err));
  }

  @Watch('username')
  private onUsernameChange() {
    this.getList();
  }

  private deleteDataset(filename: string) {
    axiosPost<void>('/dataset/delete', { filename })
      .then(this.getList);
  }
}

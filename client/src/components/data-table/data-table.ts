import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';

export const DEFAULT_LENGTH_MENU = [5, 10, 20, 50, 100];

/*

*/
@Component
export default class DataTable extends Vue {
  @Prop()
  private config!: DataTables.Settings;

  /**
   * Mapping from table row index to the id of the data item in that row.
   * If rowIds are set, the table will emit item ids on selection.
   * If rowIds are not set, the table will emit row indices on selection.
   */
  @Prop()
  private rowIds!: Array<number | string>;

  private table: DataTables.Api | null = null;

  @Watch('config')
  private onConfigChange() {
    if (this.table) {
      /**
       * DataTables does not work with leftover DataTables element.
       * If we do not destory() with "true", DataTables would have difficulty to re-initialize DataTable() and
       * will trigger errors when table columns change:
       *    TypeError: Cannot read property 'style' of undefined
       */
      this.table.destroy(true);
    }
    if (!this.config.data) {
      // Do not draw the table if the data array is unset, which means to remove the table.
      return;
    }
    // Clone the template and initialize DataTable on a clean Element.
    this.table = $(this.$refs.table).clone().appendTo(this.$el).DataTable(this.config);

    // Table selection indices are row index, rather than item index w.r.t. the dataset.
    this.table.on('select', (evt: Event, dt: DataTables.DataTables, type: string, indices: number[]) => {
      if (type === 'row') {
        this.$emit('selectRow', this.rowIds ? indices.map(index => this.rowIds[index]) : indices);
      }
    });
    this.table.on('deselect', (evt: Event, dt: DataTables.DataTables, type: string, indices: number[]) => {
      if (type === 'row') {
        this.$emit('deselectRow', this.rowIds ? indices.map(index => this.rowIds[index]) : indices);
      }
    });

    this.table.rows('.selected').select();
  }
}

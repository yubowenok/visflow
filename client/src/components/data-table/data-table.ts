import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';

export const DEFAULT_LENGTH_MENU = [5, 10, 20, 50, 100];

@Component
export default class DataTable extends Vue {
  @Prop()
  private config!: DataTables.Settings;

  private table: DataTables.DataTables | null = null;

  @Watch('config')
  private onConfigChange() {
    if (this.table) {
      this.table.destroy();
    }
    this.table = $(this.$refs.table).DataTable(this.config);
    this.table.on('select', (evt: Event, dt: DataTables.DataTables, type: string, indexes: number[]) => {
      if (type === 'row') {
        this.$emit('selectRow', indexes);
      }
    });
    this.table.on('deselect', (evt: Event, dt: DataTables.DataTables, type: string, indexes: number[]) => {
      if (type === 'row') {
        this.$emit('deselectRow', indexes);
      }
    });
  }
}

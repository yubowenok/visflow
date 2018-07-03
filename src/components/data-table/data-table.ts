import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';

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
  }
}

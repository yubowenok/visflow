import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import VueSelect from 'vue-select';

import { ColumnSelectOption } from '@/data/tabular-dataset';

@Component({
  components: {
    VueSelect,
  },
})
export default class ColumnSelect extends Vue {
  @Prop()
  private columns!: ColumnSelectOption[];
  @Prop({ type: Number })
  private initialSelectedColumn!: number | null;

  private selected: ColumnSelectOption | null = null;

  // Used to avoid emission of "selectColumns" event on column list creation.
  private isInit = true;

  private mounted() {
    this.selected = this.initialSelectedColumn !== null ? this.columns[this.initialSelectedColumn] : null;
  }

  @Watch('selected')
  private onSelectedChange() {
    if (this.isInit) {
      this.isInit = false;
      return;
    }
    this.$emit('selectColumn', this.selected ? this.selected.value : null);
  }
}

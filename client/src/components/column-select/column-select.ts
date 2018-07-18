import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import VueSelect from 'vue-select';

export interface ColumnSelectOption {
  label: string;
  value: number;
}

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
  // Note that when initialSelectedColumn is null, <vue-select> does not fire input event.
  private isInit = true;

  private mounted() {
    this.selected = this.initialSelectedColumn !== null ? this.columns[this.initialSelectedColumn] : null;
  }

  private onListSelect() {
    if (this.isInit && this.initialSelectedColumn) {
      this.isInit = false;
      return;
    }
    this.$emit('selectColumn', this.selected ?
      (typeof this.selected === 'string' ? this.selected : this.selected.value) : null);
  }
}

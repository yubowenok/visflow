import { Vue, Component, Prop } from 'vue-property-decorator';
import VueSelect from '@/components/vue-select/vue-select';

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
  private value!: number | null;

  private selected: number | null = null;

  // Used to avoid emission of "input" event on column list creation.
  // Note that when the initial value is null, <vue-select> does not fire input event.
  private isInit = true;

  private mounted() {
    this.selected = this.value;
  }

  private onListSelect() {
    if (this.isInit) {
      this.isInit = false;
      return;
    }
    this.$emit('input', this.selected);
  }
}

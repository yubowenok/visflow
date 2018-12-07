import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import FormSelect from '@/components/form-select/form-select';

export interface ColumnSelectOption {
  label: string;
  value: number;
  disabled?: boolean;
}

@Component({
  components: {
    FormSelect,
  },
})
export default class ColumnSelect extends Vue {
  @Prop()
  private columns!: ColumnSelectOption[];
  @Prop({ type: Number })
  private value!: number | null;
  @Prop({ default: false })
  private clearable!: boolean;

  private selected: number | null = null;
  private prevSelected: number | null = null;

  // Used to avoid emission of "input" event on column list creation.
  // Note that when the initial value is null, <form-select> does not fire input event.
  private isInit = true;

  @Watch('value')
  private onValueChange() {
    this.selected = this.prevSelected = this.value;
  }

  private created() {
    this.selected = this.prevSelected = this.value;
  }

  private onListSelect() {
    if (this.selected === this.prevSelected) {
      return;
    }
    this.$emit('change', this.selected, this.prevSelected);
    this.$emit('input', this.selected, this.prevSelected);
    this.prevSelected = this.selected;
  }
}

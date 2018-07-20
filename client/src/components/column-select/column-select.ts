import { Vue, Component, Prop } from 'vue-property-decorator';
import FormSelect from '@/components/form-select/form-select';

export interface ColumnSelectOption {
  label: string;
  value: number;
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

  private initialValue: number | null = null;
  private selected: number | null = null;

  // Used to avoid emission of "input" event on column list creation.
  // Note that when the initial value is null, <form-select> does not fire input event.
  private isInit = true;

  private created() {
    this.initialValue = this.value;
  }

  private mounted() {
    this.selected = this.value;
  }

  private onListSelect() {
    if (this.isInit && this.initialValue !== null) {
      this.isInit = false;
      return;
    }
    this.$emit('input', this.selected);
  }
}

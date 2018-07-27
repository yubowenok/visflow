/**
 * Provides wrapper to address the limitation of vue-select^2.4.0 while waiting for its updates.
 */
import vSelect from 'vue-select';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import _ from 'lodash';

@Component({
  components: {
    vSelect,
  },
})
export default class FormSelect extends Vue {
  @Prop()
  private options!: SelectOption[];

  @Prop({ default: true })
  private clearable!: boolean;

  @Prop({ default: true })
  private emitValue!: boolean;

  @Prop({ default: false })
  private multiple!: boolean;

  @Prop({ default: 'label' })
  private label!: string;

  // Property binded with v-select
  private childSelected: SelectOption | SelectOption[] | null = null;

  // Property binded with parent element
  @Prop({ type: [Object, Number, String, Array] })
  private value!: string | number | Array<string | number> | null;

  private selected: string | number | Array<string | number> | null = null;
  private prevSelected: string | number | Array<string | number> | null = null;

  private created() {
    // Pass initial value assignment to child select, without emitting input event.
    this.save(this.value, true);
  }

  @Watch('value')
  private onValueChange() {
    this.save(this.value);
  }

  private save(value: string | number | Array<string | number> | null, noEvent?: boolean) {
    if (!_.isEqual(this.selected, value)) {
      this.selected = value;
      this.childSelected = this.childSelectedOption();
      if (noEvent !== true) {
        this.$emit('input', this.selected, this.prevSelected);
      }
      this.prevSelected = this.selected;
    }
  }

  private getValue(option: SelectOption): number | string {
    if (option instanceof Object) {
      return (option as SelectOptionObject).value;
    }
    return option;
  }

  private childSelectedOption(): SelectOption | SelectOption[] {
    if (this.selected instanceof Array) {
      return this.selected.map(value => {
        return _.find(this.options, opt => this.getValue(opt) === value) as SelectOption;
      });
    } else {
      return _.find(this.options, opt => this.getValue(opt) === this.selected) as SelectOption;
    }
  }

  /**
   * Handles item selection from the child <v-select>
   */
  private onListSelect(option: SelectOption | SelectOption[]) {
    if (option === null && !this.clearable) {
      // Set it back to the original value.
      // Must use next tick otherwise this happens before child clears the chosen UI option.
      this.$nextTick(() => this.childSelected = this.childSelectedOption());
      return;
    }
    let newSelected: string | number | Array<string | number> | null;
    if (option instanceof Array) {
      newSelected = (this.childSelected as SelectOption[]).map(opt => this.getValue(opt));
    } else {
      newSelected = this.getValue(this.childSelected as SelectOption);
    }
    this.save(newSelected);
  }
}

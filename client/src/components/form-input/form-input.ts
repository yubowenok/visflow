/**
 * @fileOverview Provides a wrapper on input for typing normalization.
 */
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ValueType, parseToken } from '@/data/parser';

@Component
export default class FormInput extends Vue {
  @Prop({ type: [String, Number], default: '' })
  private value!: string;

  @Prop({ type: [String, Number], default: ValueType.STRING })
  private type!: ValueType;

  @Prop({ default: false })
  private disabled!: boolean;

  private text: string = '';

  @Watch('value')
  private onValueChange(value: string | number) {
    this.text = value.toString();
  }

  private created() {
    this.text = this.value;
  }

  private typed(value: string) {
    return parseToken(value, this.type);
  }

  private onInput() {
    this.$emit('input', this.typed(this.text));
  }
}

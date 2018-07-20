/**
 * @fileOverview Provides a wrapper on input for typing normalization.
 */
import { Component, Vue, Prop } from 'vue-property-decorator';
import { ValueType, parseToken } from '@/data/parser';

@Component
export default class FormInput extends Vue {
  @Prop({ type: [String, Number], default: '' })
  private value!: string;

  @Prop({ type: [String, Number], default: ValueType.STRING })
  private type!: ValueType;

  private text: string = '';

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

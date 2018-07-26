/**
 * @fileOverview Provides a wrapper on input for typing normalization.
 */
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ValueType, parseToken } from '@/data/parser';

@Component
export default class FormInput extends Vue {
  @Prop({ type: [String, Number], default: '' })
  private value!: string | null;

  @Prop({ type: [String, Number], default: ValueType.STRING })
  private type!: ValueType;

  @Prop({ default: false })
  private disabled!: boolean;

  private text: string = '';
  private prevText: string = '';

  @Watch('value')
  private onValueChange(value: string | number) {
    this.text = value !== null ? value.toString() : '';
  }

  private created() {
    this.text = this.prevText = this.value !== null ? this.value : '';
  }

  private typed(value: string) {
    if (value === '') {
      return null;
    }
    return parseToken(value, this.type);
  }

  private onInput() {
    this.$emit('change', this.typed(this.text), this.typed(this.prevText));
  }

  private save() {
    if (this.text !== this.prevText) {
      this.$emit('input', this.typed(this.text), this.typed(this.prevText));
      this.prevText = this.text;
    }
  }

  private destory() {
    this.save();
  }
}

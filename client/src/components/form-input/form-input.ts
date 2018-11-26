/**
 * @fileOverview Provides a wrapper on input for typing normalization.
 */
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';

import { ValueType, parseToken } from '@/data/parser';
import { isNumericalType } from '@/data/util';

export interface FormInputEdit {
  startIndex: number;
  endIndex: number; // exclusive on the last character
  type: 'insert' | 'delete' | 'replace' | 'undo';
  value: string;
}

@Component
export default class FormInput extends Vue {
  @Prop({ default: 1000 })
  private maxlength!: number;

  @Prop({ type: [String, Number], default: '' })
  private value!: string | null;

  @Prop({ type: [String, Number], default: ValueType.STRING })
  private type!: ValueType;

  @Prop({ default: false })
  private disabled!: boolean;

  private text: string = '';
  private prevText: string = ''; // previous text before save
  private prevEditText: string = ''; // previous text before last edit
  private selectionRange: [number, number] = [0, 0];
  private prevSelectionRange: [number, number] = [0, 0];

  public getSelectionRange(): [number, number] {
    return this.selectionRange.concat() as [number, number];
  }

  public getPrevSelectionRange(): [number, number] {
    return this.prevSelectionRange.concat() as [number, number];
  }

  /**
   * Gets the last edit in the input.
   */
  public getLastEdit(): FormInputEdit {
    const caret = this.selectionRange[0];
    const l = this.prevSelectionRange[0];
    const r = this.prevSelectionRange[1];
    const edit: FormInputEdit = {
      startIndex: l,
      endIndex: r,
      type: 'insert',
      value: '',
    };
    if (caret > l) { // insert or replace
      edit.type = r === l ? 'insert' : 'replace';
      edit.value = this.text.slice(l, caret);
    } else { // delete or undo
      if (l === r && l === 0) {
        // Unfortunately the browser treats undo as a batch of input operations. At undo the text goes back to the
        // state before a continuous sequence of input. There is no way we can determine the value change here unless
        // we track the sequence of changes in a same way as the browser.
        edit.type = 'undo';
        edit.value = '';
      } else {
        edit.type = 'delete';
        edit.value = l === r ? this.prevEditText[l - 1] : this.prevEditText.slice(l, r);
      }
    }
    if (!edit.value) {
      // Sometimes the input is a unicode character that cannot be parsed. This is to avoid errors in the console.
      edit.value = '';
    }
    return edit;
  }

  @Watch('value')
  private onValueChange(value: string | number) {
    this.text = value !== null ? value.toString() : '';
  }

  private created() {
    this.text = this.prevText = this.value !== null ? this.value : '';
  }

  private onSelect() {
    this.updateSelectionRange();
  }

  private onKeydown(evt: KeyboardEvent) {
    this.prevEditText = this.text;
    this.updateSelectionRange();
  }

  private typed(value: string) {
    if (value === '') {
      return null;
    }
    const typedValue = parseToken(value, this.type);
    if (isNumericalType(this.type) && isNaN(typedValue as number)) {
      return null;
    }
    return typedValue;
  }

  private onInput() {
    if (this.typed(this.text) !== this.typed(this.prevEditText)) {
      this.$emit('input', this.typed(this.text), this.typed(this.prevText));
      this.updateSelectionRange();
    }
  }

  private save() {
    if (this.typed(this.text) !== this.typed(this.prevText)) {
      this.$emit('change', this.typed(this.text), this.typed(this.prevText));
      this.prevText = this.text;
    }
  }

  private updateSelectionRange() {
    this.prevSelectionRange = this.selectionRange;
    this.selectionRange = [
      ($(this.$refs.input)[0] as HTMLInputElement).selectionStart as number,
      ($(this.$refs.input)[0] as HTMLInputElement).selectionEnd as number,
    ];
  }

  private destroyed() {
    this.$emit('destroyed');
    this.save();
  }
}

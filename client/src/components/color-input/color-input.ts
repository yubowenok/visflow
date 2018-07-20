import { Vue, Component, Prop } from 'vue-property-decorator';
import { Chrome as VueColor } from 'vue-color';

import GlobalClick from '@/directives/global-click';
import FormInput from '@/components/form-input/form-input';

interface SelectedColor {
  hex: string;
  a: number;
}

@Component({
  components: {
    FormInput,
    VueColor,
  },
  directives: {
    GlobalClick,
  },
})
export default class ColorInput extends Vue {
  @Prop({ type: String, default: '' })
  private value!: string | null;

  private text: string = '';
  private color: string = '';

  private isFocused = false;

  private created() {
    this.text = this.color = (this.value === null ? '' : this.value);
  }

  private toggleFocused(value?: boolean) {
    this.isFocused = value !== undefined ? value : !this.isFocused;
  }

  private onTextClick() {
    const $input = $(this.$refs.textInput);
    this.toggleFocused();
  }

  private onTextInput() {
    this.color = this.text;
    this.$emit('input', this.color === '' ? null : this.color);
  }

  private onPaletteInput(newColor: SelectedColor) {
    const hex = newColor.hex.toLowerCase();
    this.color = this.text = hex;
    this.$emit('input', this.color === '' ? null : this.color);
  }

  private globalClick(evt: MouseEvent) {
    const target = evt.target as Element;
    if ((this.$refs.vueColor as Vue).$el.contains(target) ||
      (this.$refs.textInput as Vue).$el.contains(target) ||
      (this.$refs.colorDisplay as Element).contains(target)) {
      return;
    }
    this.toggleFocused(false);
  }
}

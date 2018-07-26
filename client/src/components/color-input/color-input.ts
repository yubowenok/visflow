import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
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
  private value!: string;

  private text: string = '';
  // Color communicated with <vue-color>
  private color: string = '';

  private prevColor: string = '';

  private isFocused = false;

  @Watch('value')
  private onValueChange() {
    this.color = this.text = this.value;
  }

  private created() {
    this.text = this.prevColor = this.color = this.value || '';
  }

  private toggleFocused(value?: boolean) {
    const newValue = value !== undefined ? value : !this.isFocused;
    if (!newValue && newValue !== this.isFocused) {
      this.save();
    }
    this.isFocused = newValue;
  }

  private onTextClick() {
    this.toggleFocused();
  }

  private onTextInput() {
    this.color = this.text;
    this.save();
  }

  private onTextChange() {
    this.$emit('change', this.text, this.prevColor);
  }

  private onPaletteInput(newColor: SelectedColor) {
    const hex = newColor.hex.toLowerCase();
    this.text = this.color = hex; // change event will be fired through onTextChange()
    this.$emit('change', hex, this.prevColor);
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

  private save() {
    if (this.color !== this.prevColor) {
      this.$emit('input', this.color === '' ? null : this.color, this.prevColor);
      this.prevColor = this.color;
    }
  }

  private destroyed() {
    this.save();
  }
}

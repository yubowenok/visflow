/**
 * @fileOverview Provides an input slider.
 */
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import $ from 'jquery';

@Component
export default class FormSlider extends Vue {
  @Prop({ type: [String, Number], default: 0 })
  private value!: number;

  @Prop({ type: Number, default: 0, required: true })
  private min!: number;
  @Prop({ type: Number, default: 100, required: true })
  private max!: number;

  @Prop({ default: false })
  private disabled!: boolean;

  private slideValue = 0;
  private prevSlideValue = 0;
  private prevSaveSlideValue = 0;

  @Watch('value')
  private onValueChange(value: number) {
    this.prevSaveSlideValue = this.prevSlideValue = this.slideValue = value;
  }

  private created() {
    this.prevSaveSlideValue = this.prevSlideValue = this.slideValue = this.value;
  }

  private mounted() {
    // Use jquery to listen for slider "let-go" event.
    $(this.$refs.range).on('change', this.save);
  }

  private onInput() {
    this.slideValue = +this.slideValue; // convert html input value (string) to number
    if (this.slideValue !== this.prevSlideValue) {
      this.$emit('change', this.slideValue, this.prevSlideValue);
      this.prevSlideValue = this.slideValue;
    }
  }

  private save() {
    this.slideValue = +this.slideValue; // convert html input value (string) to number
    if (this.slideValue !== this.prevSaveSlideValue) {
      this.$emit('input', this.slideValue, this.prevSaveSlideValue);
      this.prevSaveSlideValue = this.slideValue;
    }
  }

  private destroyed() {
    this.$emit('destroyed');
    this.save();
  }
}

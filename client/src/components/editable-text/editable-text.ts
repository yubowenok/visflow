import { Component, Vue, Prop } from 'vue-property-decorator';
import $ from 'jquery';

@Component
export default class EditableText extends Vue {
  @Prop({ default: true })
  private useEditButton!: boolean;

  @Prop()
  private value!: string;

  private text = '';

  private mounted() {
    this.text = this.value;
  }

  private onClick() {
    if (this.useEditButton) {
      return;
    }
    this.makeEditable();
  }

  private makeEditable() {
    const $text = $(this.$refs.text as Element);
    $text
      .attr('contenteditable', 'true')
      .focus()
      .blur(() => {
        $text.attr('contenteditable', 'false');
        this.save();
      });
  }

  private onEnter() {
    const $text = $(this.$refs.text as Element);
    $text.off('blur').blur();
    this.save();
  }

  private save() {
    const $text = $(this.$refs.text as Element);
    this.text = $text.text();
    this.$emit('input', this.text);
  }
}

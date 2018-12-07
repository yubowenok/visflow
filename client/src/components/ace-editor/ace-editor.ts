/**
 * Provides Vue wrapper for Ace code editor.
 */
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import ace, { Ace } from 'ace-builds';

@Component
export default class AceEditor extends Vue {
  @Prop({ type: [String, Number], default: '' })
  private value!: string;

  private text = '';
  private prevText = '';
  private editor: Ace.Editor | null = null;

  /**
   * When editor.setValue is called, the editor would fire a change event with empty text first.
   * We shall skip that change event.
   */
  private isSettingText = false;

  private created() {
    this.text = this.prevText = this.value;
  }

  @Watch('value')
  private onValueChange() {
    if (this.editor && this.editor.getValue() !== this.value) {
      this.text = this.prevText = this.value;
      this.isSettingText = true;
      this.editor.setValue(this.text);
      this.editor.clearSelection();
    }
  }

  private mounted() {
    const editor = ace.edit(this.$el, {
      mode: 'ace/mode/javascript',
      selectionStyle: 'text',
    });
    editor.setTheme('ace/theme/chrome');
    editor.setPrintMarginColumn(120);
    editor.session.setOption('tabSize', 2);
    editor.session.setValue(this.text);

    editor.on('change', () => {
      if (this.isSettingText) {
        this.isSettingText = false;
        return;
      }
      this.text = editor.getValue();
      if (this.text !== this.prevText) {
        this.$emit('input', this.text, this.prevText);
        this.prevText = this.text;
      }
    });

    this.editor = editor;
  }
}

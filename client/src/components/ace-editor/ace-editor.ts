/**
 * Provides Vue wrapper for Ace code editor.
 */
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import ace from 'ace-builds';
import 'ace-builds/webpack-resolver';

@Component
export default class AceEditor extends Vue {
  @Prop({ type: [String, Number], default: '' })
  private value!: string;

  private text = '';
  private prevText = '';

  private created() {
    this.text = this.prevText = this.value;
  }

  @Watch('value')
  private onValueChange(value: string) {
    this.text = value;
  }

  private mounted() {
    const editor = ace.edit(this.$el, {
      mode: 'ace/mode/javascript',
      selectionStyle: 'text',
    });
    editor.setTheme('ace/theme/chrome');
    editor.session.setOption('tabSize', 2);
    editor.session.setValue(this.text);

    editor.on('change', () => {
      this.text = editor.getValue();
      this.$emit('input', this.text, this.prevText);
      this.prevText = this.text;
    });
  }
}

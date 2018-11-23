import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import AceEditor from '@/components/ace-editor/ace-editor';
import BaseModal from '@/components/modals/base-modal/base-modal';

@Component({
  components: {
    AceEditor,
    BaseModal,
  },
})
export default class AceModal extends Vue {
  // Ace editor modal manages the visible state in itself instead of the global store.
  private visible = false;

  @Prop({ type: String, default: '' })
  private value!: string;

  private code = '';
  private prevCode = '';
  private codeBeforeSave = '';

  public open() {
    this.visible = true;
    this.codeBeforeSave = this.code;
  }

  protected created() {
    this.code = this.prevCode = this.value;
  }

  private close() {
    this.visible = false;
  }

  private save() {
    if (this.code !== this.codeBeforeSave) {
      this.$emit('change', this.code, this.codeBeforeSave);
      this.codeBeforeSave = this.code;
    }
    this.close();
  }

  private onCodeInput(code: string, prevCode: string) {
    if (code === this.prevCode) {
      return;
    }
    this.code = code;
    this.$emit('input', this.code, this.prevCode);
    this.prevCode = this.code;
  }

  private run() {
    this.$emit('run');
  }

  @Watch('value')
  private onValueChange() {
    this.code = this.prevCode = this.value;
  }

  @Watch('visible')
  private onVisibleChange() {
    if (!this.visible) {
      this.close();
    }
  }
}

import { Component, Vue } from 'vue-property-decorator';

@Component
export default class DiagramMenu extends Vue {
  private aboutModalVisible = false;

  /** Opens a new browser tab for system documentation. */
  private documentation() {
    window.open('https://visflow.org/doc.html', '_blank');
  }

  /** Opens a new browser tab to report issues on GitHub. */
  private issues() {
    window.open('https://github.com/yubowenok/visflow/issues/new', '_blank');
  }

  /** Shows a popup modal for system about info. */
  private about() {
    this.aboutModalVisible = true;
  }
}

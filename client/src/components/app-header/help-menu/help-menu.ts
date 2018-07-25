import { Component, Vue } from 'vue-property-decorator';

import { VERSION } from '@/common/env';

@Component
export default class DiagramMenu extends Vue {
  private aboutModalVisible = false;

  get version(): string {
    return VERSION;
  }

  // Opens a new browser tab for system documentation.
  private documentation() {
    window.open('https://visflow.org/doc.html', '_blank');
  }

  // Opens a new browser tab for github repository.
  private github() {
    window.open('https://github.com/yubowenok/visflow/', '_blank');
  }

  // Opens a new browser tab to report issues on GitHub.
  private issues() {
    window.open('https://github.com/yubowenok/visflow/issues/new', '_blank');
  }

  // Shows a popup modal for system about info.
  private about() {
    this.aboutModalVisible = true;
  }

  private closeAbout() {
    this.aboutModalVisible = false;
  }
}

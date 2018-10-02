import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { VERSION } from '@/common/env';
import { MessageModalOptions } from '@/store/modals/types';
import { showSystemMessage } from '@/common/util';

@Component
export default class DiagramMenu extends Vue {
  @ns.modals.Mutation('openMessageModal') private openMessageModal!: (options: MessageModalOptions) => void;
  @ns.history.Action('sendLog') private sendLog!: () => void;
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

  // Opens a crash report modal to send logs.
  private crashReport() {
    this.openMessageModal({
      title: 'Crash Report',
      message: 'If the system does not behave correctly, submit a crash report with system logs so that ' +
        'we can look into what happened.',
      confirmText: 'Submit',
      onConfirm: () => {
        this.sendLog();
        showSystemMessage(this.$store, 'Thank you for reporting the issue', 'success');
      },
    });
  }

  // Shows a popup modal for system about info.
  private about() {
    this.aboutModalVisible = true;
  }

  private closeAbout() {
    this.aboutModalVisible = false;
  }
}

/**
 * @fileOverview Provides a modal for any system component to display a message for user confirmation.
 */
import { Vue, Component, Prop } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { MessageModalOptions } from '@/store/modals/types';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    BaseModal,
  },
})
export default class MessageModal extends Vue {
  @ns.modals.State('messageModalVisible') private messageModalVisible!: boolean;
  @ns.modals.State('messageModalOptions') private options!: MessageModalOptions;
  @ns.modals.Mutation('openMessageModal') private openMessageModal!: () => void;
  @ns.modals.Mutation('closeMessageModal') private closeMessageModal!: () => void;

  get onConfirm(): () => void {
    return this.options.onConfirm || (() => {});
  }

  get confirmText(): string {
    return this.options.confirmText || 'OK';
  }

  private proceed() {
    this.onConfirm();
    this.closeMessageModal();
  }
}

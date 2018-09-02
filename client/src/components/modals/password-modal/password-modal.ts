import { Vue, Component } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { ChangePasswordProfile } from '@/store/user/types';
import { showSystemMessage } from '@/common/util';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    BaseModal,
  },
})
export default class PasswordModal extends Vue {
  @ns.modals.State('passwordModalVisible') private passwordModalVisible!: boolean;
  @ns.modals.Mutation('openPasswordModal') private openPasswordModal!: () => void;
  @ns.modals.Mutation('closePasswordModal') private closePasswordModal!: () => void;
  @ns.user.Action('changePassword') private dispatchChangePassword!: (profile: ChangePasswordProfile) => Promise<void>;

  private password = '';
  private newPassword = '';
  private confirmNewPassword = '';

  private changePassword() {
    const modal = this.$refs.modal as BaseModal;
    this.dispatchChangePassword({
      password: this.password,
      newPassword: this.newPassword,
      confirmNewPassword: this.confirmNewPassword,
    }).then(() => {
      modal.close();
      showSystemMessage(this.$store, `password updated`, 'success');
    }).catch(modal.errorHandler);
  }
}

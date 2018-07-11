import { Vue, Component } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { LoginProfile } from '@/store/user';
import { showSystemMessage } from '@/common/util';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    BaseModal,
  },
})
export default class LoginModal extends Vue {
  @ns.modals.State('loginModalVisible') private loginModalVisible!: boolean;
  @ns.modals.Mutation('openLoginModal') private openLoginModal!: () => void;
  @ns.modals.Mutation('closeLoginModal') private closeLoginModal!: () => void;
  @ns.modals.Mutation('openSignupModal') private openSignupModal!: () => void;
  @ns.user.Action('login') private dispatchLogin!: (profile: LoginProfile) => Promise<string>;

  private loginUsername = '';
  private loginPassword = '';

  private login() {
    const modal = this.$refs.modal as BaseModal;
    this.dispatchLogin({
      username: this.loginUsername,
      password: this.loginPassword,
    }).then((username: string) => {
      modal.close();
      showSystemMessage(this.$store, `Welcome ${username}`, 'success');
    }).catch(modal.errorHandler);
  }

  private openSignup() {
    (this.$refs.modal as BaseModal).close();
    this.openSignupModal();
  }
}

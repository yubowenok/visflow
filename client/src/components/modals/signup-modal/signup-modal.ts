import { Vue, Component } from 'vue-property-decorator';
import ns from '@/store/namespaces';
import { SignupProfile } from '@/store/user/types';
import { showSystemMessage } from '@/common/util';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    BaseModal,
  },
})
export default class SignupModal extends Vue {
  @ns.modals.State('signupModalVisible') private signupModalVisible!: boolean;
  @ns.modals.Mutation('openSignupModal') private openSignupModal!: () => void;
  @ns.modals.Mutation('closeSignupModal') private closeSignupModal!: () => void;
  @ns.user.Action('signup') private dispatchSignup!: (profile: SignupProfile) => Promise<string>;

  private signupUsername = '';
  private signupPassword = '';
  private signupConfirmPassword = '';
  private signupEmail = '';

  private signup() {
    const modal = this.$refs.modal as BaseModal;
    this.dispatchSignup({
      username: this.signupUsername,
      password: this.signupPassword,
      confirmPassword: this.signupConfirmPassword,
      email: this.signupEmail,
    }).then((username: string) => {
      modal.close();
      showSystemMessage(this.$store, `Welcome ${username}`, 'success');
    }).catch(modal.errorHandler);
  }
}

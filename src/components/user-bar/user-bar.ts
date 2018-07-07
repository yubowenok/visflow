import { Component, Vue } from 'vue-property-decorator';
import { LoginProfile, SignupProfile } from '@/store/user';
import { showSystemMessage } from '@/store/message';
import ns from '@/common/namespaces';

@Component
export default class UserBar extends Vue {
  @ns.user.State('username') private username!: string;
  @ns.user.Action('login') private dispatchLogin!: (profile: LoginProfile) => Promise<string>;
  @ns.user.Action('signup') private dispatchSignup!: (profile: SignupProfile) => Promise<string>;
  @ns.user.Action('logout') private dispatchLogout!: () => Promise<void>;
  @ns.user.Action('whoami') private dispatchWhoami!: () => Promise<string>;

  private errorMessage = '';
  private signupModalVisible = false;
  private loginModalVisible = false;
  private profileModalVisible = false;

  private loginUsername = '';
  private loginPassword = '';
  private signupUsername = '';
  private signupPassword = '';
  private signupConfirmPassword = '';
  private signupEmail = '';

  private openLoginModal() {
    this.loginModalVisible = true;
  }

  private closeLoginModal() {
    this.resetErrorMessage();
    this.loginModalVisible = false;
  }

  private openSignupModal() {
    this.signupModalVisible = true;
  }

  private closeSignupModal() {
    this.resetErrorMessage();
    this.signupModalVisible = false;
  }

  private openProfileModal() {
    this.profileModalVisible = true;
  }

  private closeProfileModal() {
    this.profileModalVisible = false;
  }

  private resetErrorMessage() {
    this.errorMessage = '';
  }

  private welcome(username: string) {
    showSystemMessage(`Welcome ${username}`, 'success');
  }

  private login() {
    this.dispatchLogin({
      username: this.loginUsername,
      password: this.loginPassword,
    }).then((username: string) => {
      this.loginModalVisible = false;
      this.welcome(username);
    }).catch((err: string) => {
      this.errorMessage = err;
    });
  }

  private signup() {
    this.dispatchSignup({
      username: this.signupUsername,
      password: this.signupPassword,
      confirmPassword: this.signupConfirmPassword,
      email: this.signupEmail,
    }).then((username: string) => {
      this.signupModalVisible = false;
      this.welcome(username);
    }).catch((err: string) => {
      this.errorMessage = err;
    });
  }

  private logout() {
    this.dispatchLogout()
      .then(() => showSystemMessage('logged out', 'success'))
      .catch((err: string) => showSystemMessage(err, 'error'));
  }

  private mounted() {
    this.dispatchWhoami()
      .catch((err: string) => showSystemMessage(err, 'error'));
  }
}

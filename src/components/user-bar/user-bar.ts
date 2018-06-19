import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const user = namespace('user');

@Component
export default class UserBar extends Vue {
  @user.State('username') private username!: string;
  @user.Action('login') private login!: () => void;

  private loginClicked() {
    this.login();
  }
}

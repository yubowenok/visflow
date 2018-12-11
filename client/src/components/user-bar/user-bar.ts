import { Component, Vue } from 'vue-property-decorator';
import { showSystemMessage } from '@/common/util';
import ns from '@/store/namespaces';

@Component
export default class UserBar extends Vue {
  @ns.user.State('username') private username!: string;
  @ns.user.Action('logout') private dispatchLogout!: () => Promise<void>;
  @ns.user.Action('whoami') private dispatchWhoami!: () => Promise<string>;
  @ns.modals.Mutation('openLoginModal') private openLoginModal!: () => void;
  @ns.modals.Mutation('openProfileModal') private openProfileModal!: () => void;

  private logout() {
    this.dispatchLogout()
      .then(() => showSystemMessage(this.$store, 'logged out', 'success'))
      .catch((err: string) => showSystemMessage(this.$store, err, 'error'));
  }

  private mounted() {
    this.dispatchWhoami()
      .catch((err: string) => showSystemMessage(this.$store, err, 'error'));
  }
}

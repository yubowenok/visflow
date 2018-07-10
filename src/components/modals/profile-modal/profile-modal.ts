import { Vue, Component } from 'vue-property-decorator';
import ns from '@/store/namespaces';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    BaseModal,
  },
})
export default class SignupModal extends Vue {
  @ns.modals.State('profileModalVisible') private profileModalVisible!: boolean;
  @ns.modals.Mutation('openProfileModal') private openProfileModal!: () => void;
  @ns.modals.Mutation('closeProfileModal') private closeProfileModal!: () => void;
}

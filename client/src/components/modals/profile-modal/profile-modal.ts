import { Vue, Component } from 'vue-property-decorator';
import ns from '@/store/namespaces';
import BaseModal from '../base-modal/base-modal';
import { DatasetInfo } from '@/store/dataset/types';
import { DiagramInfo } from '@/store/dataflow/types';

@Component({
  components: {
    BaseModal,
  },
})
export default class SignupModal extends Vue {
  @ns.modals.State('profileModalVisible') private profileModalVisible!: boolean;
  @ns.modals.Mutation('openProfileModal') private openProfileModal!: () => void;
  @ns.modals.Mutation('openPasswordModal') private openPasswordModal!: () => void;
  @ns.modals.Mutation('closeProfileModal') private closeProfileModal!: () => void;

  @ns.user.State('userInfo') private userInfo!: string;
  @ns.dataset.State('lastList') private datasetList!: DatasetInfo[];
  @ns.dataflow.State('lastDiagramList') private diagramList!: DiagramInfo[] | null;

  private changePassword() {
    this.openPasswordModal();
    this.closeProfileModal();
  }
}

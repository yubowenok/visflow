import { Vue, Component } from 'vue-property-decorator';
import ns from '@/store/namespaces';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    BaseModal,
  },
})
export default class NewDiagramModal extends Vue {
  @ns.modals.State('newDiagramModalVisible') private newDiagramModalVisible!: boolean;
  @ns.modals.Mutation('openNewDiagramModal') private openNewDiagramModal!: () => void;
  @ns.modals.Mutation('closeNewDiagramModal') private closeNewDiagramModal!: () => void;
  @ns.dataflow.Action('newDiagram') private dispatchNewDiagram!: () => void;
  @ns.experiment.Getter('isInExperiment') private isInExperiment!: boolean;

  private newDiagram() {
    this.dispatchNewDiagram();
    (this.$refs.modal as BaseModal).close();
  }
}

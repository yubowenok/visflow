import { Vue, Component } from 'vue-property-decorator';
import ns from '@/store/namespaces';
import BaseModal from '../base-modal/base-modal';
import { systemMessageErrorHandler } from '@/common/util';

@Component({
  components: {
    BaseModal,
  },
})
export default class SaveAsDiagramModal extends Vue {
  @ns.modals.State('saveAsDiagramModalVisible') private saveAsDiagramModalVisible!: boolean;
  @ns.modals.Mutation('openSaveAsDiagramModal') private openSaveAsDiagramModal!: () => void;
  @ns.modals.Mutation('closeSaveAsDiagramModal') private closeSaveAsDiagramModal!: () => void;
  @ns.dataflow.Action('saveAsDiagram') private dispatchSaveAsDiagram!: (diagramName: string) => Promise<string>;

  private diagramName = '';

  private saveAsDiagram() {
    this.dispatchSaveAsDiagram(this.diagramName)
      .catch(systemMessageErrorHandler(this.$store))
      .finally((this.$refs.modal as BaseModal).close);
  }
}

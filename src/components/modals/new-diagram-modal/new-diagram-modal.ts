import { Vue, Component } from 'vue-property-decorator';
import ns from '@/common/namespaces';

@Component
export default class NewDiagramModal extends Vue {
  @ns.modals.State('newDiagramModalVisible') private newDiagramModalVisible!: boolean;
  @ns.modals.Mutation('openNewDiagramModal') private openNewDiagramModal!: () => void;
  @ns.modals.Mutation('closeNewDiagramModal') private closeNewDiagramModal!: () => void;
  @ns.dataflow.Action('newDiagram') private newDiagram!: () => void;

  get modalVisible(): boolean {
    return this.newDiagramModalVisible;
  }

  set modalVisible(value: boolean) {
    if (value === this.modalVisible) {
      return;
    }
    if (value) {
      this.openNewDiagramModal();
    } else {
      this.closeNewDiagramModal();
    }
  }

  private dispatchNewDiagram() {
    this.modalVisible = false;
    this.newDiagram();
  }

  private close() {
    this.modalVisible = false;
  }
}

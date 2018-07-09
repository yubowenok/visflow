import { Vue, Component } from 'vue-property-decorator';
import ns from '@/common/namespaces';

@Component
export default class SaveAsDiagramModal extends Vue {
  @ns.modals.State('saveAsDiagramModalVisible') private saveAsDiagramModalVisible!: boolean;
  @ns.modals.Mutation('openSaveAsDiagramModal') private openSaveAsDiagramModal!: () => void;
  @ns.modals.Mutation('closeSaveAsDiagramModal') private closeSaveAsDiagramModal!: () => void;
  @ns.dataflow.Action('saveAsDiagram') private saveAsDiagram!: (diagramName: string) => void;

  private diagramName = '';

  get modalVisible(): boolean {
    return this.saveAsDiagramModalVisible;
  }

  set modalVisible(value: boolean) {
    if (value === this.modalVisible) {
      return;
    }
    if (value) {
      this.openSaveAsDiagramModal();
    } else {
      this.closeSaveAsDiagramModal();
    }
  }

  private dispatchSaveAsDiagram() {
    this.modalVisible = false;
    this.saveAsDiagram(this.diagramName);
  }

  private close() {
    this.modalVisible = false;
  }
}

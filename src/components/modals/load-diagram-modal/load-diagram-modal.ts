import { Vue, Component } from 'vue-property-decorator';
import ns from '@/common/namespaces';

@Component
export default class LoadDiagramModal extends Vue {
  @ns.modals.State('loadDiagramModalVisible') private loadDiagramModalVisible!: boolean;
  @ns.modals.Mutation('openLoadDiagramModal') private openLoadDiagramModal!: () => void;
  @ns.modals.Mutation('closeLoadDiagramModal') private closeLoadDiagramModal!: () => void;
  @ns.dataflow.Action('loadDiagram') private loadDiagram!: () => void;

  get modalVisible(): boolean {
    return this.loadDiagramModalVisible;
  }

  set modalVisible(value: boolean) {
    if (value === this.modalVisible) {
      return;
    }
    if (value) {
      this.openLoadDiagramModal();
    } else {
      this.closeLoadDiagramModal();
    }
  }

  private dispatchLoadDiagram() {
    this.modalVisible = false;
    this.loadDiagram();
  }

  private close() {
    this.modalVisible = false;
  }
}

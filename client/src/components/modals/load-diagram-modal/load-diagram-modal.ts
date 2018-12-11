import { Vue, Component, Watch } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { DiagramInfo } from '@/store/dataflow/types';
import DiagramList from '@/components/diagram-list/diagram-list';
import BaseModal from '../base-modal/base-modal';

@Component({
  components: {
    DiagramList,
    BaseModal,
  },
})
export default class LoadDiagramModal extends Vue {
  @ns.modals.State('loadDiagramModalVisible') private loadDiagramModalVisible!: boolean;
  @ns.modals.Mutation('openLoadDiagramModal') private openLoadDiagramModal!: () => void;
  @ns.modals.Mutation('closeLoadDiagramModal') private closeLoadDiagramModal!: () => void;
  @ns.dataflow.Action('loadDiagram') private dispatchLoadDiagram!: (filename: string) => Promise<string>;

  private selectedDiagram: DiagramInfo | null = null;

  private loadDiagram() {
    const modal = this.$refs.modal as BaseModal;
    this.dispatchLoadDiagram((this.selectedDiagram as DiagramInfo).filename)
      .then(modal.close)
      .catch(modal.errorHandler);
  }

  private onDiagramListSelect(diagram: DiagramInfo) {
    this.selectedDiagram = diagram;
  }

  private onDiagramListDeselect(diagram: DiagramInfo) {
    this.selectedDiagram = null;
  }

  @Watch('loadDiagramModalVisible')
  private onLoadDiagramModalVisibleChange(value: boolean) {
    if (value) {
      (this.$refs.diagramList as DiagramList).getList();
    }
  }
}

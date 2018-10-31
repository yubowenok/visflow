import { Component, Vue, Watch } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class DiagramMenu extends Vue {
  @ns.modals.Mutation('openNewDiagramModal') private openNewDiagramModal!: () => void;
  @ns.modals.Mutation('openLoadDiagramModal') private openLoadDiagramModal!: () => void;
  @ns.modals.Mutation('openSaveAsDiagramModal') private openSaveAsDiagramModal!: () => void;
  @ns.dataflow.Action('saveDiagram') private saveDiagram!: () => void;
  @ns.user.State('username') private username!: string;
  @ns.interaction.State('osCtrlKeyChar') private osCtrlKeyChar!: string;
  @ns.experiment.Getter('isInExperiment') private isInExperiment!: boolean;
}

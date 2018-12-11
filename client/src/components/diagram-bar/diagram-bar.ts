import { Component, Vue } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class DiagramBar extends Vue {
  @ns.dataflow.State('diagramName') private diagramName!: string;
  @ns.dataflow.Action('saveDiagram') private dispatchSaveDiagram!: () => void;

  private saveDiagram() {
    this.dispatchSaveDiagram();
  }
}

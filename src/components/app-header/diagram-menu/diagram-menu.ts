import { Component, Vue } from 'vue-property-decorator';
import ns from '@/common/namespaces';

@Component
export default class DiagramMenu extends Vue {
  @ns.dataflow.Mutation('newDiagram') private newDiagram!: () => void;
  @ns.dataflow.Mutation('saveDiagram') private saveDiagram!: () => void;
  @ns.dataflow.Mutation('loadDiagram') private loadDiagram!: () => void;
}

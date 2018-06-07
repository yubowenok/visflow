import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const dataflow = namespace('dataflow');

@Component
export default class DiagramMenu extends Vue {
  @dataflow.Mutation('newDiagram') private newDiagram!: () => void;
  @dataflow.Mutation('saveDiagram') private saveDiagram!: () => void;
  @dataflow.Mutation('loadDiagram') private loadDiagram!: () => void;
}

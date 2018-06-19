import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import Port from '../port/port';
import Edge from '../edge/edge';
import DrawingEdge from '../drawing-edge/drawing-edge';
import Visualization from '../visualization/visualization';
import { namespace } from 'vuex-class';

const interaction = namespace('interaction');
@Component({
  components: {
    Visualization,
    DrawingEdge,
  },
})
export default class Dataflow extends Vue {
  @interaction.State('draggedPort') private draggedPort!: Port;

  public addNode(node: Node) {
    node.$mount();
    (this.$refs.nodes as Element).appendChild(node.$el);
  }

  public addEdge(edge: Edge) {
    edge.$mount();
    (this.$refs.edgeMount as Element).appendChild(edge.$el);
    (this.$refs.edges as Element).appendChild(edge.getEdgeSvgNode());
  }
}

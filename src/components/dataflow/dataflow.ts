import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import Visualization from '../visualization/visualization';

@Component({
  components: {
    Node,
    Visualization,
  },
})
export default class Dataflow extends Vue {
  public addNode(node: Node) {
    node.$mount();
    (this.$refs.nodes as Element).appendChild(node.$el);
  }
}

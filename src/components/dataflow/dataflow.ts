import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';

@Component
export default class Dataflow extends Vue {
  public addNode(node: Node) {
    node.$mount();
    (this.$refs.nodes as Element).appendChild(node.$el);
  }
}

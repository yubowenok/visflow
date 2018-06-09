import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Dataflow extends Vue {
  public addNode(node: Vue) {
    node.$mount();
    (this.$refs.nodes as Element).appendChild(node.$el);
  }
}

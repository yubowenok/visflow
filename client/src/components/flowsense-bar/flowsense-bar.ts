import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';

@Component({
  components: {
  },
})
export default class FlowsenseBar extends Vue {
  @ns.flowsense.Mutation('toggleInput') private toggleFlowsenseInput!: (noActivePosition?: boolean) => void;

  private toggleInput() {
    this.toggleFlowsenseInput(true);
  }
}

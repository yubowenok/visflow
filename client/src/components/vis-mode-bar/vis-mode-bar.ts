import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';

@Component
export default class VisModeBar extends Vue {
  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;
  @ns.interaction.Mutation('toggleSystemVisMode') private toggleSystemVisMode!: () => void;

  private toggle() {
    this.toggleSystemVisMode();
  }
}

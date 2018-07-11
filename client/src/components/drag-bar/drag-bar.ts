import { Component, Vue } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class DragBar extends Vue {
  @ns.interaction.State('altHold') private altHold!: boolean;
  @ns.interaction.Mutation('toggleAltHold') private toggleAltHold!: () => void;

  private toggle() {
    this.toggleAltHold();
  }
}

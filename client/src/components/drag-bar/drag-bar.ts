import { Component, Vue } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class DragBar extends Vue {
  @ns.interaction.Getter('isAltPressed') private isAltPressed!: boolean;
  @ns.interaction.Mutation('toggleAltHold') private toggleAltHold!: () => void;

  private toggle() {
    this.toggleAltHold();
  }
}

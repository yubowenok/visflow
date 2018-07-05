import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const interaction = namespace('interaction');

@Component
export default class DragBar extends Vue {
  @interaction.State('altHold') private altHold!: boolean;
  @interaction.Mutation('toggleAltHold') private toggleAltHold!: () => void;

  private toggle() {
    this.toggleAltHold();
  }
}

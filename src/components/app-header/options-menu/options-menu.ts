import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const panels = namespace('panels');
const systemOptions = namespace('systemOptions');

@Component
export default class OptionsMenu extends Vue {
  @panels.State('nodePanelVisible') private nodePanelVisible!: boolean;
  @panels.Mutation('toggleNodePanel') private toggleNodePanel!: () => void;

  @systemOptions.State('nodeLabelsVisible') private nodeLabelsVisible!: boolean;
  @systemOptions.Mutation('toggleNodeLabels') private toggleNodeLabels!: () => void;
}

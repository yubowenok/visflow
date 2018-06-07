import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const nodePanel = namespace('nodePanel');
const systemOptions = namespace('systemOptions');

@Component
export default class OptionsMenu extends Vue {
  @nodePanel.State('visible') private nodePanelVisible!: boolean;
  @nodePanel.Mutation('toggle') private toggleNodePanel!: () => void;

  @systemOptions.State('nodeLabelsVisible') private nodeLabelsVisible!: boolean;
  @systemOptions.Mutation('toggleNodeLabels') private toggleNodeLabels!: () => void;
}

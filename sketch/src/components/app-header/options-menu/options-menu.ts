import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const systemOptions = namespace('systemOptions');

@Component
export default class OptionsMenu extends Vue {
  @systemOptions.State('nodePanelEnabled') private nodePanelEnabled!: boolean;
  @systemOptions.State('nodeLabelsEnabled') private nodeLabelsEnabled!: boolean;
  @systemOptions.Mutation('toggleNodeLabels') private toggleNodeLabels!: () => void;
  @systemOptions.Mutation('toggleNodePanel') private toggleNodePanel!: () => void;
}

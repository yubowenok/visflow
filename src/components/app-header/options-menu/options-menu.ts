import { Component, Vue } from 'vue-property-decorator';
import ns from '@/common/namespaces';

@Component
export default class OptionsMenu extends Vue {
  @ns.panels.State('nodePanelVisible') private nodePanelVisible!: boolean;
  @ns.panels.Mutation('toggleNodePanel') private toggleNodePanel!: () => void;

  @ns.systemOptions.State('nodeLabelsVisible') private nodeLabelsVisible!: boolean;
  @ns.systemOptions.Mutation('toggleNodeLabels') private toggleNodeLabels!: () => void;
}

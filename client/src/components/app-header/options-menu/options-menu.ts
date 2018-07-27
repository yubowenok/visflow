import { Component, Vue } from 'vue-property-decorator';
import ns from '@/store/namespaces';

@Component
export default class OptionsMenu extends Vue {
  @ns.panels.State('nodePanelVisible') private nodePanelVisible!: boolean;
  @ns.panels.Mutation('toggleNodePanel') private toggleNodePanel!: () => void;
  @ns.panels.State('historyPanelVisible') private historyPanelVisible!: boolean;
  @ns.panels.Mutation('toggleHistoryPanel') private toggleHistoryPanel!: () => void;

  @ns.systemOptions.State('nodeLabelsVisible') private nodeLabelsVisible!: boolean;
  @ns.systemOptions.Mutation('toggleNodeLabels') private toggleNodeLabels!: () => void;

  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;
}

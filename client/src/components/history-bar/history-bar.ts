import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';

@Component
export default class HistoryBar extends Vue {
  @ns.history.Mutation('undoEvents') private undoEvents!: (k: number) => void;
  @ns.history.Mutation('redoEvents') private redoEvents!: (k: number) => void;
  @ns.history.Getter('undoMessage') private undoMessage!: string;
  @ns.history.Getter('redoMessage') private redoMessage!: string;
  @ns.interaction.State('osCtrlKeyChar') private osCtrlKeyChar!: string;

  private isUndoTooltipVisible = false;
  private isRedoTooltipVisible = false;

  private hideTooltip() {
    this.isUndoTooltipVisible = false;
    this.isRedoTooltipVisible = false;
  }
}

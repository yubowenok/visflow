import { Vue, Component, Watch } from 'vue-property-decorator';
import $ from 'jquery';

import ns from '@/store/namespaces';
import { HistoryEvent } from '@/store/history/types';
import { NodeType } from '@/store/dataflow/types';

@Component
export default class HistoryPanel extends Vue {
  @ns.panels.State('historyPanelVisible') private isVisible!: boolean;
  @ns.history.State('undoStack') private undoStack!: HistoryEvent[];
  @ns.history.State('redoStack') private redoStack!: HistoryEvent[];
  @ns.history.Mutation('undoEvents') private undoEvents!: (k: number) => void;
  @ns.history.Mutation('redoEvents') private redoEvents!: (k: number) => void;
  @ns.history.Getter('undoMessage') private undoMessage!: string;
  @ns.history.Getter('redoMessage') private redoMessage!: string;
  @ns.dataflow.Getter('getImgSrc') private getImgSrc!: (type: NodeType) => string;

  private mounted() {
    $(this.$el).resizable({
      handles: 'e',
    });
  }

  private getIconPath(type: NodeType): string {
    return this.getImgSrc(type);
  }
}

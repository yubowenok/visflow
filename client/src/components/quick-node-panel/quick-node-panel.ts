import { Vue, Component, Watch } from 'vue-property-decorator';

import GlobalClick from '@/directives/global-click';
import NodeList from '@/components/node-list/node-list';
import ns from '@/store/namespaces';
import { NodeType } from '@/store/dataflow';

@Component({
  components: {
    NodeList,
  },
  directives: {
    GlobalClick,
  },
})
export default class QuickNodePanel extends Vue {
  @ns.panels.State('quickNodePanelVisible') private quickNodePanelVisible!: boolean;
  @ns.panels.Mutation('closeQuickNodePanel') private closeQuickNodePanel!: () => void;
  @ns.interaction.State('lastMouseX') private lastMouseX!: number;
  @ns.interaction.State('lastMouseY') private lastMouseY!: number;
  @ns.dataflow.State('nodeTypes') private nodeTypes!: NodeType[];

  private x = 0;
  private y = 0;
  private searchText = '';
  private filteredNodeTypes: NodeType[] = [];

  @Watch('quickNodePanelVisible')
  private onVisibleChange(value: boolean) {
    if (value) {
      this.filteredNodeTypes = this.nodeTypes;
      this.searchText = '';
      this.x = this.lastMouseX;
      this.y = this.lastMouseY;
    }
  }

  @Watch('searchText')
  private onSearchTextChange(text: string) {
    if (text === '') {
      this.filteredNodeTypes = this.nodeTypes;
      return;
    }
    this.filteredNodeTypes = this.nodeTypes.filter(type =>
      type.id.match(text.toLowerCase()) || type.tags.match(text.toLowerCase()));
  }

  private globalClick(evt: MouseEvent) {
    if (this.$el.contains(evt.target as Element)) {
      return;
    }
    this.closeQuickNodePanel();
  }

  get style() {
    return {
      left: this.x + 'px',
      top: this.y + 'px',
    };
  }
}

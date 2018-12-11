import { Component, Vue } from 'vue-property-decorator';

import ns from '@/store/namespaces';
import { NodeType } from '@/store/dataflow/types';
import NodeList from '@/components/node-list/node-list';

@Component({
  components: {
    NodeList,
  },
})
export default class NodePanel extends Vue {
  @ns.panels.State('nodePanelVisible') private nodePanelVisible!: boolean;
  @ns.interaction.State('isSystemInVisMode') private isSystemInVisMode!: boolean;
  @ns.dataflow.Getter('nodeTypes') private nodeTypes!: NodeType[];
  @ns.systemOptions.State('useBetaFeatures') private useBetaFeatures!: boolean;

  get isVisible(): boolean {
    return this.nodePanelVisible && !this.isSystemInVisMode;
  }
}

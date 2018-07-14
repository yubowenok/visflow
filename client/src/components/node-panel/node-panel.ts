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
  @ns.panels.State('nodePanelVisible') private visible!: boolean;
  @ns.dataflow.State('nodeTypes') private nodeTypes!: NodeType[];
}

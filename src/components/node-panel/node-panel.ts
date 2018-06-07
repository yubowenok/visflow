import { Component, Vue } from 'vue-property-decorator';
import { namespace, State } from 'vuex-class';

import ClickOutside from '../../directives/click-outside';
import { NodeTypeInfo } from '../../store/node-panel/node-types';

const nodePanel = namespace('nodePanel');

const NODE_TYPES_PER_ROW = 2;

@Component({
  directives: {
    ClickOutside,
  },
})
export default class NodePanel extends Vue {
  @nodePanel.State('visible') private visible!: boolean;
  @nodePanel.State('nodeTypes') private nodeTypes!: NodeTypeInfo[];

  private show() {
    // TODO
  }

  get nodeTypeRows(): NodeTypeInfo[][] {
    const rows: NodeTypeInfo[][] = [];
    let i = 0;
    while (i < this.nodeTypes.length) {
      rows.push(this.nodeTypes.slice(i, i + NODE_TYPES_PER_ROW));
      i += NODE_TYPES_PER_ROW;
    }
    return rows;
  }
}

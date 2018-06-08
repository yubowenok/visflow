import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import $ from 'jquery';

import { NodeTypeInfo } from '@/store/node-panel/node-types';
import { CreateNodeOptions } from '@/store/dataflow/types';

const nodePanel = namespace('nodePanel');
const dataflow = namespace('dataflow');

const NODE_TYPES_PER_ROW = 2;

@Component
export default class NodePanel extends Vue {
  @nodePanel.State('visible') private visible!: boolean;
  @nodePanel.State('nodeTypes') private nodeTypes!: NodeTypeInfo[];
  @dataflow.Mutation('createNode') private createNode!: (options: CreateNodeOptions) => void;

  /** Initializes the drag-and-drop behavior on the node buttons. */
  private initDrag() {
    this.nodeTypes.forEach((nodeType: NodeTypeInfo) => {
      const button = $(this.$el).find(`#${nodeType.id}`);
      button.draggable({
        helper: 'clone',
        start: () => {
          // TODO: If the button is clicked without movement, create the node at the center of the screen.
        },
        stop: (evt: Event) => {
          const x = (evt as MouseEvent).pageX;
          const y = (evt as MouseEvent).pageY;
          this.createNode({
            type: nodeType.id,
            x,
            y,
          });
        },
      });
    });
  }

  private mounted() {
    this.initDrag();
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

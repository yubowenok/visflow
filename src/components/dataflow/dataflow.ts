import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';
import Port from '../port/port';
import Edge from '../edge/edge';
import DrawingEdge from '../drawing-edge/drawing-edge';
import Visualization from '../visualization/visualization';
import { namespace } from 'vuex-class';
import { TweenLite } from 'gsap';

import { DEFAULT_ANIMATION_DURATION_S } from '@/common/constants';

const interaction = namespace('interaction');
@Component({
  components: {
    Visualization,
    DrawingEdge,
  },
})
export default class Dataflow extends Vue {
  @interaction.State('draggedPort') private draggedPort!: Port;

  public addNode(node: Node) {
    node.$mount();
    (this.$refs.nodes as Element).appendChild(node.$el);
  }

  public removeNode(node: Node, callback?: () => void) {
    TweenLite.to(node.$el, DEFAULT_ANIMATION_DURATION_S, {
      opacity: 0,
      onComplete: () => {
        (this.$refs.nodes as Element).removeChild(node.$el);
        if (callback) {
          callback();
        }
      },
    });
  }

  /**
   * Adds an edge to the canvas. Each edge consists of one svg <g> element and one context menu, nested under a <div>.
   * The <g> element is appended to the edge svg, and the container <div> is mounted to "edgeMount".
   */
  public addEdge(edge: Edge) {
    edge.$mount();
    (this.$refs.edgeMount as Element).appendChild(edge.$el);
    (this.$refs.edges as Element).appendChild(edge.getEdgeSvgNode());
  }

  public removeEdge(edge: Edge, callback?: () => void) {
    (this.$refs.edgeMount as Element).removeChild(edge.$el);
    TweenLite.to(edge.getEdgeSvgNode(), DEFAULT_ANIMATION_DURATION_S, {
      opacity: 0,
      onComplete: () => {
        (this.$refs.edges as Element).removeChild(edge.getEdgeSvgNode());
        if (callback) {
          callback();
        }
      },
    });
  }
}
